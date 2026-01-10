import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

export interface SteamProfile {
  steamid: string
  communityvisibilitystate: number
  profilestate: number
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  avatarhash: string
  lastlogoff: number
  personastate: number
  realname?: string
  primaryclanid?: string
  timecreated?: number
  personastateflags?: number
  loccountrycode?: string
  locstatecode?: string
  loccityid?: number
}

export interface SteamUser {
  id: string
  name: string
  email: string
  image: string
  steamId: string
}

// Custom Steam Provider using OpenID 2.0
// Note: Steam doesn't use OAuth2, it uses OpenID 2.0
// This is a workaround that works with NextAuth

export default function SteamProvider<P extends SteamProfile>(
  options: OAuthUserConfig<P> & { clientSecret: string }
): OAuthConfig<P> {
  return {
    id: 'steam',
    name: 'Steam',
    type: 'oauth',
    authorization: {
      url: 'https://steamcommunity.com/openid/login',
      params: {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
        'openid.realm': process.env.NEXTAUTH_URL,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      },
    },
    token: {
      url: 'https://steamcommunity.com/openid/login',
      async request() {
        return { tokens: { access_token: 'steam' } }
      },
    },
    userinfo: {
      url: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
      async request({ tokens, provider }) {
        // This is handled in the callback
        return {} as any
      },
    },
    profile(profile: P) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: `${profile.steamid}@steam.local`, // Steam doesn't provide email
        image: profile.avatarfull,
        steamId: profile.steamid,
      }
    },
    style: {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg',
      bg: '#000000',
      text: '#ffffff',
    },
    options,
  } as OAuthConfig<P>
}
