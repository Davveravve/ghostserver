import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getItemById } from '@/lib/items-data'
import { isAnnouncementItem } from '@/lib/item-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const drops = await prisma.caseOpen.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        player: {
          select: { username: true, avatarUrl: true },
        },
      },
    })

    const recentDrops = drops.map((drop) => {
      const item = getItemById(drop.itemId)
      return {
        id: drop.id,
        player: drop.player.username,
        avatarUrl: drop.player.avatarUrl,
        weapon: drop.itemWeapon,
        skinName: drop.itemName,
        wear: drop.itemWear,
        imageUrl: item?.image_url || null,
        isRare: isAnnouncementItem(drop.itemWeapon, drop.itemName, null),
        createdAt: drop.createdAt,
      }
    })

    return NextResponse.json(recentDrops, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Failed to fetch recent drops:', error)
    return NextResponse.json([], { status: 500 })
  }
}
