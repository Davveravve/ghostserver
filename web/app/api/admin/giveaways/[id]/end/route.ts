import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

async function isOwner(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('ghost-session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    return payload.steamId === OWNER_STEAM_ID
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { entries: true },
    })

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 })
    }

    if (giveaway.status !== 'active') {
      return NextResponse.json({ error: 'Giveaway is not active' }, { status: 400 })
    }

    let winners: { steamId: string; username: string; placement: number }[] = []

    if (giveaway.giveawayType === 'random') {
      // Pick random winners from entries
      if (giveaway.entries.length === 0) {
        return NextResponse.json({ error: 'No entries to pick from' }, { status: 400 })
      }

      const shuffled = [...giveaway.entries].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(giveaway.winnersCount, shuffled.length))

      winners = selected.map((entry, index) => ({
        steamId: entry.steamId,
        username: entry.username,
        placement: index + 1,
      }))
    } else if (giveaway.giveawayType === 'leaderboard') {
      // Get top players by leaderboard type
      const orderByField = giveaway.leaderboardType === 'elo' ? 'elo' :
                          giveaway.leaderboardType === 'souls' ? 'totalSoulsEarned' :
                          giveaway.leaderboardType === 'kills' ? 'totalKills' : 'elo'

      const topPlayers = await prisma.player.findMany({
        orderBy: { [orderByField]: 'desc' },
        take: giveaway.winnersCount,
        where: {
          ...(giveaway.minSouls > 0 && { souls: { gte: giveaway.minSouls } }),
          ...(giveaway.minElo > 0 && { elo: { gte: giveaway.minElo } }),
          ...(giveaway.requirePremium && { isPremium: true }),
        },
      })

      winners = topPlayers.map((player, index) => ({
        steamId: player.steamId,
        username: player.username,
        placement: index + 1,
      }))
    }

    // Create winner records and update giveaway status
    await prisma.$transaction([
      ...winners.map((winner) =>
        prisma.giveawayWinner.create({
          data: {
            giveawayId: id,
            steamId: winner.steamId,
            username: winner.username,
            placement: winner.placement,
          },
        })
      ),
      prisma.giveaway.update({
        where: { id },
        data: { status: 'ended' },
      }),
    ])

    // Award souls prizes automatically
    if (giveaway.prizeType === 'souls' && giveaway.prizeSouls) {
      for (const winner of winners) {
        const player = await prisma.player.findUnique({
          where: { steamId: winner.steamId },
        })

        if (player) {
          await prisma.player.update({
            where: { steamId: winner.steamId },
            data: { souls: { increment: giveaway.prizeSouls } },
          })

          await prisma.soulTransaction.create({
            data: {
              playerId: player.id,
              amount: giveaway.prizeSouls,
              type: 'giveaway',
              description: `Won giveaway: ${giveaway.title}`,
              balanceAfter: player.souls + giveaway.prizeSouls,
            },
          })

          // Mark as claimed for souls prizes
          await prisma.giveawayWinner.updateMany({
            where: { giveawayId: id, steamId: winner.steamId },
            data: { claimed: true, claimedAt: new Date() },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      winners,
    })
  } catch (error) {
    console.error('Failed to end giveaway:', error)
    return NextResponse.json({ error: 'Failed to end giveaway' }, { status: 500 })
  }
}
