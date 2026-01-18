import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

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

    // Fetch top 10 players by playtime
    const topPlaytime = await prisma.player.findMany({
      orderBy: { playtimeMinutes: 'desc' },
      take: 10,
      select: {
        id: true,
        steamId: true,
        username: true,
        avatarUrl: true,
        playtimeMinutes: true,
      },
    })

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
          elo: true,
          wins: true,
          losses: true,
        },
      })

      if (currentUser) {
        // Calculate user's rank in souls leaderboard
        const soulsRank = await prisma.player.count({
          where: { totalSoulsEarned: { gt: currentUser.totalSoulsEarned } },
        })

        // Calculate user's rank in ELO leaderboard
        const eloRank = await prisma.player.count({
          where: { elo: { gt: currentUser.elo } },
        })

        currentUserStats = {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          totalSoulsEarned: currentUser.totalSoulsEarned,
          playtimeMinutes: currentUser.playtimeMinutes,
          elo: currentUser.elo,
          wins: currentUser.wins,
          losses: currentUser.losses,
          soulsRank: soulsRank + 1,
          eloRank: eloRank + 1,
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
      topPlaytime: topPlaytime.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatarUrl: p.avatarUrl,
        playtime: p.playtimeMinutes,
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
