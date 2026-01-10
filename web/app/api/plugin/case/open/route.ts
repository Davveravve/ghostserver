import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/case/open
// Record a case opening and add item to inventory
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const {
      steamId,
      caseName,
      caseId,
      soulsCost,
      item: wonItem,
    } = body

    if (!steamId || !caseName || caseId === undefined || !soulsCost || !wonItem) {
      return errorResponse('Missing required fields')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    // Check if player has enough souls
    if (player.souls < soulsCost) {
      return errorResponse('Insufficient souls', 400)
    }

    // Apply premium discount
    const discounts: Record<string, number> = {
      none: 0,
      bronze: 0.05,
      silver: 0.10,
      gold: 0.20,
    }
    const discount = discounts[player.premiumTier] || 0
    const finalCost = Math.floor(soulsCost * (1 - discount))

    // Transaction: spend souls, add item to inventory, record case open
    const [updatedPlayer, inventoryItem, caseOpen] = await prisma.$transaction([
      // Deduct souls
      prisma.player.update({
        where: { steamId },
        data: {
          souls: { decrement: finalCost },
          casesOpened: { increment: 1 },
        },
      }),

      // Add item to inventory
      prisma.inventoryItem.create({
        data: {
          playerId: player.id,
          itemId: wonItem.itemId,
          name: wonItem.name,
          weapon: wonItem.weapon,
          skinName: wonItem.skinName,
          wear: wonItem.wear,
          floatValue: wonItem.floatValue,
          imageUrl: wonItem.imageUrl,
          dopplerPhase: wonItem.dopplerPhase || null,
          itemType: wonItem.itemType,
          obtainedFrom: caseName,
        },
      }),

      // Record case open
      prisma.caseOpen.create({
        data: {
          playerId: player.id,
          caseName,
          caseId,
          itemId: wonItem.itemId,
          itemName: wonItem.name,
          itemWeapon: wonItem.weapon,
          itemWear: wonItem.wear,
          floatValue: wonItem.floatValue,
          soulsCost: finalCost,
        },
      }),
    ])

    // Record transaction
    await prisma.soulTransaction.create({
      data: {
        playerId: player.id,
        amount: -finalCost,
        type: 'case_open',
        description: `Opened ${caseName}`,
        balanceAfter: updatedPlayer.souls,
      },
    })

    return jsonResponse({
      success: true,
      soulsCost: finalCost,
      discountApplied: discount > 0 ? `${discount * 100}%` : null,
      newBalance: updatedPlayer.souls,
      item: {
        id: inventoryItem.id,
        itemId: inventoryItem.itemId,
        name: inventoryItem.name,
        weapon: inventoryItem.weapon,
        skinName: inventoryItem.skinName,
        wear: inventoryItem.wear,
        floatValue: inventoryItem.floatValue,
        itemType: inventoryItem.itemType,
      },
    })
  } catch (error) {
    console.error('Case open error:', error)
    return errorResponse('Internal server error', 500)
  }
}
