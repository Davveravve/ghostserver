import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import dgram from 'dgram'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server configuration - our active servers
const SERVERS = [
  {
    id: 'surf',
    name: 'Ghost Surf',
    ip: '46.224.197.229',
    port: 27015,
    gameMode: 'surf',
    maxPlayers: 32,
  },
]

interface ServerStatus {
  id: string
  name: string
  ip: string
  port: number
  gameMode: string
  maxPlayers: number
  players: number
  map: string
  isOnline: boolean
}

// A2S_INFO query packet
const A2S_INFO = Buffer.from([
  0xFF, 0xFF, 0xFF, 0xFF, // Header
  0x54, // T - A2S_INFO
  0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00 // "Source Engine Query\0"
])

// Query Source server using A2S_INFO protocol
async function queryServerUDP(ip: string, port: number): Promise<{ players: number; map: string; isOnline: boolean; name?: string }> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4')
    const timeout = setTimeout(() => {
      socket.close()
      resolve({ players: 0, map: 'Offline', isOnline: false })
    }, 3000)

    socket.on('message', (msg) => {
      clearTimeout(timeout)
      try {
        // Check for challenge response (CS2 uses this)
        if (msg.length > 4 && msg.readUInt8(4) === 0x41) {
          // Got A2S_SERVERQUERY_GETCHALLENGE response, need to resend with challenge
          const challenge = msg.slice(5, 9)
          const challengePacket = Buffer.concat([A2S_INFO, challenge])
          socket.send(challengePacket, port, ip)
          return
        }

        // Check header
        const header = msg.readInt32LE(0)
        const type = msg.readUInt8(4)

        if (header !== -1 || type !== 0x49) { // 0x49 = 'I' for A2S_INFO response
          socket.close()
          resolve({ players: 0, map: 'Unknown', isOnline: true }) // Server responded but different format
          return
        }

        let offset = 5

        // Protocol version
        offset += 1

        // Read server name (null-terminated string)
        let nameEnd = msg.indexOf(0, offset)
        if (nameEnd === -1) nameEnd = offset
        const name = msg.toString('utf8', offset, nameEnd)
        offset = nameEnd + 1

        // Read map (null-terminated string)
        let mapEnd = msg.indexOf(0, offset)
        if (mapEnd === -1) mapEnd = offset
        const map = msg.toString('utf8', offset, mapEnd)
        offset = mapEnd + 1

        // Skip folder
        let folderEnd = msg.indexOf(0, offset)
        if (folderEnd === -1) folderEnd = offset
        offset = folderEnd + 1

        // Skip game
        let gameEnd = msg.indexOf(0, offset)
        if (gameEnd === -1) gameEnd = offset
        offset = gameEnd + 1

        // Skip app ID (2 bytes)
        offset += 2

        // Read players (1 byte) - make sure we don't read past buffer
        const players = offset < msg.length ? msg.readUInt8(offset) : 0

        socket.close()
        resolve({ players: Math.min(players, 64), map: map || 'Unknown', isOnline: true, name })
      } catch (e) {
        socket.close()
        resolve({ players: 0, map: 'Error', isOnline: false })
      }
    })

    socket.on('error', () => {
      clearTimeout(timeout)
      socket.close()
      resolve({ players: 0, map: 'Offline', isOnline: false })
    })

    socket.send(A2S_INFO, port, ip)
  })
}

// Fallback: Try to get from database
async function queryServerDB(ip: string, port: number): Promise<{ players: number; map: string; isOnline: boolean } | null> {
  try {
    const server = await prisma.server.findFirst({
      where: {
        ip,
        port,
        lastHeartbeat: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    })

    if (server) {
      return {
        players: server.currentPlayers,
        map: server.currentMap || 'Unknown',
        isOnline: server.isOnline
      }
    }
    return null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Query all servers in parallel
    const statuses = await Promise.all(
      SERVERS.map(async (server): Promise<ServerStatus> => {
        // Try UDP query first
        let status = await queryServerUDP(server.ip, server.port)

        // If UDP fails, try database
        if (!status.isOnline) {
          const dbStatus = await queryServerDB(server.ip, server.port)
          if (dbStatus && dbStatus.isOnline) {
            status = dbStatus
          }
        }

        return {
          ...server,
          players: status.players,
          map: status.map,
          isOnline: status.isOnline
        }
      })
    )

    // Calculate totals
    const totalPlayers = statuses.reduce((sum, s) => sum + (s.isOnline ? s.players : 0), 0)
    const onlineServers = statuses.filter(s => s.isOnline).length

    return NextResponse.json({
      servers: statuses,
      totalPlayers,
      onlineServers,
      totalServers: SERVERS.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Server status error:', error)
    return NextResponse.json({ error: 'Failed to get server status' }, { status: 500 })
  }
}
