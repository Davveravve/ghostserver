// Item utility functions for pricing and rarity

import type { Rarity, Wear } from '@/types'
import { getSkinPrice } from './skin-prices'

// Fallback base prices in "souls value" by rarity (for items not in price database)
const rarityBasePrices: Record<Rarity, number> = {
  common: 5,
  uncommon: 15,
  rare: 40,
  epic: 100,
  legendary: 300,
  ultra: 1000,
}

// Fallback multipliers by item type
const typeMultipliers: Record<string, number> = {
  skin: 1,
  knife: 15,
  gloves: 12,
  sticker: 0.5,
  agent: 3,
  charm: 0.3,
}

// Fallback wear multipliers (FN is worth more)
const wearMultipliers: Record<Wear, number> = {
  FN: 1.5,
  MW: 1.2,
  FT: 1.0,
  WW: 0.7,
  BS: 0.5,
}

// Calculate estimated price for an item
// Uses the skin price database for accurate prices, falls back to formula for unknown skins
export function estimateItemPrice(
  rarity: Rarity,
  itemType: string,
  wear: Wear,
  dopplerPhase?: string | null,
  weapon?: string,
  skinName?: string
): number {
  // Try to get price from database first
  if (weapon && skinName) {
    const dbPrice = getSkinPrice(weapon, skinName, wear, dopplerPhase)
    if (dbPrice > 0) {
      return dbPrice
    }
  }

  // Fallback to formula-based pricing for unknown skins
  const basePrice = rarityBasePrices[rarity] || rarityBasePrices.common
  const typeMultiplier = typeMultipliers[itemType] || 1
  const wearMultiplier = wearMultipliers[wear] || 1

  return Math.round(basePrice * typeMultiplier * wearMultiplier)
}

// Determine rarity from drop weight (lower weight = rarer)
export function getRarityFromDropWeight(dropWeight: number): Rarity {
  if (dropWeight <= 0.5) return 'ultra'
  if (dropWeight <= 2) return 'legendary'
  if (dropWeight <= 5) return 'epic'
  if (dropWeight <= 15) return 'rare'
  if (dropWeight <= 35) return 'uncommon'
  return 'common'
}

// Determine rarity from item type (fallback when no drop weight)
export function getRarityFromType(itemType: string): Rarity {
  if (itemType === 'knife') return 'legendary'
  if (itemType === 'gloves') return 'legendary'
  return 'common'
}

