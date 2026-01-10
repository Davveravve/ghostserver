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

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalPlayers,
      totalSoulsData,
      totalCasesOpened,
      playersToday,
      soulsToday,
      casesToday,
    ] = await Promise.all([
      prisma.player.count(),
      prisma.player.aggregate({ _sum: { totalSoulsEarned: true } }),
      prisma.caseOpen.count(),
      prisma.player.count({ where: { createdAt: { gte: today } } }),
      prisma.soulTransaction.aggregate({
        where: { createdAt: { gte: today }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.caseOpen.count({ where: { createdAt: { gte: today } } }),
    ])

    return NextResponse.json({
      totalPlayers,
      totalSouls: totalSoulsData._sum.totalSoulsEarned || 0,
      totalCasesOpened,
      playersToday,
      soulsToday: soulsToday._sum.amount || 0,
      casesToday,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
