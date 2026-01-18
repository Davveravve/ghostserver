export interface Player {
  steam_id: string
  username: string
  avatar_url?: string
  souls: number
  total_souls_earned: number
  playtime_minutes: number
  is_premium: boolean
  premium_tier: 'none' | 'bronze' | 'silver' | 'gold'
  premium_expires_at?: string
  created_at: string
}

export interface Server {
  id: string
  name: string
  ip?: string
  port?: number
  current_players: number
  max_players: number
  current_map?: string
  is_online: boolean
}

export interface LeaderboardEntry {
  rank: number
  steam_id: string
  username: string
  avatar_url?: string
  value: number
}
