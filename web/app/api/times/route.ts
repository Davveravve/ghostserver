import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch leaderboard times
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mapName = searchParams.get('map')
    const style = searchParams.get('style') || 'normal'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!mapName) {
      // Return all maps with WRs
      const worldRecords = await prisma.playerTime.findMany({
        where: { isWr: true },
        orderBy: { mapName: 'asc' }
      })

      return NextResponse.json({ records: worldRecords })
    }

    // Get leaderboard for specific map
    const times = await prisma.playerTime.findMany({
      where: {
        mapName,
        style
      },
      orderBy: { time: 'asc' },
      take: limit
    })

    // Get WR
    const wr = times[0] || null

    return NextResponse.json({
      map: mapName,
      style,
      wr,
      leaderboard: times.map((t, i) => ({
        rank: i + 1,
        steamId: t.steamId,
        time: t.time,
        formattedTime: formatTime(t.time),
        checkpoints: t.checkpoints,
        date: t.createdAt
      }))
    })
  } catch (error) {
    console.error('Times fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch times' }, { status: 500 })
  }
}

// POST - Record a new time (from SharpTimer plugin)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey !== process.env.PLUGIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { steamId, mapName, style, time, checkpoints } = body

    if (!steamId || !mapName || time === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if this is a new WR
    const currentWr = await prisma.playerTime.findFirst({
      where: { mapName, style: style || 'normal', isWr: true }
    })

    const isNewWr = !currentWr || time < currentWr.time

    // If new WR, unset the old one
    if (isNewWr && currentWr) {
      await prisma.playerTime.update({
        where: { id: currentWr.id },
        data: { isWr: false }
      })
    }

    // Upsert the time
    const record = await prisma.playerTime.upsert({
      where: {
        steamId_mapName_style: {
          steamId,
          mapName,
          style: style || 'normal'
        }
      },
      update: {
        time,
        checkpoints: checkpoints || 0,
        isWr: isNewWr
      },
      create: {
        steamId,
        mapName,
        style: style || 'normal',
        time,
        checkpoints: checkpoints || 0,
        isWr: isNewWr
      }
    })

    return NextResponse.json({
      success: true,
      record,
      isNewWr,
      previousWr: currentWr?.time
    })
  } catch (error) {
    console.error('Time record error:', error)
    return NextResponse.json({ error: 'Failed to record time' }, { status: 500 })
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const ms = Math.round((secs % 1) * 1000)
  return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}
