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

export async function POST(request: NextRequest) {
  if (!await verifyOwner(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, souls, elo, premiumTier } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
    }

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        souls: souls ?? undefined,
        elo: elo ?? undefined,
        premiumTier: premiumTier ?? undefined,
        isPremium: premiumTier && premiumTier !== 'none' ? true : false,
      },
    })

    // Log the change
    if (souls !== undefined) {
      const currentPlayer = await prisma.player.findUnique({ where: { id } })
      if (currentPlayer) {
        await prisma.soulTransaction.create({
          data: {
            playerId: id,
            amount: souls - (currentPlayer.souls - souls), // Difference
            type: 'admin',
            description: 'Admin adjustment',
            balanceAfter: souls,
          },
        })
      }
    }

    return NextResponse.json({ success: true, player: updatedPlayer })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
