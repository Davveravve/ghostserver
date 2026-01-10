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

export async function GET(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const giveaways = await prisma.giveaway.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { entries: true } },
        winners: true,
      },
    })

    return NextResponse.json({ giveaways })
  } catch (error) {
    console.error('Failed to fetch giveaways:', error)
    return NextResponse.json({ error: 'Failed to fetch giveaways' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      prizeType,
      prizeSouls,
      prizeItemId,
      prizeCustom,
      giveawayType,
      leaderboardType,
      winnersCount,
      minSouls,
      minElo,
      requirePremium,
      endsAt,
    } = body

    if (!title || !prizeType || !endsAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const giveaway = await prisma.giveaway.create({
      data: {
        title,
        description: description || null,
        prizeType,
        prizeSouls: prizeSouls || null,
        prizeItemId: prizeItemId || null,
        prizeCustom: prizeCustom || null,
        giveawayType: giveawayType || 'random',
        leaderboardType: leaderboardType || null,
        winnersCount: winnersCount || 1,
        minSouls: minSouls || 0,
        minElo: minElo || 0,
        requirePremium: requirePremium || false,
        endsAt: new Date(endsAt),
      },
    })

    return NextResponse.json({ giveaway })
  } catch (error) {
    console.error('Failed to create giveaway:', error)
    return NextResponse.json({ error: 'Failed to create giveaway' }, { status: 500 })
  }
}
