import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - Hämta global statistik
export async function GET() {
  try {
    // Hämta alla stats parallellt
    const [playerCount, totalCasesOpened, totalSoulsEarned, recentDrops] = await Promise.all([
      // Total antal spelare
      prisma.player.count(),

      // Totalt antal öppnade cases
      prisma.caseOpen.count(),

      // Totalt antal souls som tjänats
      prisma.player.aggregate({
        _sum: { totalSoulsEarned: true },
      }),

      // Senaste rare drops (knivar och handskar)
      prisma.caseOpen.findMany({
        where: {
          OR: [
            { itemWeapon: { contains: 'Knife' } },
            { itemWeapon: { contains: 'Karambit' } },
            { itemWeapon: { contains: 'Bayonet' } },
            { itemWeapon: { contains: 'Gloves' } },
            { itemWeapon: { contains: 'AWP' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          player: {
            select: { username: true },
          },
        },
      }),
    ])

    // Online spelare - just nu placeholder (0) då vi inte har live server data
    const onlinePlayers = 0

    return NextResponse.json({
      totalPlayers: playerCount,
      onlinePlayers,
      casesOpened: totalCasesOpened,
      soulsEarned: totalSoulsEarned._sum.totalSoulsEarned || 0,
      recentDrops: recentDrops.map((drop) => ({
        player: drop.player.username,
        item: `${drop.itemWeapon} | ${drop.itemName}`,
        wear: drop.itemWear,
        isSpecial: drop.itemWeapon.includes('Knife') ||
                   drop.itemWeapon.includes('Karambit') ||
                   drop.itemWeapon.includes('Bayonet') ||
                   drop.itemWeapon.includes('Gloves'),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
