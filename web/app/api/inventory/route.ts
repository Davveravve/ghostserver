import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { estimateItemPrice } from '@/lib/item-utils'
import type { Rarity, Wear } from '@/types'

// Hämta inloggad användares inventory
export async function GET(request: NextRequest) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verifiera token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    // Hämta eller skapa spelare med inventory
    let player = await prisma.player.findUnique({
      where: { steamId },
      include: {
        inventory: {
          orderBy: { obtainedAt: 'desc' },
        },
      },
    })

    // Om spelaren inte finns, skapa en ny
    if (!player) {
      player = await prisma.player.create({
        data: {
          steamId,
          username: `Player_${steamId.slice(-6)}`,
          souls: 100,
          totalSoulsEarned: 100,
        },
        include: {
          inventory: true,
        },
      })
    }

    // Formatera inventory för frontend
    const inventory = player.inventory.map((item) => {
      const rarity = (item.rarity || 'common') as Rarity
      const wear = item.wear as Wear
      const estimatedPrice = estimateItemPrice(
        rarity,
        item.itemType,
        wear,
        item.dopplerPhase,
        item.weapon,
        item.skinName
      )

      return {
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
        rarity: rarity,
        equippedCt: item.equippedCt,
        equippedT: item.equippedT,
        isFavorite: item.isFavorite,
        obtainedAt: item.obtainedAt.toISOString(),
        obtainedFrom: item.obtainedFrom,
        estimatedPrice,
      }
    })

    return NextResponse.json({
      inventory,
      stats: {
        totalItems: inventory.length,
        souls: player.souls,
        totalSoulsEarned: player.totalSoulsEarned,
        casesOpened: player.casesOpened,
        premiumTier: player.premiumTier,
      },
    })
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
