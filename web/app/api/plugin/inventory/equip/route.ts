import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// POST /api/plugin/inventory/equip
// Equip or unequip an inventory item
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const { steamId, inventoryItemId, side, equip = true } = body

    if (!steamId || !inventoryItemId) {
      return errorResponse('Missing required fields: steamId, inventoryItemId')
    }

    if (side && !['ct', 't', 'both'].includes(side)) {
      return errorResponse('Invalid side: must be ct, t, or both')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        playerId: player.id,
      },
    })

    if (!item) {
      return errorResponse('Item not found in inventory', 404)
    }

    // Determine which fields to update
    const updateData: { equippedCt?: boolean; equippedT?: boolean } = {}

    if (equip) {
      // When equipping, first unequip any other items of the same weapon type
      if (side === 'ct' || side === 'both') {
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            weapon: item.weapon,
            equippedCt: true,
            id: { not: item.id },
          },
          data: { equippedCt: false },
        })
        updateData.equippedCt = true
      }

      if (side === 't' || side === 'both') {
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            weapon: item.weapon,
            equippedT: true,
            id: { not: item.id },
          },
          data: { equippedT: false },
        })
        updateData.equippedT = true
      }

      // For knives/gloves, also unequip based on item type
      if (item.itemType === 'knife' || item.itemType === 'gloves') {
        if (side === 'ct' || side === 'both') {
          await prisma.inventoryItem.updateMany({
            where: {
              playerId: player.id,
              itemType: item.itemType,
              equippedCt: true,
              id: { not: item.id },
            },
            data: { equippedCt: false },
          })
        }
        if (side === 't' || side === 'both') {
          await prisma.inventoryItem.updateMany({
            where: {
              playerId: player.id,
              itemType: item.itemType,
              equippedT: true,
              id: { not: item.id },
            },
            data: { equippedT: false },
          })
        }
      }
    } else {
      // Unequipping
      if (side === 'ct' || side === 'both') {
        updateData.equippedCt = false
      }
      if (side === 't' || side === 'both') {
        updateData.equippedT = false
      }
      if (!side) {
        updateData.equippedCt = false
        updateData.equippedT = false
      }
    }

    // Update the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: updateData,
    })

    return jsonResponse({
      success: true,
      item: {
        id: updatedItem.id,
        itemId: updatedItem.itemId,
        name: updatedItem.name,
        weapon: updatedItem.weapon,
        equippedCt: updatedItem.equippedCt,
        equippedT: updatedItem.equippedT,
      },
    })
  } catch (error) {
    console.error('Equip item error:', error)
    return errorResponse('Internal server error', 500)
  }
}
