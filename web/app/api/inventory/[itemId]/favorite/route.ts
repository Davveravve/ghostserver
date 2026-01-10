import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

// Toggle favorite status for an inventory item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    const { itemId } = await params

    // Find player
    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Find the inventory item and verify ownership
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        playerId: player.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Toggle favorite status
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { isFavorite: !item.isFavorite },
    })

    return NextResponse.json({
      success: true,
      isFavorite: updatedItem.isFavorite,
    })
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
}
