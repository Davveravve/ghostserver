'use client'

import { cn } from '@/lib/utils'
import { rarityInfo } from '@/lib/item-utils'
import type { Item, InventoryItem, Wear, Rarity } from '@/types'

type BulkMode = 'none' | 'delete' | 'favorite'

interface ItemCardProps {
  item: Item
  inventoryItem?: InventoryItem
  onClick?: () => void
  selected?: boolean
  showEquipped?: boolean
  isFavorite?: boolean
  rarity?: Rarity
  onFavoriteToggle?: () => void
  isSelectedForDelete?: boolean
  isSelectedForFavorite?: boolean
  bulkMode?: BulkMode
  equippedCt?: boolean
  equippedT?: boolean
}

const wearColors: Record<Wear, { text: string; bg: string; border: string }> = {
  FN: { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400' },
  MW: { text: 'text-lime-400', bg: 'bg-lime-400', border: 'border-lime-400' },
  FT: { text: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
  WW: { text: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400' },
  BS: { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400' },
}

// T-only weapons
const T_ONLY_WEAPONS = [
  'AK-47', 'Glock-18', 'Galil AR', 'SG 553', 'Tec-9', 'MAC-10', 'Sawed-Off', 'G3SG1'
]

// CT-only weapons
const CT_ONLY_WEAPONS = [
  'M4A4', 'M4A1-S', 'USP-S', 'P2000', 'FAMAS', 'AUG', 'Five-SeveN', 'MP9', 'MAG-7', 'SCAR-20'
]

// Function to get weapon team restriction
function getWeaponTeam(weapon: string | undefined, itemType: string): 'ct' | 't' | 'both' {
  if (itemType === 'knife' || itemType === 'gloves') return 'both'
  if (!weapon) return 'both'
  if (T_ONLY_WEAPONS.includes(weapon)) return 't'
  if (CT_ONLY_WEAPONS.includes(weapon)) return 'ct'
  return 'both'
}

export function ItemCard({
  item,
  inventoryItem,
  onClick,
  selected,
  showEquipped,
  isFavorite,
  rarity,
  onFavoriteToggle,
  isSelectedForDelete,
  isSelectedForFavorite,
  bulkMode = 'none',
  equippedCt,
  equippedT,
}: ItemCardProps) {
  const isEquipped = equippedCt || equippedT || inventoryItem?.is_equipped
  const colors = wearColors[item.wear]
  const isKnifeOrGloves = item.type === 'knife' || item.type === 'gloves'
  const rarityData = rarity ? rarityInfo[rarity] : null
  const isInBulkMode = bulkMode !== 'none'
  const isSelected = isSelectedForDelete || isSelectedForFavorite

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.()
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg border transition-all cursor-pointer group w-full max-w-[150px]',
        'bg-ghost-card hover:bg-ghost-elevated',
        selected
          ? `${colors.border} shadow-lg`
          : `border-white/10 hover:${colors.border}/50`,
        isSelectedForDelete && 'ring-2 ring-red-500 bg-red-500/10 border-red-500/50',
        isSelectedForFavorite && 'ring-2 ring-yellow-500 bg-yellow-500/10 border-yellow-500/50',
        bulkMode === 'delete' && !isSelected && 'hover:ring-1 hover:ring-red-500/50',
        bulkMode === 'favorite' && !isSelected && 'hover:ring-1 hover:ring-yellow-500/50'
      )}
    >
      {/* Bulk select checkbox */}
      {isInBulkMode && (
        <div
          className={cn(
            'absolute top-1.5 left-1.5 z-20 w-5 h-5 flex items-center justify-center rounded border-2 transition-all',
            isSelectedForDelete
              ? 'bg-red-500 border-red-500 text-white'
              : isSelectedForFavorite
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : 'bg-black/50 border-gray-500'
          )}
        >
          {isSelected && (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Favorite button */}
      {onFavoriteToggle && !isInBulkMode && (
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'absolute top-1.5 left-1.5 z-20 w-5 h-5 flex items-center justify-center rounded-full transition-all',
            isFavorite
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-black/50 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
          )}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      )}

      {/* Equipped badge - show CT/T/Both based on weapon type */}
      {showEquipped && isEquipped && (
        <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5">
          {(() => {
            const weaponTeam = getWeaponTeam(item.weapon, item.type)

            // For single-side weapons, just show EQ (the team is implicit)
            if (weaponTeam === 'ct' || weaponTeam === 't') {
              const teamColor = weaponTeam === 'ct' ? 'blue' : 'orange'
              return (
                <span className={`px-1 py-0.5 bg-${teamColor}-500/20 border border-${teamColor}-500/50 rounded text-${teamColor}-400 text-[8px] font-semibold`}>
                  EQ
                </span>
              )
            }

            // For both-sides weapons, show which teams it's equipped for
            if (equippedCt && equippedT) {
              return (
                <span className="px-1 py-0.5 bg-purple-500/20 border border-purple-500/50 rounded text-purple-400 text-[8px] font-semibold">
                  CT+T
                </span>
              )
            } else if (equippedCt) {
              return (
                <span className="px-1 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 text-[8px] font-semibold">
                  CT
                </span>
              )
            } else if (equippedT) {
              return (
                <span className="px-1 py-0.5 bg-orange-500/20 border border-orange-500/50 rounded text-orange-400 text-[8px] font-semibold">
                  T
                </span>
              )
            } else {
              return (
                <span className="px-1 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-[8px] font-semibold">
                  EQ
                </span>
              )
            }
          })()}
        </div>
      )}

      {/* Knife/Gloves indicator */}
      {isKnifeOrGloves && !onFavoriteToggle && !isInBulkMode && (
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className="text-yellow-400 text-[10px]">★</span>
        </div>
      )}

      {/* Wear indicator bar */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-0.5 rounded-t-lg',
        colors.bg
      )} />

      {/* Item image */}
      <div className={cn(
        'aspect-square rounded mb-1.5 flex items-center justify-center overflow-hidden',
        `${colors.bg}/10 group-hover:${colors.bg}/20`,
        'transition-colors'
      )}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform"
          />
        ) : (
          <span className="text-2xl text-gray-500">?</span>
        )}
      </div>

      {/* Item info */}
      <div className="text-center">
        <div className="text-[10px] text-gray-500 truncate leading-tight">
          {item.weapon || item.type}
        </div>
        <div className="text-xs font-medium truncate text-white leading-tight">
          {item.name}
        </div>
        <div className="flex items-center justify-center mt-0.5">
          <span className={cn('text-[10px]', colors.text)}>
            {item.wear}
          </span>
        </div>
      </div>
    </div>
  )
}

// Compact version for lists
export function ItemCardCompact({ item }: { item: Item }) {
  const colors = wearColors[item.wear]

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-ghost-card border border-white/10">
      <div className={cn(
        'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden',
        `${colors.bg}/20`
      )}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-lg text-gray-500">?</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500 truncate">{item.weapon || item.type}</div>
        <div className="text-sm font-medium truncate text-white">{item.name}</div>
      </div>
      <div className={cn('text-xs font-medium', colors.text)}>{item.wear}</div>
    </div>
  )
}
