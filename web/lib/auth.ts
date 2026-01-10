import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Steam API helper
async function getSteamUser(steamId: string): Promise<any> {
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey) {
    console.error('STEAM_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
    )
    const data = await response.json()
    return data.response?.players?.[0] || null
  } catch (error) {
    console.error('Failed to fetch Steam user:', error)
    return null
  }
}

// Extract Steam ID from OpenID claimed_id
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/\/id\/(\d+)$/)
  return match ? match[1] : null
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Custom Steam OpenID provider
    {
      id: 'steam',
      name: 'Steam',
      type: 'credentials',
      credentials: {},
      async authorize(credentials, req) {
        // This is called after Steam redirects back
        // The actual auth happens in the callback route
        return null
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).steamId = (user as any).steamId
        (token as any).avatar = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).steamId = (token as any).steamId
        (session.user as any).avatar = (token as any).avatar
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export { getSteamUser, extractSteamId }
