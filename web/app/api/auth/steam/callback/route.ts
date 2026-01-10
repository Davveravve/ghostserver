import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

// Extract Steam ID from claimed_id
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)/)
  return match ? match[1] : null
}

// Verify OpenID response from Steam
async function verifyOpenIdResponse(params: URLSearchParams): Promise<boolean> {
  const verifyParams = new URLSearchParams(params)
  verifyParams.set('openid.mode', 'check_authentication')

  try {
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    })

    const text = await response.text()
    return text.includes('is_valid:true')
  } catch (error) {
    console.error('OpenID verification failed:', error)
    return false
  }
}

// Fetch Steam user profile
async function getSteamProfile(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY

  // If no API key, return minimal profile with just Steam ID
  if (!apiKey) {
    console.warn('STEAM_API_KEY not configured - using fallback profile')
    return {
      steamid: steamId,
      personaname: `Player_${steamId.slice(-6)}`,
      avatarfull: `https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`,
      profileurl: `https://steamcommunity.com/profiles/${steamId}`,
    }
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
    )
    const data = await response.json()
    return data.response?.players?.[0] || null
  } catch (error) {
    console.error('Failed to fetch Steam profile:', error)
    // Fallback on error
    return {
      steamid: steamId,
      personaname: `Player_${steamId.slice(-6)}`,
      avatarfull: `https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`,
      profileurl: `https://steamcommunity.com/profiles/${steamId}`,
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Check if this is a valid OpenID response
  const mode = searchParams.get('openid.mode')
  if (mode !== 'id_res') {
    return NextResponse.redirect(`${baseUrl}?error=auth_cancelled`)
  }

  // Verify the response with Steam
  const isValid = await verifyOpenIdResponse(searchParams)
  if (!isValid) {
    return NextResponse.redirect(`${baseUrl}?error=auth_invalid`)
  }

  // Extract Steam ID
  const claimedId = searchParams.get('openid.claimed_id')
  if (!claimedId) {
    return NextResponse.redirect(`${baseUrl}?error=no_claimed_id`)
  }

  const steamId = extractSteamId(claimedId)
  if (!steamId) {
    return NextResponse.redirect(`${baseUrl}?error=invalid_steam_id`)
  }

  // Fetch Steam profile (uses fallback if no API key)
  const profile = await getSteamProfile(steamId)

  // Skapa eller uppdatera spelare i databasen
  try {
    await prisma.player.upsert({
      where: { steamId: profile.steamid },
      update: {
        username: profile.personaname,
        avatarUrl: profile.avatarfull,
        lastSeenAt: new Date(),
      },
      create: {
        steamId: profile.steamid,
        username: profile.personaname,
        avatarUrl: profile.avatarfull,
        souls: 100, // Startbonus
        totalSoulsEarned: 100,
      },
    })
  } catch (error) {
    console.error('Failed to upsert player:', error)
    // Fortsätt ändå - användaren kan logga in även om db-update failar
  }

  // Create session token
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

  const token = await new SignJWT({
    steamId: profile.steamid,
    name: profile.personaname,
    avatar: profile.avatarfull,
    profileUrl: profile.profileurl,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  // Hämta returnTo från URL:en (säkerhetskolla att den är lokal)
  const returnTo = searchParams.get('returnTo') || '/'
  const redirectUrl = returnTo.startsWith('/') ? `${baseUrl}${returnTo}` : baseUrl

  // Set session cookie
  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set('ghost-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}
