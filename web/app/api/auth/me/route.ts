import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    // Get player's souls from database
    let souls = 0
    try {
      const player = await prisma.player.findUnique({
        where: { steamId },
        select: { souls: true },
      })
      souls = player?.souls ?? 0
    } catch {
      // Database error, continue with 0 souls
    }

    return NextResponse.json({
      steamId: payload.steamId,
      name: payload.name,
      avatar: payload.avatar,
      profileUrl: payload.profileUrl,
      souls,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}
