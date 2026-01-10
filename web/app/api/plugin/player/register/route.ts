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
    const { steamId, username } = await request.json()

    if (!steamId) {
      return NextResponse.json({ error: 'Missing steamId' }, { status: 400 })
    }

    let player = await prisma.player.findUnique({
      where: { steamId }
    })

    if (player) {
      if (username && player.username !== username) {
        player = await prisma.player.update({
          where: { steamId },
          data: { username }
        })
      }
      return NextResponse.json({ 
        message: 'Player already exists', 
        souls: player.souls,
        isNew: false
      })
    }

    const defaultUsername = 'Player_' + steamId.slice(-6)
    player = await prisma.player.create({
      data: {
        steamId,
        username: username || defaultUsername,
        souls: 100,
        totalSoulsEarned: 100,
      }
    })

    await prisma.soulTransaction.create({
      data: {
        playerId: player.id,
        amount: 100,
        type: 'welcome_bonus',
        description: 'Welcome bonus for new player',
        balanceAfter: 100,
      }
    })

    return NextResponse.json({ 
      message: 'Player registered', 
      souls: player.souls,
      isNew: true
    })
  } catch (error) {
    console.error('Plugin register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
