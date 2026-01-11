import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

// GET - Fetch all maps
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const maps = await prisma.mapPool.findMany({
      orderBy: [{ gameMode: 'asc' }, { tier: 'asc' }, { name: 'asc' }]
    })

    // Group by gameMode
    const grouped = maps.reduce((acc, map) => {
      if (!acc[map.gameMode]) {
        acc[map.gameMode] = []
      }
      acc[map.gameMode].push(map)
      return acc
    }, {} as Record<string, typeof maps>)

    return NextResponse.json({ maps: grouped, all: maps })
  } catch (error) {
    console.error('Maps fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch maps' }, { status: 500 })
  }
}

// POST - Add new map
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workshopId, name, gameMode, tier, imageUrl } = body

    if (!workshopId || !name || !gameMode) {
      return NextResponse.json({ error: 'Workshop ID, name, and game mode required' }, { status: 400 })
    }

    const map = await prisma.mapPool.create({
      data: {
        workshopId,
        name,
        gameMode,
        tier: tier || 1,
        imageUrl,
        isActive: true
      }
    })

    return NextResponse.json({ map })
  } catch (error) {
    console.error('Map create error:', error)
    return NextResponse.json({ error: 'Failed to add map' }, { status: 500 })
  }
}

// PUT - Update map
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, workshopId, name, gameMode, tier, isActive, imageUrl } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const map = await prisma.mapPool.update({
      where: { id },
      data: {
        ...(workshopId && { workshopId }),
        ...(name && { name }),
        ...(gameMode && { gameMode }),
        ...(tier !== undefined && { tier }),
        ...(isActive !== undefined && { isActive }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })

    return NextResponse.json({ map })
  } catch (error) {
    console.error('Map update error:', error)
    return NextResponse.json({ error: 'Failed to update map' }, { status: 500 })
  }
}

// DELETE - Remove map
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.mapPool.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Map delete error:', error)
    return NextResponse.json({ error: 'Failed to delete map' }, { status: 500 })
  }
}
