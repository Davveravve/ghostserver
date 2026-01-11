import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

// GET - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.pluginSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }]
    })

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, typeof settings>)

    return NextResponse.json({ settings: grouped })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Update or create settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, category, description } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
    }

    const setting = await prisma.pluginSettings.upsert({
      where: { key },
      update: { value: String(value), category, description },
      create: { key, value: String(value), category: category || 'general', description }
    })

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
