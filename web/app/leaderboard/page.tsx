'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface LeaderboardPlayer {
  rank: number
  username: string
  avatarUrl: string | null
  souls?: number
  playtime?: number
  casesOpened?: number
  rareCount?: number
  bestDrop?: string | null
}

interface CurrentUserStats {
  username: string
  avatarUrl: string | null
  totalSoulsEarned: number
  playtimeMinutes: number
  casesOpened: number
  rareItems: number
  soulsRank: number
  casesRank: number
}

interface LeaderboardData {
  topSouls: LeaderboardPlayer[]
  topCasesOpened: LeaderboardPlayer[]
  topRareItems: LeaderboardPlayer[]
  currentUser: CurrentUserStats | null
}

export default function LeaderboardPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const topSouls = data?.topSouls || []
  const topCasesOpened = data?.topCasesOpened || []
  const topRareItems = data?.topRareItems || []
  const currentUser = data?.currentUser

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold mb-4">Leaderboard</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Top players across all Ghost Gaming servers. Rankings update in real-time.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="text-gray-400">Loading leaderboard...</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Souls Leaderboard */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                    <SoulIcon className="w-6 h-6 text-accent-primary" />
                    Top Souls
                  </h2>
                  <span className="text-sm text-gray-400">Lifetime earnings</span>
                </div>

                {topSouls.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400 border-b border-white/10">
                          <th className="pb-3 pr-4">Rank</th>
                          <th className="pb-3 pr-4">Player</th>
                          <th className="pb-3 pr-4 text-right">Souls</th>
                          <th className="pb-3 text-right">Playtime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSouls.map((player) => (
                          <tr
                            key={player.rank}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 pr-4">
                              <RankBadge rank={player.rank} />
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                {player.avatarUrl ? (
                                  <img
                                    src={player.avatarUrl}
                                    alt={player.username}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-ghost-elevated flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                                <span className="font-semibold">{player.username}</span>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <SoulIcon className="w-4 h-4 text-accent-primary" />
                                <span className="font-bold text-accent-primary">
                                  {player.souls?.toLocaleString() || 0}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-right text-gray-400">
                              {formatPlaytime(player.playtime || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No players yet. Be the first!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rare Drops Leaderboard */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <span className="text-yellow-400">
                    <StarIcon className="w-5 h-5" />
                  </span>
                  Luckiest Players
                </h2>
                <span className="text-sm text-gray-400">Rare items</span>
              </div>

              {topRareItems.length > 0 ? (
                <div className="space-y-3">
                  {topRareItems.map((player) => (
                    <div
                      key={player.rank}
                      className="flex items-center gap-3 p-3 rounded-lg bg-ghost-bg hover:bg-ghost-elevated transition-colors"
                    >
                      <RankBadge rank={player.rank} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{player.username}</div>
                        {player.bestDrop && (
                          <div className="text-sm text-gray-400 truncate">
                            <span className="text-yellow-400">
                              <StarIcon className="w-3 h-3 inline mr-1" />
                            </span>
                            {player.bestDrop}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-400">{player.rareCount}</div>
                        <div className="text-xs text-gray-500">rare</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No rare drops yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cases Opened Leaderboard */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <CaseIcon className="w-5 h-5 text-gray-400" />
                  Most Cases Opened
                </h2>
                <span className="text-sm text-gray-400">All time</span>
              </div>

              {topCasesOpened.length > 0 ? (
                <div className="space-y-3">
                  {topCasesOpened.map((player) => (
                    <div
                      key={player.rank}
                      className="flex items-center gap-3 p-3 rounded-lg bg-ghost-bg hover:bg-ghost-elevated transition-colors"
                    >
                      <RankBadge rank={player.rank} size="sm" />
                      <div className="flex-1">
                        <span className="font-semibold">{player.username}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{player.casesOpened?.toLocaleString() || 0}</div>
                        <div className="text-xs text-gray-500">cases</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No cases opened yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Stats or Sign In CTA */}
      {!authLoading && (
        <Card className="mt-8">
          <CardContent className="py-6">
            {isAuthenticated && currentUser ? (
              // Show user's own stats
              <div>
                <h3 className="font-heading text-xl font-bold mb-4 text-center">Your Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Souls Rank"
                    value={`#${currentUser.soulsRank}`}
                    subValue={`${currentUser.totalSoulsEarned.toLocaleString()} souls`}
                    highlight
                  />
                  <StatCard
                    label="Cases Rank"
                    value={`#${currentUser.casesRank}`}
                    subValue={`${currentUser.casesOpened} opened`}
                  />
                  <StatCard
                    label="Rare Items"
                    value={currentUser.rareItems.toString()}
                    subValue="announcement worthy"
                  />
                  <StatCard
                    label="Playtime"
                    value={formatPlaytime(currentUser.playtimeMinutes)}
                    subValue="on servers"
                  />
                </div>
              </div>
            ) : (
              // Show sign in CTA
              <div className="text-center">
                <h3 className="font-heading text-xl font-bold mb-2">Want to climb the ranks?</h3>
                <p className="text-gray-400 mb-4">
                  Sign in to track your progress and see your ranking
                </p>
                <button
                  onClick={login}
                  className="inline-flex items-center gap-2 bg-ghost-elevated border border-white/10 hover:border-accent-primary/50 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <SteamIcon className="w-5 h-5" />
                  Sign In with Steam
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  subValue,
  highlight,
}: {
  label: string
  value: string
  subValue: string
  highlight?: boolean
}) {
  return (
    <div className="bg-ghost-bg rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('text-2xl font-bold', highlight && 'text-accent-primary')}>{value}</div>
      <div className="text-xs text-gray-400">{subValue}</div>
    </div>
  )
}

function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${mins}m`
}

function RankBadge({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) {
  const isTop3 = rank <= 3

  const colors: Record<number, string> = {
    1: 'from-yellow-500 to-yellow-600 text-yellow-900',
    2: 'from-gray-300 to-gray-400 text-gray-700',
    3: 'from-orange-400 to-orange-500 text-orange-900',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold rounded-full',
        size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm',
        isTop3
          ? `bg-gradient-to-br ${colors[rank]}`
          : 'bg-ghost-elevated text-gray-400'
      )}
    >
      {rank}
    </div>
  )
}

function SoulIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function CaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
