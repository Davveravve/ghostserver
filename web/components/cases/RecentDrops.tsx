'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Drop {
  id: string
  player: string
  avatarUrl: string | null
  weapon: string
  skinName: string
  wear: string
  imageUrl: string | null
  isRare: boolean
  createdAt: string
}

interface RecentDropsProps {
  initialDrops: Drop[]
}

export function RecentDrops({ initialDrops }: RecentDropsProps) {
  const [drops, setDrops] = useState<Drop[]>(initialDrops)

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const res = await fetch('/api/recent-drops')
        if (res.ok) {
          const data = await res.json()
          setDrops(data)
        }
      } catch (error) {
        console.error('Failed to fetch recent drops:', error)
      }
    }

    // Poll every 3 seconds (1 second is too aggressive)
    const interval = setInterval(fetchDrops, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1 max-w-32" />
        <h2 className="font-heading text-xl font-bold text-white uppercase tracking-wider">
          Recent Drops
        </h2>
        <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1 max-w-32" />
      </div>

      {drops.length > 0 ? (
        <div className="relative">
          {/* Fade overlay on right */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-ghost-bg to-transparent z-10 pointer-events-none" />

          <div className="flex gap-3 overflow-hidden">
            {drops.slice(0, 10).map((drop, index) => (
              <div
                key={drop.id}
                className={cn(
                  'flex-shrink-0 w-24 bg-ghost-card border rounded-lg p-2 transition-all',
                  drop.isRare ? 'border-yellow-500/30' : 'border-white/10'
                )}
                style={{ opacity: 1 - (index * 0.08) }}
              >
                {/* Item Image */}
                <div className="aspect-square rounded bg-ghost-bg mb-1.5 flex items-center justify-center overflow-hidden">
                  {drop.imageUrl ? (
                    <img
                      src={drop.imageUrl}
                      alt={`${drop.weapon} | ${drop.skinName}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-600 text-lg">?</div>
                  )}
                </div>

                {/* Item Name */}
                <div className={cn(
                  'text-[10px] font-medium truncate mb-1',
                  drop.isRare ? 'text-yellow-400' : 'text-white'
                )}>
                  {drop.skinName}
                </div>

                {/* Player */}
                <div className="flex items-center gap-1">
                  {drop.avatarUrl ? (
                    <img
                      src={drop.avatarUrl}
                      alt={drop.player}
                      className="w-4 h-4 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-ghost-elevated flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-400 truncate">{drop.player}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-ghost-card border border-white/10 rounded-lg p-8 text-center">
          <p className="text-gray-500">No drops yet. Be the first to open a case!</p>
        </div>
      )}
    </div>
  )
}
