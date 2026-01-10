import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID || ''

async function verifyOwner(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('ghost-session')?.value
  if (!token) return false

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || '')
    const { payload } = await jwtVerify(token, secret)
    return payload.steamId === OWNER_STEAM_ID
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!await verifyOwner(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''

  try {
    // Om ingen query, visa alla spelare (senaste först)
    const whereClause = query.trim()
      ? {
          OR: [
            { username: { contains: query } },
            { steamId: { contains: query } },
          ],
        }
      : {}

    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        id: true,
        steamId: true,
        username: true,
        avatarUrl: true,
        souls: true,
        elo: true,
        premiumTier: true,
        isPremium: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
