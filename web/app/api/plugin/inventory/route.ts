import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateServer, jsonResponse, errorResponse } from '@/lib/api-auth'

// GET /api/plugin/inventory?steamId=xxx
// Get player's full inventory
export async function GET(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const steamId = request.nextUrl.searchParams.get('steamId')

    if (!steamId) {
      return errorResponse('Missing required parameter: steamId')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
      include: {
        inventory: {
          orderBy: { obtainedAt: 'desc' },
        },
      },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    return jsonResponse({
      success: true,
      inventory: player.inventory.map(item => ({
        id: item.id,
        itemId: item.itemId,
        name: item.name,
        weapon: item.weapon,
        skinName: item.skinName,
        wear: item.wear,
        floatValue: item.floatValue,
        imageUrl: item.imageUrl,
        dopplerPhase: item.dopplerPhase,
        itemType: item.itemType,
        equippedCt: item.equippedCt,
        equippedT: item.equippedT,
        obtainedAt: item.obtainedAt,
        obtainedFrom: item.obtainedFrom,
      })),
    })
  } catch (error) {
    console.error('Get inventory error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/plugin/inventory
// Add item to player's inventory (case win, etc.)
export async function POST(request: NextRequest) {
  const auth = await authenticateServer(request)
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status)
  }

  try {
    const body = await request.json()
    const {
      steamId,
      itemId,
      name,
      weapon,
      skinName,
      wear,
      floatValue,
      imageUrl,
      dopplerPhase,
      itemType,
      obtainedFrom,
    } = body

    if (!steamId || !itemId || !name || !weapon || !skinName || !wear || floatValue === undefined || !imageUrl || !itemType) {
      return errorResponse('Missing required fields')
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return errorResponse('Player not found', 404)
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        playerId: player.id,
        itemId,
        name,
        weapon,
        skinName,
        wear,
        floatValue,
        imageUrl,
        dopplerPhase: dopplerPhase || null,
        itemType,
        obtainedFrom: obtainedFrom || null,
      },
    })

    return jsonResponse({
      success: true,
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
    console.error('Add inventory error:', error)
    return errorResponse('Internal server error', 500)
  }
}
