import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/player/stats
// Update player stats (kills, playtime, etc.)
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const { steamId, kills, playtimeMinutes } = body

    if (!steamId) {
      return errorResponse('Missing required field: steamId')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    // Calculate soul multiplier based on premium tier
    const multipliers: Record<string, number> = {
      none: 1,
      bronze: 2,
      silver: 3,
      gold: 5,
    }
    const multiplier = multipliers[player.premiumTier] || 1

    // Calculate souls to award
    let soulsEarned = 0
    const transactions: { type: string; amount: number; description: string }[] = []

    if (kills && kills > 0) {
      const killSouls = kills * 10 * multiplier
      soulsEarned += killSouls
      transactions.push({
        type: 'kill',
        amount: killSouls,
        description: `${kills} kills (${multiplier}x multiplier)`,
      })
    }

    if (playtimeMinutes && playtimeMinutes > 0) {
      // 1 soul per minute of playtime
      const playtimeSouls = playtimeMinutes * 1 * multiplier
      soulsEarned += playtimeSouls
      transactions.push({
        type: 'playtime',
        amount: playtimeSouls,
        description: `${playtimeMinutes} minutes played (${multiplier}x multiplier)`,
      })
    }

    // Update player stats and souls
    const updatedPlayer = await prisma.player.update({
      where: { steamId },
      data: {
        totalKills: { increment: kills || 0 },
        playtimeMinutes: { increment: playtimeMinutes || 0 },
        souls: { increment: soulsEarned },
        totalSoulsEarned: { increment: soulsEarned },
        lastSeenAt: new Date(),
      },
    })

    // Create transaction records
    for (const tx of transactions) {
      await prisma.soulTransaction.create({
        data: {
          playerId: player.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          balanceAfter: updatedPlayer.souls,
        },
      })
    }

    return jsonResponse({
      success: true,
      soulsEarned,
      newBalance: updatedPlayer.souls,
      multiplier,
    })
  } catch (error) {
    console.error('Player stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}
