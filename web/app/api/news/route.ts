import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Failed to fetch news:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
