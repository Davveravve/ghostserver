import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/player/connect
// Called when a player connects to the server
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const { steamId, username, avatarUrl } = body

    if (!steamId || !username) {
      return errorResponse('Missing required fields: steamId, username')
    }

    // Upsert player - create if doesn't exist, update if exists
    const player = await prisma.player.upsert({
      where: { steamId },
      update: {
        username,
        avatarUrl: avatarUrl || null,
        lastSeenAt: new Date(),
      },
      create: {
        steamId,
        username,
        avatarUrl: avatarUrl || null,
      },
      include: {
        inventory: true,
      },
    })

    return jsonResponse({
      success: true,
      player: {
        id: player.id,
        steamId: player.steamId,
        username: player.username,
        souls: player.souls,
        isPremium: player.isPremium,
        premiumTier: player.premiumTier,
        inventory: player.inventory.map(item => ({
          itemId: item.itemId,
          name: item.name,
          weapon: item.weapon,
          skinName: item.skinName,
          wear: item.wear,
          floatValue: item.floatValue,
          itemType: item.itemType,
          equippedCt: item.equippedCt,
          equippedT: item.equippedT,
        })),
      },
    })
  } catch (error) {
    console.error('Player connect error:', error)
    return errorResponse('Internal server error', 500)
  }
}
