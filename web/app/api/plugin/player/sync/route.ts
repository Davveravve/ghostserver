import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  return apiKey === process.env.PLUGIN_API_KEY
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { steamId, soulsToAdd, playtimeMinutes } = await request.json()

    if (!steamId) {
      return NextResponse.json({ error: 'Missing steamId' }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { steamId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Add souls (delta) instead of overwriting
    if (typeof soulsToAdd === 'number' && soulsToAdd > 0) {
      updateData.souls = { increment: soulsToAdd }
      updateData.totalSoulsEarned = { increment: soulsToAdd }
    }

    if (typeof playtimeMinutes === 'number') {
      updateData.playtimeMinutes = { increment: playtimeMinutes }
    }

    const updatedPlayer = await prisma.player.update({
      where: { steamId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Player synced',
      souls: updatedPlayer.souls,
      totalSoulsEarned: updatedPlayer.totalSoulsEarned
    })
  } catch (error) {
    console.error('Plugin sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
