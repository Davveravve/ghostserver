'use client'

import { useState, useEffect, useCallback } from 'react'

export interface InventoryItemData {
  id: string
  itemId: number
  name: string
  weapon: string
  skinName: string
  wear: string
  floatValue: number
  imageUrl: string
  dopplerPhase: string | null
  itemType: string
  rarity: string
  equippedCt: boolean
  equippedT: boolean
  isFavorite: boolean
  obtainedAt: string
  obtainedFrom: string | null
  estimatedPrice: number
}

interface InventoryStats {
  totalItems: number
  souls: number
  totalSoulsEarned: number
  casesOpened: number
  premiumTier: string
}

interface UseInventoryReturn {
  items: InventoryItemData[]
  stats: InventoryStats | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  toggleFavorite: (itemId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<boolean>
}

export function useInventory(): UseInventoryReturn {
  const [items, setItems] = useState<InventoryItemData[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory')

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Du måste vara inloggad för att se ditt inventory')
        }
        throw new Error('Kunde inte hämta inventory')
      }

      const data = await response.json()
      setItems(data.inventory)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleFavorite = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/favorite`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Kunde inte uppdatera favorit')
      }

      const data = await response.json()

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, isFavorite: data.isFavorite }
          : item
      ))
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }, [])

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Kunde inte ta bort item')
      }

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId))

      // Update stats
      setStats(prev => prev ? { ...prev, totalItems: prev.totalItems - 1 } : null)

      return true
    } catch (err) {
      console.error('Failed to delete item:', err)
      return false
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return {
    items,
    stats,
    isLoading,
    error,
    refresh: fetchInventory,
    toggleFavorite,
    deleteItem,
  }
}