// Rarity display info
export const rarityInfo: Record<Rarity, { label: string; color: string; bgColor: string }> = {
  common: { label: 'Common', color: 'text-gray-400', bgColor: 'bg-gray-400/20' },
  uncommon: { label: 'Uncommon', color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  rare: { label: 'Rare', color: 'text-purple-400', bgColor: 'bg-purple-400/20' },
  epic: { label: 'Epic', color: 'text-pink-400', bgColor: 'bg-pink-400/20' },
  legendary: { label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' },
  ultra: { label: 'Ultra', color: 'text-red-400', bgColor: 'bg-red-400/20' },
}

// Sort order for rarity (higher = more valuable)
export const raritySortOrder: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  ultra: 6,
}

// Top tier items that trigger server-wide announcements when won
// Format: "weapon|skinName" (case insensitive matching)
export const ANNOUNCEMENT_ITEMS: Set<string> = new Set([
  // AWP Elite
  'awp|dragon lore',
  'awp|medusa',
  'awp|desert hydra',
  'awp|gungnir',
  'awp|fade',
  'awp|printstream',

  // AK-47 Elite
  'ak-47|wild lotus',
  'ak-47|gold arabesque',
  'ak-47|fire serpent',
  'ak-47|hydroponic',
  'ak-47|fuel injector',
  'ak-47|vulcan',

  // M4A4 Elite
  'm4a4|howl',
  'm4a4|poseidon',
  'm4a4|temukau',
  'm4a4|the emperor',
  'm4a4|neo-noir',

  // M4A1-S Elite
  'm4a1-s|knight',
  'm4a1-s|welcome to the jungle',
  'm4a1-s|hot rod',
  'm4a1-s|printstream',
  'm4a1-s|imminent danger',

  // Pistols Elite
  'desert eagle|blaze',
  'desert eagle|emerald jormungandr',
  'desert eagle|printstream',
  'glock-18|fade',
  'glock-18|gamma doppler',
  'usp-s|kill confirmed',
  'usp-s|printstream',

  // SMG Elite
  'mp7|whiteout',
  'p90|emerald dragon',
  'mac-10|neon rider',

  // Other Elite
  'aug|akihabara accept',
  'tec-9|nuclear threat',
  'p250|nuclear threat',
  'scar-20|emerald',
  'sg 553|integrale',

  // Karambit Doppler Elite
  'karambit|doppler ruby',
  'karambit|doppler sapphire',
  'karambit|doppler black pearl',
  'karambit|gamma doppler emerald',
  'karambit|fade',
  'karambit|lore',
  'karambit|crimson web',
  'karambit|marble fade',

  // M9 Bayonet Doppler Elite
  'm9 bayonet|doppler ruby',
  'm9 bayonet|doppler sapphire',
  'm9 bayonet|doppler black pearl',
  'm9 bayonet|gamma doppler emerald',
  'm9 bayonet|fade',
  'm9 bayonet|lore',
  'm9 bayonet|crimson web',
  'm9 bayonet|marble fade',

  // Butterfly Knife Elite
  'butterfly knife|doppler ruby',
  'butterfly knife|doppler sapphire',
  'butterfly knife|doppler black pearl',
  'butterfly knife|gamma doppler emerald',
  'butterfly knife|fade',
  'butterfly knife|lore',
  'butterfly knife|crimson web',
  'butterfly knife|marble fade',

  // Talon Knife Elite
  'talon knife|doppler ruby',
  'talon knife|doppler sapphire',
  'talon knife|doppler black pearl',
  'talon knife|gamma doppler emerald',
  'talon knife|fade',
  'talon knife|lore',
  'talon knife|marble fade',

  // Bayonet Elite
  'bayonet|doppler ruby',
  'bayonet|doppler sapphire',
  'bayonet|doppler black pearl',
  'bayonet|gamma doppler emerald',
  'bayonet|fade',
  'bayonet|lore',
  'bayonet|marble fade',

  // Sport Gloves Elite
  'sport gloves|pandora\'s box',
  'sport gloves|hedge maze',
  'sport gloves|superconductor',
  'sport gloves|vice',

  // Specialist Gloves Elite
  'specialist gloves|crimson kimono',
  'specialist gloves|fade',
  'specialist gloves|marble fade',

  // Moto Gloves Elite
  'moto gloves|spearmint',

  // Driver Gloves Elite
  'driver gloves|imperial plaid',

  // Hand Wraps Elite
  'hand wraps|cobalt skulls',

  // Hydra Gloves Elite
  'hydra gloves|emerald',
])

// Check if an item should trigger a server announcement
export function isAnnouncementItem(weapon: string, skinName: string, dopplerPhase?: string | null): boolean {
  const weaponLower = weapon.toLowerCase()
  const skinLower = skinName.toLowerCase()

  // For Doppler items, check with phase
  if (dopplerPhase) {
    const phaseLower = dopplerPhase.toLowerCase()
    // Check for Ruby, Sapphire, Black Pearl, Emerald
    if (phaseLower.includes('ruby') || phaseLower.includes('sapphire') ||
        phaseLower.includes('black pearl') || phaseLower.includes('emerald')) {
      const keyWithPhase = `${weaponLower}|doppler ${phaseLower}`
      const keyGammaWithPhase = `${weaponLower}|gamma doppler ${phaseLower}`
      if (ANNOUNCEMENT_ITEMS.has(keyWithPhase) || ANNOUNCEMENT_ITEMS.has(keyGammaWithPhase)) {
        return true
      }
    }
  }

  // Check standard key
  const key = `${weaponLower}|${skinLower}`
  return ANNOUNCEMENT_ITEMS.has(key)
}
