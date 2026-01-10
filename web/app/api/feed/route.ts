import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Hämta senaste rare drops för live feed
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const since = searchParams.get('since') // ISO timestamp för att bara hämta nya

  try {
    // Hämta senaste case opens med player data
    const caseOpens = await prisma.caseOpen.findMany({
      where: since
        ? {
            createdAt: {
              gt: new Date(since),
            },
          }
        : undefined,
      include: {
        player: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Formatera för frontend
    const items = caseOpens.map((open) => ({
      id: open.id,
      player: open.player.username,
      playerAvatar: open.player.avatarUrl,
      item: open.itemName,
      weapon: open.itemWeapon,
      wear: open.itemWear,
      floatValue: open.floatValue,
      caseName: open.caseName,
      // Bestäm rarity baserat på item type (knives/gloves = legendary)
      rarity: getRarity(open.itemWeapon, open.itemName),
      timestamp: open.createdAt.toISOString(),
    }))

    return NextResponse.json({
      items,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

// Bestäm rarity baserat på vapen/item
function getRarity(weapon: string, itemName: string): string {
  const legendaryKeywords = ['Karambit', 'Butterfly', 'M9 Bayonet', 'Bayonet', 'Gloves', 'Dragon Lore', 'Howl', 'Medusa', 'Fade']
  const epicKeywords = ['Asiimov', 'Fire Serpent', 'Hyper Beast', 'Neo-Noir', 'Neon']

  const fullName = `${weapon} ${itemName}`

  if (legendaryKeywords.some((kw) => fullName.includes(kw))) {
    return 'legendary'
  }
  if (epicKeywords.some((kw) => fullName.includes(kw))) {
    return 'epic'
  }
  return 'rare'
}
