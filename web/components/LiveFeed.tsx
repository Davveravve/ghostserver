'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Rarity } from '@/types'

interface FeedItem {
  id: string
  player: string
  playerAvatar?: string
  item: string
  weapon?: string
  wear?: string
  caseName?: string
  rarity: Rarity
  timestamp: Date
}

interface ApiFeedItem {
  id: string
  player: string
  playerAvatar?: string
  item: string
  weapon?: string
  wear?: string
  caseName?: string
  rarity: string
  timestamp: string
}

interface LiveFeedProps {
  maxItems?: number
  compact?: boolean
  showTitle?: boolean
  pollInterval?: number // ms mellan polls
}

export function LiveFeed({
  maxItems = 5,
  compact = false,
  showTitle = true,
  pollInterval = 5000
}: LiveFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastTimestampRef = useRef<string | null>(null)

  // Hämta feed från API
  const fetchFeed = useCallback(async (since?: string) => {
    try {
      const url = new URL('/api/feed', window.location.origin)
      url.searchParams.set('limit', maxItems.toString())
      if (since) {
        url.searchParams.set('since', since)
      }

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()

      if (data.items && data.items.length > 0) {
        const newItems: FeedItem[] = data.items.map((item: ApiFeedItem) => ({
          ...item,
          rarity: item.rarity as Rarity,
          timestamp: new Date(item.timestamp),
        }))

        // Uppdatera senaste timestamp
        lastTimestampRef.current = data.timestamp

        if (since) {
          // Lägg till nya items överst
          setItems((prev) => {
            const combined = [...newItems, ...prev]
            // Ta bort dubbletter baserat på id
            const unique = combined.filter(
              (item, index, self) => index === self.findIndex((t) => t.id === item.id)
            )
            return unique.slice(0, maxItems)
          })
        } else {
          setItems(newItems)
        }
      }

      setError(null)
    } catch (err) {
      console.error('Feed fetch error:', err)
      setError('Could not load feed')
    } finally {
      setIsLoading(false)
    }
  }, [maxItems])

  // Initial fetch + polling
  useEffect(() => {
    // Första fetch
    fetchFeed()

    // Starta polling
    const interval = setInterval(() => {
      fetchFeed(lastTimestampRef.current || undefined)
    }, pollInterval)

    return () => clearInterval(interval)
  }, [fetchFeed, pollInterval])

  return (
    <div className={cn(!compact && 'bg-ghost-card rounded-lg border border-white/10 overflow-hidden')}>
      {showTitle && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h3 className="font-heading font-semibold">Live Drops</h3>
          </div>
          <span className="text-xs text-gray-500">Rare+ items</span>
        </div>
      )}

      <div className={cn(!compact && 'p-2')}>
        {isLoading && items.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && items.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <FeedItemRow item={item} compact={compact} />
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Waiting for rare drops...
          </div>
        )}
      </div>
    </div>
  )
}

function FeedItemRow({ item, compact }: { item: FeedItem; compact: boolean }) {
  const timeAgo = getTimeAgo(item.timestamp)

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm">
        <span className={`w-2 h-2 rounded-full bg-rarity-${item.rarity}`} />
        <span className="font-semibold">{item.player}</span>
        <span className="text-gray-500">got</span>
        <span className={`text-rarity-${item.rarity} font-medium truncate`}>{item.item}</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg mb-1 last:mb-0',
      'bg-ghost-bg/50 hover:bg-ghost-elevated transition-colors'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {item.playerAvatar ? (
          <img
            src={item.playerAvatar}
            alt={item.player}
            className="w-10 h-10 rounded-lg flex-shrink-0"
          />
        ) : (
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            `bg-rarity-${item.rarity}/20`
          )}>
            <span className="text-lg font-bold text-white/50">
              {item.player.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{item.player}</span>
            <span className="text-gray-500 text-sm">won</span>
          </div>
          <div className={cn('text-sm font-medium truncate', `text-rarity-${item.rarity}`)}>
            {item.item}
            {item.wear && <span className="text-gray-500 ml-1">({item.wear})</span>}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        {item.caseName && <div className="text-xs text-gray-500">{item.caseName}</div>}
        <div className="text-xs text-gray-600">{timeAgo}</div>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
