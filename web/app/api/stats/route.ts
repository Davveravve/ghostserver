import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - Get global statistics
export async function GET() {
  try {
    const [playerCount, totalSoulsEarned] = await Promise.all([
      prisma.player.count(),
      prisma.player.aggregate({
        _sum: { totalSoulsEarned: true },
      }),
    ])

    return NextResponse.json({
      totalPlayers: playerCount,
      onlinePlayers: 0,
      soulsEarned: totalSoulsEarned._sum.totalSoulsEarned || 0,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
