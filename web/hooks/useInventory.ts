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
  equipItem: (itemId: string, team: 'ct' | 't' | 'both') => Promise<void>
  unequipItem: (itemId: string) => Promise<void>
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

  const equipItem = useCallback(async (itemId: string, team: 'ct' | 't' | 'both') => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      })

      if (!response.ok) {
        throw new Error('Kunde inte equippa item')
      }

      const data = await response.json()

      // Update local state - unequip same weapon from other items, then equip this one
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            equippedCt: team === 'ct' || team === 'both',
            equippedT: team === 't' || team === 'both',
          }
        }
        // Unequip same weapon from other items
        if (item.weapon === data.weapon && item.id !== itemId) {
          return {
            ...item,
            equippedCt: team === 'ct' || team === 'both' ? false : item.equippedCt,
            equippedT: team === 't' || team === 'both' ? false : item.equippedT,
          }
        }
        return item
      }))
    } catch (err) {
      console.error('Failed to equip item:', err)
    }
  }, [])

  const unequipItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/equip`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Kunde inte unequippa item')
      }

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, equippedCt: false, equippedT: false }
          : item
      ))
    } catch (err) {
      console.error('Failed to unequip item:', err)
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
    equipItem,
    unequipItem,
  }
}
