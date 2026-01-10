import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

async function getUser(request: NextRequest) {
  const token = request.cookies.get('ghost-session')?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    return payload as { steamId: string; name: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)

    const giveaways = await prisma.giveaway.findMany({
      where: {
        status: 'active',
        endsAt: { gt: new Date() },
      },
      orderBy: { endsAt: 'asc' },
      include: {
        _count: { select: { entries: true } },
        entries: user ? {
          where: { steamId: user.steamId },
          take: 1,
        } : false,
        winners: true,
      },
    })

    // Also get recently ended giveaways (last 7 days)
    const endedGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ended',
        endsAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { endsAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { entries: true } },
        winners: true,
      },
    })

    const formattedGiveaways = giveaways.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      prizeType: g.prizeType,
      prizeSouls: g.prizeSouls,
      prizeItemId: g.prizeItemId,
      prizeCustom: g.prizeCustom,
      giveawayType: g.giveawayType,
      leaderboardType: g.leaderboardType,
      winnersCount: g.winnersCount,
      minSouls: g.minSouls,
      minElo: g.minElo,
      requirePremium: g.requirePremium,
      endsAt: g.endsAt,
      status: g.status,
      entriesCount: g._count.entries,
      hasJoined: user && g.entries && g.entries.length > 0,
    }))

    const formattedEnded = endedGiveaways.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      prizeType: g.prizeType,
      prizeSouls: g.prizeSouls,
      prizeCustom: g.prizeCustom,
      giveawayType: g.giveawayType,
      winnersCount: g.winnersCount,
      endsAt: g.endsAt,
      status: g.status,
      entriesCount: g._count.entries,
      winners: g.winners.map((w) => ({
        username: w.username,
        placement: w.placement,
      })),
    }))

    return NextResponse.json({
      active: formattedGiveaways,
      ended: formattedEnded,
    })
  } catch (error) {
    console.error('Failed to fetch giveaways:', error)
    return NextResponse.json({ error: 'Failed to fetch giveaways' }, { status: 500 })
  }
}
