import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

async function isOwner(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('ghost-session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    return payload.steamId === OWNER_STEAM_ID
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const news = await prisma.news.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Failed to fetch news:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, content, excerpt, category, isPinned, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        category: category || 'announcement',
        isPinned: isPinned || false,
        isPublished: isPublished !== false,
      },
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Failed to create news:', error)
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 })
  }
}
