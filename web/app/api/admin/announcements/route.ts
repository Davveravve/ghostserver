import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

// Available colors for the plugin
const CHAT_COLORS = [
  { id: 'red', name: 'Red', hex: '#ff4444' },
  { id: 'darkred', name: 'Dark Red', hex: '#aa0000' },
  { id: 'orange', name: 'Orange', hex: '#ff9944' },
  { id: 'yellow', name: 'Yellow', hex: '#ffff44' },
  { id: 'gold', name: 'Gold', hex: '#ffd700' },
  { id: 'green', name: 'Green', hex: '#44ff44' },
  { id: 'lime', name: 'Lime', hex: '#00ff00' },
  { id: 'blue', name: 'Blue', hex: '#4444ff' },
  { id: 'lightblue', name: 'Light Blue', hex: '#44aaff' },
  { id: 'purple', name: 'Purple', hex: '#a855f7' },
  { id: 'magenta', name: 'Magenta', hex: '#ff44ff' },
  { id: 'grey', name: 'Grey', hex: '#888888' },
  { id: 'white', name: 'White', hex: '#ffffff' },
]

// GET - Fetch all announcements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ announcements, colors: CHAT_COLORS })
  } catch (error) {
    console.error('Announcements fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, message, type, color, prefix, prefixColor, isActive } = body

    if (!name || !message) {
      return NextResponse.json({ error: 'Name and message required' }, { status: 400 })
    }

    // Get max sortOrder
    const maxOrder = await prisma.announcement.aggregate({
      _max: { sortOrder: true }
    })

    const announcement = await prisma.announcement.create({
      data: {
        name,
        message,
        type: type || 'chat',
        color: color || 'white',
        prefix: prefix || '[Ghost]',
        prefixColor: prefixColor || 'purple',
        isActive: isActive ?? true,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      }
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Announcement create error:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

// PUT - Update announcement
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, message, type, color, prefix, prefixColor, isActive, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(message !== undefined && { message }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
        ...(prefix !== undefined && { prefix }),
        ...(prefixColor !== undefined && { prefixColor }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Announcement update error:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE - Remove announcement
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

    await prisma.announcement.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Announcement delete error:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
