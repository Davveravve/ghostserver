import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('ghost-session')
  return response
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = NextResponse.redirect(baseUrl)
  response.cookies.delete('ghost-session')
  return response
}
