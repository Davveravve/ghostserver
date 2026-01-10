import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatSouls(souls: number): string {
  if (souls >= 1000000) {
    return `${(souls / 1000000).toFixed(1)}M`
  }
  if (souls >= 1000) {
    return `${(souls / 1000).toFixed(1)}K`
  }
  return souls.toString()
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra'

export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: '#9ca3af',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#ec4899',
    legendary: '#f59e0b',
    ultra: '#ef4444',
  }
  return colors[rarity]
}

export function getRarityClass(rarity: Rarity): string {
  return `rarity-${rarity}`
}

export function getRarityLabel(rarity: Rarity): string {
  const labels: Record<Rarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    ultra: 'Ultra',
  }
  return labels[rarity]
}
