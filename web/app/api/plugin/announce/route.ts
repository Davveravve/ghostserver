import { NextRequest, NextResponse } from 'next/server'

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  return apiKey === process.env.PLUGIN_API_KEY
}

// This endpoint receives rare drop announcements and forwards to connected servers
// In production, you'd use WebSockets or a message queue
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { playerName, steamId, weaponName, skinName, dopplerPhase } = await request.json()

    // Log the rare drop
    console.log('[RARE DROP]', playerName, 'unboxed', weaponName, '|', skinName, dopplerPhase || '')

    // In production, broadcast to all connected game servers via:
    // - WebSocket connections
    // - RCON commands
    // - Redis pub/sub
    // - etc.

    return NextResponse.json({ 
      message: 'Announcement queued',
      broadcast: true
    })
  } catch (error) {
    console.error('Plugin announce error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
