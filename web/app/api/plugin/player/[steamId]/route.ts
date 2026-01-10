import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaintKit, getWeaponDefIndex } from '@/lib/paint-kits'

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  return apiKey === process.env.PLUGIN_API_KEY
}

export async function GET(
  request: NextRequest,
  { params }: { params: { steamId: string } }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { steamId } = params

    const player = await prisma.player.findUnique({
      where: { steamId },
      include: {
        inventory: {
          where: {
            OR: [{ equippedCt: true }, { equippedT: true }]
          },
          select: {
            weapon: true,
            skinName: true,
            floatValue: true,
            dopplerPhase: true,
            itemType: true,
            equippedCt: true,
            equippedT: true,
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const equippedSkins = player.inventory.map(item => ({
      weaponName: item.weapon,
      weaponDefIndex: getWeaponDefIndex(item.weapon),
      paintKit: getPaintKit(item.skinName),
      seed: Math.floor(Math.random() * 1000),
      wear: item.floatValue || 0.1,
      dopplerPhase: item.dopplerPhase,
      isKnife: item.itemType === 'knife',
      isGloves: item.itemType === 'gloves',
      team: item.equippedCt && item.equippedT ? 'both' : item.equippedCt ? 'ct' : 't'
    }))

    return NextResponse.json({
      steamId: player.steamId,
      username: player.username,
      souls: player.souls,
      totalSoulsEarned: player.totalSoulsEarned,
      playtimeMinutes: player.playtimeMinutes,
      premiumTier: player.premiumTier,
      elo: player.elo,
      wins: player.wins,
      losses: player.losses,
      equippedSkins
    })
  } catch (error) {
    console.error('Plugin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
