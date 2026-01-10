'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Giveaway {
  id: string
  title: string
  description: string | null
  prizeType: string
  prizeSouls: number | null
  prizeItemId: number | null
  prizeCustom: string | null
  giveawayType: string
  leaderboardType: string | null
  winnersCount: number
  minSouls: number
  minElo: number
  requirePremium: boolean
  endsAt: string
  status: string
  entriesCount: number
  hasJoined?: boolean
  winners?: { username: string; placement: number }[]
}

export default function GiveawaysPage() {
  const [activeGiveaways, setActiveGiveaways] = useState<Giveaway[]>([])
  const [endedGiveaways, setEndedGiveaways] = useState<Giveaway[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    loadGiveaways()
  }, [])

  async function loadGiveaways() {
    try {
      const res = await fetch('/api/giveaways')
      if (res.ok) {
        const data = await res.json()
        setActiveGiveaways(data.active)
        setEndedGiveaways(data.ended)
      }
    } catch (error) {
      console.error('Failed to load giveaways:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function joinGiveaway(id: string) {
    setJoiningId(id)
    try {
      const res = await fetch(`/api/giveaways/${id}/join`, {
        method: 'POST',
      })

      if (res.ok) {
        // Update local state
        setActiveGiveaways((prev) =>
          prev.map((g) =>
            g.id === id
              ? { ...g, hasJoined: true, entriesCount: g.entriesCount + 1 }
              : g
          )
        )
      } else {
        const data = await res.json()
        if (data.error === 'Not authenticated') {
          window.location.href = '/api/auth/steam?returnTo=/giveaways'
        } else {
          alert(data.error || 'Failed to join giveaway')
        }
      }
    } catch (error) {
      console.error('Failed to join giveaway:', error)
      alert('Failed to join giveaway')
    } finally {
      setJoiningId(null)
    }
  }

  function formatTimeLeft(endsAt: string) {
    const end = new Date(endsAt).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) return 'Ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  function getPrizeText(g: Giveaway) {
    if (g.prizeType === 'souls' && g.prizeSouls) {
      return `${g.prizeSouls.toLocaleString()} Souls`
    }
    if (g.prizeType === 'custom' && g.prizeCustom) {
      return g.prizeCustom
    }
    return 'Mystery Prize'
  }

  function getRequirements(g: Giveaway) {
    const reqs: string[] = []
    if (g.minSouls > 0) reqs.push(`${g.minSouls.toLocaleString()} Souls`)
    if (g.minElo > 0) reqs.push(`${g.minElo} ELO`)
    if (g.requirePremium) reqs.push('ASCENDED')
    return reqs
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-bg pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">Loading giveaways...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ghost-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Giveaways
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Join our giveaways for a chance to win souls, items, and more!
            Play on our servers to unlock exclusive giveaways.
          </p>
        </motion.div>

        {/* Active Giveaways */}
        {activeGiveaways.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {activeGiveaways.map((g, index) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full overflow-hidden border-accent-primary/20 hover:border-accent-primary/40 transition-colors">
                  <CardContent className="p-0">
                    {/* Header with prize */}
                    <div className="bg-gradient-to-r from-accent-primary/20 to-transparent p-6 border-b border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                          {formatTimeLeft(g.endsAt)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {g.entriesCount} {g.entriesCount === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold mb-1">{g.title}</h3>
                      <div className="text-accent-primary font-bold text-lg">
                        {getPrizeText(g)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {g.description && (
                        <p className="text-gray-400 text-sm mb-4">{g.description}</p>
                      )}

                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-4">
                        {g.giveawayType === 'random' ? (
                          <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                            Random Winner
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                            Top {g.winnersCount} {g.leaderboardType?.toUpperCase()}
                          </span>
                        )}
                        {g.winnersCount > 1 && g.giveawayType === 'random' && (
                          <span className="px-2 py-1 text-xs rounded bg-white/10 text-gray-400">
                            {g.winnersCount} Winners
                          </span>
                        )}
                      </div>

                      {/* Requirements */}
                      {getRequirements(g).length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="text-xs text-yellow-400 mb-1">Requirements:</div>
                          <div className="flex flex-wrap gap-2">
                            {getRequirements(g).map((req) => (
                              <span
                                key={req}
                                className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-300"
                              >
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Join Button */}
                      {g.giveawayType === 'random' ? (
                        g.hasJoined ? (
                          <div className="w-full py-3 rounded-lg bg-green-500/20 text-green-400 text-center font-semibold">
                            Entered
                          </div>
                        ) : (
                          <Button
                            onClick={() => joinGiveaway(g.id)}
                            disabled={joiningId === g.id}
                            className="w-full"
                          >
                            {joiningId === g.id ? 'Joining...' : 'Join Giveaway'}
                          </Button>
                        )
                      ) : (
                        <div className="w-full py-3 rounded-lg bg-purple-500/20 text-purple-400 text-center text-sm">
                          Automatic entry based on leaderboard
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-16">
              <CardContent className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-600 mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20,12 20,22 4,22 4,12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                </svg>
                <h2 className="font-heading text-2xl font-bold mb-2">No Active Giveaways</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Check back later for new giveaways! Follow us on Discord to get notified
                  when new giveaways are posted.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Winners */}
        {endedGiveaways.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-heading text-2xl font-bold mb-6">Recent Winners</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endedGiveaways.map((g) => (
                <Card key={g.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{g.title}</h3>
                      <span className="text-xs text-gray-500">
                        {g.entriesCount} entries
                      </span>
                    </div>
                    <div className="text-sm text-accent-primary mb-2">
                      {getPrizeText(g)}
                    </div>
                    {g.winners && g.winners.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {g.winners.map((w) => (
                          <span
                            key={w.username}
                            className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400"
                          >
                            {w.placement === 1 ? '' : `#${w.placement} `}
                            {w.username}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
