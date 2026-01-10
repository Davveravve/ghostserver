import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/server/heartbeat
// Update server status
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const { currentPlayers, maxPlayers, currentMap } = body

    await prisma.server.update({
      where: { id: auth.server.id },
      data: {
        isOnline: true,
        currentPlayers: currentPlayers ?? auth.server.currentPlayers,
        maxPlayers: maxPlayers ?? auth.server.maxPlayers,
        currentMap: currentMap ?? auth.server.currentMap,
        lastHeartbeat: new Date(),
      },
    })

    return jsonResponse({
      success: true,
      message: 'Heartbeat received',
    })
  } catch (error) {
    console.error('Server heartbeat error:', error)
    return errorResponse('Internal server error', 500)
  }
}
