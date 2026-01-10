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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.giveaway.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete giveaway:', error)
    return NextResponse.json({ error: 'Failed to delete giveaway' }, { status: 500 })
  }
}
