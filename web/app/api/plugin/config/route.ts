import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PLUGIN_API_KEY = process.env.PLUGIN_API_KEY

// GET - Fetch plugin config (announcements, settings, maps)
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey !== PLUGIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [announcements, settings, maps] = await Promise.all([
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.pluginSettings.findMany(),
      prisma.mapPool.findMany({
        where: { isActive: true },
        orderBy: [{ gameMode: 'asc' }, { tier: 'asc' }]
      })
    ])

    // Convert settings to key-value object
    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    // Group maps by game mode
    const mapsByMode = maps.reduce((acc, map) => {
      if (!acc[map.gameMode]) {
        acc[map.gameMode] = []
      }
      acc[map.gameMode].push({
        workshopId: map.workshopId,
        name: map.name,
        tier: map.tier
      })
      return acc
    }, {} as Record<string, { workshopId: string; name: string; tier: number }[]>)

    return NextResponse.json({
      announcements: announcements.map(a => ({
        name: a.name,
        message: a.message,
        type: a.type,
        color: a.color,
        prefix: a.prefix,
        prefixColor: a.prefixColor
      })),
      settings: settingsObj,
      maps: mapsByMode
    })
  } catch (error) {
    console.error('Plugin config fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}
