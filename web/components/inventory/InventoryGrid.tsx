'use client'

import { useState } from 'react'
import { ItemCard } from './ItemCard'
import { ItemModal } from './ItemModal'
import { cn } from '@/lib/utils'
import { rarityInfo, raritySortOrder } from '@/lib/item-utils'
import type { Item, InventoryItem, Wear, Rarity } from '@/types'

// Extended inventory item with extra data
interface ExtendedInventoryItem extends InventoryItem {
  isFavorite?: boolean
  rarity?: Rarity
  estimatedPrice?: number
  rawId?: string
}

interface InventoryGridProps {
  items: ExtendedInventoryItem[]
  emptyMessage?: string
  onFavoriteToggle?: (itemId: string) => void
  onDeleteItem?: (itemId: string) => Promise<boolean>
  showFavorites?: boolean
}

type SortOption = 'newest' | 'oldest' | 'wear' | 'type' | 'name' | 'price' | 'rarity'
type FilterWear = Wear | 'all'

const wearOrder: Record<Wear, number> = {
  FN: 5,
  MW: 4,
  FT: 3,
  WW: 2,
  BS: 1,
}

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

type BulkMode = 'none' | 'delete' | 'favorite'

export function InventoryGrid({
  items,
  emptyMessage = 'No items in inventory',
  onFavoriteToggle,
  onDeleteItem,
  showFavorites = true,
}: InventoryGridProps) {
  const [selectedItem, setSelectedItem] = useState<ExtendedInventoryItem | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('price')
  const [filterWear, setFilterWear] = useState<FilterWear>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk action state
  const [bulkMode, setBulkMode] = useState<BulkMode>('none')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleBulkDelete = async () => {
    if (!onDeleteItem || selectedItems.size === 0) return

    setIsProcessing(true)
    const deletePromises = Array.from(selectedItems).map(id => onDeleteItem(id))
    await Promise.all(deletePromises)

    setIsProcessing(false)
    setSelectedItems(new Set())
    setBulkMode('none')
  }

  const handleBulkFavorite = async () => {
    if (!onFavoriteToggle || selectedItems.size === 0) return

    setIsProcessing(true)
    // Add to favorites one by one
    const itemIds = Array.from(selectedItems)
    for (let i = 0; i < itemIds.length; i++) {
      await onFavoriteToggle(itemIds[i])
    }

    setIsProcessing(false)
    setSelectedItems(new Set())
    setBulkMode('none')
  }

  const cancelBulkMode = () => {
    setBulkMode('none')
    setSelectedItems(new Set())
  }

  const selectAllItems = () => {
    const allIds = filteredItems
      .filter(item => item.rawId)
      .map(item => item.rawId!)
    setSelectedItems(new Set(allIds))
  }

  const deselectAllItems = () => {
    setSelectedItems(new Set())
  }

  // Filter items
  let filteredItems = items.filter((invItem) => {
    if (filterWear !== 'all' && invItem.item.wear !== filterWear) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        invItem.item.name.toLowerCase().includes(query) ||
        invItem.item.weapon?.toLowerCase().includes(query) ||
        invItem.item.type.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (b.estimatedPrice || 0) - (a.estimatedPrice || 0)
      case 'rarity':
        return raritySortOrder[b.rarity || 'common'] - raritySortOrder[a.rarity || 'common']
      case 'newest':
        return new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
      case 'oldest':
        return new Date(a.obtained_at).getTime() - new Date(b.obtained_at).getTime()
      case 'wear':
        return wearOrder[b.item.wear] - wearOrder[a.item.wear]
      case 'type':
        return a.item.type.localeCompare(b.item.type)
      case 'name':
        return a.item.name.localeCompare(b.item.name)
      default:
        return 0
    }
  })

  return (
    <div>
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:border-accent-primary focus:outline-none"
          />
        </div>

        {/* Wear filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterWear('all')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              filterWear === 'all'
                ? 'bg-accent-primary text-white'
                : 'bg-ghost-card text-gray-400 hover:text-white border border-transparent'
            )}
          >
            All
          </button>
          {(['FN', 'MW', 'FT', 'WW', 'BS'] as const).map((wear) => (
            <button
              key={wear}
              onClick={() => setFilterWear(wear)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                filterWear === wear
                  ? `${wearColors[wear].split(' ')[1]}/20 ${wearColors[wear].split(' ')[0]} border border-current`
                  : 'bg-ghost-card text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {wear}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-ghost-card border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent-primary focus:outline-none cursor-pointer"
        >
          <option value="price">By Value</option>
          <option value="rarity">By Rarity</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="wear">By Wear</option>
          <option value="type">By Type</option>
          <option value="name">By Name</option>
        </select>
      </div>

      {/* Item count & Bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {filterWear !== 'all' && ` (${wearLabels[filterWear]})`}
        </span>
        <div className="flex gap-2">
          {/* Add to Favorites button */}
          {onFavoriteToggle && (
            <button
              onClick={() => bulkMode === 'favorite' ? cancelBulkMode() : setBulkMode('favorite')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                bulkMode === 'favorite'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-ghost-card text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {bulkMode === 'favorite' ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Add to Favorites
                </>
              )}
            </button>
          )}
          {/* Delete button */}
          {onDeleteItem && (
            <button
              onClick={() => bulkMode === 'delete' ? cancelBulkMode() : setBulkMode('delete')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                bulkMode === 'delete'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-ghost-card text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {bulkMode === 'delete' ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bulk action info bar */}
      {bulkMode !== 'none' && (
        <div className={cn(
          'mb-4 p-3 rounded-lg flex items-center justify-between',
          bulkMode === 'delete'
            ? 'bg-red-500/10 border border-red-500/30'
            : 'bg-yellow-500/10 border border-yellow-500/30'
        )}>
          <div className="flex items-center gap-3">
            <span className={cn('text-sm', bulkMode === 'delete' ? 'text-red-400' : 'text-yellow-400')}>
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-1">
              <button
                onClick={selectAllItems}
                disabled={selectedItems.size === filteredItems.length}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllItems}
                disabled={selectedItems.size === 0}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
          <button
            onClick={bulkMode === 'delete' ? handleBulkDelete : handleBulkFavorite}
            disabled={selectedItems.size === 0 || isProcessing}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              selectedItems.size > 0
                ? bulkMode === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            )}
          >
            {isProcessing
              ? (bulkMode === 'delete' ? 'Deleting...' : 'Adding...')
              : bulkMode === 'delete'
                ? `Delete ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''}`
                : `Add ${selectedItems.size} to Favorites`
            }
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 auto-rows-auto">
          {filteredItems.map((invItem) => (
            <ItemCard
              key={invItem.id}
              item={invItem.item}
              inventoryItem={invItem}
              onClick={() => {
                if (bulkMode !== 'none' && invItem.rawId) {
                  toggleItemSelection(invItem.rawId)
                } else {
                  setSelectedItem(invItem)
                }
              }}
              showEquipped
              isFavorite={invItem.isFavorite}
              rarity={invItem.rarity}
              onFavoriteToggle={bulkMode === 'none' && onFavoriteToggle && invItem.rawId ? () => onFavoriteToggle(invItem.rawId!) : undefined}
              isSelectedForDelete={bulkMode === 'delete' && invItem.rawId ? selectedItems.has(invItem.rawId) : false}
              isSelectedForFavorite={bulkMode === 'favorite' && invItem.rawId ? selectedItems.has(invItem.rawId) : false}
              bulkMode={bulkMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-500 text-lg mb-2">{emptyMessage}</div>
          <p className="text-gray-600 text-sm">
            {searchQuery || filterWear !== 'all'
              ? 'Try adjusting your filters'
              : 'Open cases to get items!'}
          </p>
        </div>
      )}

      {/* Item Modal */}
      <ItemModal
        inventoryItem={selectedItem}
        isOpen={!!selectedItem && bulkMode === 'none'}
        onClose={() => setSelectedItem(null)}
        onDelete={onDeleteItem}
      />
    </div>
  )
}
