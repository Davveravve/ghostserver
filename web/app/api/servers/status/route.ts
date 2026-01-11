import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Server configuration - update this with your actual servers
const SERVERS = [
  {
    id: 'surf',
    name: 'Ghost Surf',
    ip: '46.224.197.229',
    port: 27015,
    gameMode: 'surf',
    maxPlayers: 32,
  },
  {
    id: 'bhop',
    name: 'Ghost Bhop',
    ip: '46.224.197.229',
    port: 27016,
    gameMode: 'bhop',
    maxPlayers: 32,
  },
  {
    id: 'retake',
    name: 'Ghost Retake',
    ip: '46.224.197.229',
    port: 27017,
    gameMode: 'retake',
    maxPlayers: 16,
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

// Query Source server for info
async function queryServer(ip: string, port: number): Promise<{ players: number; map: string; isOnline: boolean }> {
  try {
    // Try to get from database first (from heartbeat)
    const server = await prisma.server.findFirst({
      where: {
        ip,
        port,
        lastHeartbeat: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
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

    // If no recent heartbeat, server is probably offline
    return { players: 0, map: 'Offline', isOnline: false }
  } catch (error) {
    console.error(`Failed to query server ${ip}:${port}:`, error)
    return { players: 0, map: 'Error', isOnline: false }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Query all servers in parallel
    const statuses = await Promise.all(
      SERVERS.map(async (server): Promise<ServerStatus> => {
        const status = await queryServer(server.ip, server.port)
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
    })
  } catch (error) {
    console.error('Server status error:', error)
    return NextResponse.json({ error: 'Failed to get server status' }, { status: 500 })
  }
}
