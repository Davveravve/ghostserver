import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { isAnnouncementItem } from '@/lib/item-utils'

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in (optional)
    let currentUserSteamId: string | null = null
    const token = request.cookies.get('ghost-session')?.value

    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.NEXTAUTH_SECRET || 'your-secret-key'
        )
        const { payload } = await jwtVerify(token, secret)
        currentUserSteamId = payload.steamId as string
      } catch {
        // Token invalid, continue without user
      }
    }

    // Fetch top 10 players by total souls earned
    const topSouls = await prisma.player.findMany({
      orderBy: { totalSoulsEarned: 'desc' },
      take: 10,
      select: {
        id: true,
        steamId: true,
        username: true,
        avatarUrl: true,
        totalSoulsEarned: true,
        playtimeMinutes: true,
      },
    })

    // Fetch top 10 players by ELO
    const topElo = await prisma.player.findMany({
      orderBy: { elo: 'desc' },
      take: 10,
      select: {
        id: true,
        steamId: true,
        username: true,
        avatarUrl: true,
        elo: true,
        wins: true,
        losses: true,
      },
    })

    // Fetch top 10 players by cases opened
    const topCasesOpened = await prisma.player.findMany({
      orderBy: { casesOpened: 'desc' },
      take: 10,
      select: {
        id: true,
        steamId: true,
        username: true,
        avatarUrl: true,
        casesOpened: true,
      },
    })

    // Fetch players with most rare items (announcement-worthy items)
    // We need to count rare items per player
    const playersWithRareItems = await prisma.player.findMany({
      include: {
        inventory: {
          select: {
            weapon: true,
            skinName: true,
            dopplerPhase: true,
            rarity: true,
          },
        },
      },
    })

    // Calculate rare items count and best drop for each player
    const rareItemsData = playersWithRareItems
      .map((player) => {
        const rareItems = player.inventory.filter((item) =>
          isAnnouncementItem(item.weapon, item.skinName, item.dopplerPhase)
        )

        // Find best item (legendary/ultra rarity, or any announcement item)
        const bestItem = rareItems[0] // Just take first rare item as "best" for now

        return {
          id: player.id,
          steamId: player.steamId,
          username: player.username,
          avatarUrl: player.avatarUrl,
          rareCount: rareItems.length,
          bestDrop: bestItem
            ? `${bestItem.weapon} | ${bestItem.skinName}`
            : null,
        }
      })
      .filter((p) => p.rareCount > 0)
      .sort((a, b) => b.rareCount - a.rareCount)
      .slice(0, 5)

    // Get current user's stats and rankings if logged in
    let currentUserStats = null
    if (currentUserSteamId) {
      const currentUser = await prisma.player.findUnique({
        where: { steamId: currentUserSteamId },
        select: {
          id: true,
          steamId: true,
          username: true,
          avatarUrl: true,
          totalSoulsEarned: true,
          playtimeMinutes: true,
          casesOpened: true,
          inventory: {
            select: {
              weapon: true,
              skinName: true,
              dopplerPhase: true,
            },
          },
        },
      })

      if (currentUser) {
        // Calculate user's rank in souls leaderboard
        const soulsRank = await prisma.player.count({
          where: { totalSoulsEarned: { gt: currentUser.totalSoulsEarned } },
        })

        // Calculate user's rank in cases opened leaderboard
        const casesRank = await prisma.player.count({
          where: { casesOpened: { gt: currentUser.casesOpened } },
        })

        // Count user's rare items
        const userRareItems = currentUser.inventory.filter((item) =>
          isAnnouncementItem(item.weapon, item.skinName, item.dopplerPhase)
        )

        currentUserStats = {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          totalSoulsEarned: currentUser.totalSoulsEarned,
          playtimeMinutes: currentUser.playtimeMinutes,
          casesOpened: currentUser.casesOpened,
          rareItems: userRareItems.length,
          soulsRank: soulsRank + 1,
          casesRank: casesRank + 1,
        }
      }
    }

    return NextResponse.json({
      topSouls: topSouls.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatarUrl: p.avatarUrl,
        souls: p.totalSoulsEarned,
        playtime: p.playtimeMinutes,
      })),
      topElo: topElo.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatarUrl: p.avatarUrl,
        elo: p.elo,
        wins: p.wins,
        losses: p.losses,
      })),
      topCasesOpened: topCasesOpened.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatarUrl: p.avatarUrl,
        casesOpened: p.casesOpened,
      })),
      topRareItems: rareItemsData.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatarUrl: p.avatarUrl,
        rareCount: p.rareCount,
        bestDrop: p.bestDrop,
      })),
      currentUser: currentUserStats,
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
