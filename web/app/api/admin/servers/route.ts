import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse } from '@/lib/api-auth'
import { randomBytes } from 'crypto'

// For now, use a simple admin key. In production, use proper auth.
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'ghost-admin-secret'

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  return adminKey === ADMIN_KEY
}

// GET /api/admin/servers
// List all servers
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({
      success: true,
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        ip: s.ip,
        port: s.port,
        apiKey: s.apiKey,
        isOnline: s.isOnline,
        currentPlayers: s.currentPlayers,
        maxPlayers: s.maxPlayers,
        currentMap: s.currentMap,
        lastHeartbeat: s.lastHeartbeat,
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error('List servers error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/admin/servers
// Create a new server
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const body = await request.json()
    const { name, ip, port } = body

    if (!name) {
      return errorResponse('Missing required field: name')
    }

    // Generate a unique API key
    const apiKey = `ghost_${randomBytes(32).toString('hex')}`

    const server = await prisma.server.create({
      data: {
        name,
        ip: ip || null,
        port: port || null,
        apiKey,
      },
    })

    return jsonResponse({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        ip: server.ip,
        port: server.port,
        apiKey: server.apiKey,
        createdAt: server.createdAt,
      },
    })
  } catch (error) {
    console.error('Create server error:', error)
    return errorResponse('Internal server error', 500)
  }
}
