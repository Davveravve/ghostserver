import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        steamId: payload.steamId,
        name: payload.name,
        avatar: payload.avatar,
        profileUrl: payload.profileUrl,
      },
    })
  } catch (error) {
    // Invalid token
    const response = NextResponse.json({ user: null })
    response.cookies.delete('ghost-session')
    return response
  }
}
