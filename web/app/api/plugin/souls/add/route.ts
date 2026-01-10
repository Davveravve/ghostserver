import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/souls/add
// Add souls to a player (admin/bonus rewards)
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const { steamId, amount, type = 'bonus', description } = body

    if (!steamId || !amount) {
      return errorResponse('Missing required fields: steamId, amount')
    }

    if (amount <= 0) {
      return errorResponse('Amount must be positive')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    // Update player souls
    const updatedPlayer = await prisma.player.update({
      where: { steamId },
      data: {
        souls: { increment: amount },
        totalSoulsEarned: { increment: amount },
      },
    })

    // Create transaction record
    await prisma.soulTransaction.create({
      data: {
        playerId: player.id,
        amount,
        type,
        description: description || `${type} souls added`,
        balanceAfter: updatedPlayer.souls,
      },
    })

    return jsonResponse({
      success: true,
      amount,
      newBalance: updatedPlayer.souls,
    })
  } catch (error) {
    console.error('Add souls error:', error)
    return errorResponse('Internal server error', 500)
  }
}
