import { NextRequest, NextResponse } from 'next/server'

// Redirect to Steam OpenID login
export async function GET(request: NextRequest) {
  const returnUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Spara returnTo i callback URL:en
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/'
  const callbackUrl = new URL(`${returnUrl}/api/auth/steam/callback`)
  callbackUrl.searchParams.set('returnTo', returnTo)

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': callbackUrl.toString(),
    'openid.realm': returnUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  return NextResponse.redirect(
    `https://steamcommunity.com/openid/login?${params.toString()}`
  )
}
