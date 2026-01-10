export type Wear = 'FN' | 'MW' | 'FT' | 'WW' | 'BS'
export type ItemType = 'skin' | 'knife' | 'gloves' | 'sticker' | 'agent' | 'charm'
export type DopplerPhase = 'Ruby' | 'Sapphire' | 'Black Pearl' | 'Emerald' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | null
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra'

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

export interface Item {
  id: number
  name: string
  description?: string
  type: ItemType
  weapon: string
  wear: Wear
  min_float: number
  max_float: number
  image_url: string
  is_tradeable: boolean
  doppler_phase?: DopplerPhase
}

export interface Case {
  id: number
  name: string
  description?: string
  cost: number
  image_url: string
  is_active: boolean
  is_premium_only: boolean
  items?: CaseItem[]
}

export interface CaseItem {
  case_id: number
  item_id: number
  item: Item
  drop_weight: number
}

export interface InventoryItem {
  id: number
  steam_id: string
  item_id: number
  item: Item
  obtained_at: string
  obtained_from_case?: number
  obtained_on_server?: string
  is_equipped: boolean
}

export interface CaseOpen {
  id: number
  steam_id: string
  username: string
  case_id: number
  case_name: string
  item_id: number
  item: Item
  server: string
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
