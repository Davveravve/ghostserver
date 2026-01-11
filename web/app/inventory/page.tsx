'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { InventoryGrid } from '@/components/inventory/InventoryGrid'
import { ItemCard } from '@/components/inventory/ItemCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton, SkeletonInventoryItem } from '@/components/ui/Skeleton'
import { useInventory, type InventoryItemData } from '@/hooks/useInventory'
import { getItemById } from '@/lib/items-data'
import { rarityInfo, raritySortOrder } from '@/lib/item-utils'
import type { InventoryItem, Wear, Rarity } from '@/types'

type SortOption = 'price' | 'rarity' | 'date' | 'wear'

const wearLabels: Record<Wear, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

const wearColors: Record<Wear, string> = {
  FN: 'text-green-400 bg-green-400',
  MW: 'text-lime-400 bg-lime-400',
  FT: 'text-yellow-400 bg-yellow-400',
  WW: 'text-orange-400 bg-orange-400',
  BS: 'text-red-400 bg-red-400',
}

// Extended inventory item with extra data
interface ExtendedInventoryItem extends InventoryItem {
  isFavorite: boolean
  rarity: Rarity
  estimatedPrice: number
  rawId: string // Original string ID for API calls
  equippedCt: boolean
  equippedT: boolean
  itemType: string
}

// Konvertera API-data till InventoryItem format
function convertToInventoryItem(item: InventoryItemData): ExtendedInventoryItem {
  const baseItem = getItemById(item.itemId)
  return {
    id: parseInt(item.id) || 0,
    rawId: item.id,
    steam_id: '',
    item_id: item.itemId,
    item: baseItem || {
      id: item.itemId,
      name: item.name,
      weapon: item.weapon,
      wear: item.wear as Wear,
      image_url: item.imageUrl,
      type: item.itemType as 'skin' | 'knife' | 'gloves',
      min_float: 0,
      max_float: 1,
      is_tradeable: true,
    },
    obtained_at: item.obtainedAt,
    obtained_on_server: item.obtainedFrom || 'web',
    is_equipped: item.equippedCt || item.equippedT,
    isFavorite: item.isFavorite,
    rarity: (item.rarity || 'common') as Rarity,
    estimatedPrice: item.estimatedPrice,
    equippedCt: item.equippedCt,
    equippedT: item.equippedT,
    itemType: item.itemType,
  }
}

// Wear sort order (FN highest)
const wearSortOrder: Record<Wear, number> = {
  FN: 5,
  MW: 4,
  FT: 3,
  WW: 2,
  BS: 1,
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'all' | 'equipped'>('favorites')
  const [sortBy, setSortBy] = useState<SortOption>('price')
  const { items, stats, isLoading, error, toggleFavorite, deleteItem, equipItem, unequipItem } = useInventory()

  // Konvertera items till InventoryItem format
  const inventoryItems = useMemo(() => {
    return items.map(convertToInventoryItem)
  }, [items])

  // Separate favorites
  const favoriteItems = useMemo(() => {
    return inventoryItems.filter(i => i.isFavorite)
  }, [inventoryItems])

  // Sort function
  const sortItems = (itemsToSort: ExtendedInventoryItem[]) => {
    return [...itemsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.estimatedPrice - a.estimatedPrice
        case 'rarity':
          return raritySortOrder[b.rarity] - raritySortOrder[a.rarity]
        case 'date':
          return new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
        case 'wear':
          return wearSortOrder[b.item.wear] - wearSortOrder[a.item.wear]
        default:
          return 0
      }
    })
  }

  // Sorted favorites (by price, highest first)
  const sortedFavorites = useMemo(() => {
    return sortItems(favoriteItems)
  }, [favoriteItems, sortBy])

  const displayItems = useMemo(() => {
    let filtered = activeTab === 'equipped'
      ? inventoryItems.filter(i => i.is_equipped)
      : activeTab === 'favorites'
        ? favoriteItems
        : inventoryItems.filter(i => !i.isFavorite) // Exclude favorites from All Items
    return sortItems(filtered)
  }, [inventoryItems, favoriteItems, activeTab, sortBy])

  // Count by wear
  const wearCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      const wear = item.wear as Wear
      acc[wear] = (acc[wear] || 0) + 1
      return acc
    }, {} as Record<Wear, number>)
  }, [items])

  // Count special items (knives/gloves)
  const specialCount = useMemo(() => {
    return items.filter(i => i.itemType === 'knife' || i.itemType === 'gloves').length
  }, [items])

  const equippedCount = useMemo(() => {
    return items.filter(i => i.equippedCt || i.equippedT).length
  }, [items])

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardContent>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-24" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <SkeletonInventoryItem key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold mb-2">Could not load inventory</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link href="/api/auth/steam">
            <Button>Sign in with Steam</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1">My Inventory</h1>
          <p className="text-gray-400">
            Your items are shared across all Ghost Gaming servers
          </p>
        </div>
        <Link href="/cases">
          <Button>Open Cases</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Items" value={stats?.totalItems || 0} />
        <StatCard label="Special Items" value={specialCount} highlight icon="star" />
        <StatCard label="Souls Balance" value={stats?.souls || 0} icon="soul" />
        <StatCard label="Cases Opened" value={stats?.casesOpened || 0} />
      </div>

      {/* Wear breakdown */}
      <Card className="mb-8">
        <CardContent>
          <h3 className="font-heading font-semibold mb-4">Collection Breakdown</h3>
          <div className="flex flex-wrap gap-4">
            {(['FN', 'MW', 'FT', 'WW', 'BS'] as const).map((wear) => (
              <div key={wear} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${wearColors[wear].split(' ')[1]}`} />
                <span className="text-sm">
                  <span className={`${wearColors[wear].split(' ')[0]} font-medium`}>
                    {wearCounts[wear] || 0}
                  </span>
                  <span className="text-gray-500 ml-1">{wearLabels[wear]}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-accent-primary text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Favorites ({favoriteItems.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-accent-primary text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          All Items ({inventoryItems.filter(i => !i.isFavorite).length})
        </button>
        <button
          onClick={() => setActiveTab('equipped')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'equipped'
              ? 'bg-accent-primary text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          Equipped ({equippedCount})
        </button>
      </div>

      {/* Inventory Grid */}
      <InventoryGrid
        items={displayItems}
        emptyMessage={
          activeTab === 'equipped'
            ? 'No items equipped'
            : activeTab === 'favorites'
              ? 'No favorites yet - click the heart on items to add them'
              : 'Your inventory is empty'
        }
        onFavoriteToggle={toggleFavorite}
        onDeleteItem={deleteItem}
        onEquipItem={equipItem}
        onUnequipItem={unequipItem}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  icon,
  sublabel,
}: {
  label: string
  value: number | string
  highlight?: boolean
  icon?: 'soul' | 'star'
  sublabel?: string
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {icon === 'soul' && (
          <svg className="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        )}
        {icon === 'star' && (
          <span className="text-yellow-400">★</span>
        )}
        <span className={`text-2xl font-bold ${highlight ? 'text-yellow-400' : ''}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      {sublabel && <div className="text-xs text-gray-500 mt-1">{sublabel}</div>}
    </Card>
  )
}
