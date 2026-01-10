import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
    })

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 })
    }

    if (giveaway.status !== 'active') {
      return NextResponse.json({ error: 'Giveaway is not active' }, { status: 400 })
    }

    if (new Date() > giveaway.endsAt) {
      return NextResponse.json({ error: 'Giveaway has ended' }, { status: 400 })
    }

    // Leaderboard giveaways don't need entries
    if (giveaway.giveawayType === 'leaderboard') {
      return NextResponse.json({ error: 'This is a leaderboard giveaway - no entry needed' }, { status: 400 })
    }

    // Check requirements
    const player = await prisma.player.findUnique({
      where: { steamId: user.steamId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found. Play on a server first!' }, { status: 400 })
    }

    if (giveaway.minSouls > 0 && player.souls < giveaway.minSouls) {
      return NextResponse.json({ error: `Requires ${giveaway.minSouls} souls to enter` }, { status: 400 })
    }

    if (giveaway.minElo > 0 && player.elo < giveaway.minElo) {
      return NextResponse.json({ error: `Requires ${giveaway.minElo} ELO to enter` }, { status: 400 })
    }

    if (giveaway.requirePremium && !player.isPremium) {
      return NextResponse.json({ error: 'Requires ASCENDED membership to enter' }, { status: 400 })
    }

    // Check if already entered
    const existing = await prisma.giveawayEntry.findUnique({
      where: {
        giveawayId_steamId: {
          giveawayId: id,
          steamId: user.steamId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already entered' }, { status: 400 })
    }

    // Create entry
    await prisma.giveawayEntry.create({
      data: {
        giveawayId: id,
        steamId: user.steamId,
        username: player.username,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to join giveaway:', error)
    return NextResponse.json({ error: 'Failed to join giveaway' }, { status: 500 })
  }
}
