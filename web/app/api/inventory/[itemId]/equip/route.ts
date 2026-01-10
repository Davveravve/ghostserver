import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

// Equip an inventory item for CT, T, or both teams
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
    const body = await request.json()
    const team = body.team as 'ct' | 't' | 'both'

    if (!team || !['ct', 't', 'both'].includes(team)) {
      return NextResponse.json({ error: 'Invalid team' }, { status: 400 })
    }

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

    // Unequip other items of the same weapon type for the selected team(s)
    const unequipCt = team === 'ct' || team === 'both'
    const unequipT = team === 't' || team === 'both'

    if (unequipCt) {
      await prisma.inventoryItem.updateMany({
        where: {
          playerId: player.id,
          weapon: item.weapon,
          equippedCt: true,
          id: { not: itemId },
        },
        data: { equippedCt: false },
      })
    }

    if (unequipT) {
      await prisma.inventoryItem.updateMany({
        where: {
          playerId: player.id,
          weapon: item.weapon,
          equippedT: true,
          id: { not: itemId },
        },
        data: { equippedT: false },
      })
    }

    // Equip the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        equippedCt: unequipCt ? true : item.equippedCt,
        equippedT: unequipT ? true : item.equippedT,
      },
    })

    return NextResponse.json({
      success: true,
      weapon: item.weapon,
      equippedCt: updatedItem.equippedCt,
      equippedT: updatedItem.equippedT,
    })
  } catch (error) {
    console.error('Failed to equip item:', error)
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    )
  }
}

// Unequip an inventory item from both teams
export async function DELETE(
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

    // Unequip the item
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        equippedCt: false,
        equippedT: false,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to unequip item:', error)
    return NextResponse.json(
      { error: 'Failed to unequip item' },
      { status: 500 }
    )
  }
}
