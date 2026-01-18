'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface TimeRecord {
  rank: number
  steamId: string
  playerName?: string
  time: number
  formattedTime: string
  checkpoints: number
  date: string
}

interface MapData {
  map: string
  wr: { steamId: string; playerName?: string; time: number } | null
  leaderboard: TimeRecord[]
}

const SURF_MAPS = [
  { name: 'surf_beginner', tier: 1 },
  { name: 'surf_utopia', tier: 1 },
  { name: 'surf_rookie', tier: 1 },
  { name: 'surf_kitsune', tier: 2 },
  { name: 'surf_mesa', tier: 2 },
  { name: 'surf_ace', tier: 3 },
]

const BHOP_MAPS = [
  { name: 'bhop_badges', tier: 1 },
  { name: 'bhop_eazy', tier: 1 },
  { name: 'bhop_lego', tier: 2 },
]

export default function TimesPage() {
  const [selectedMap, setSelectedMap] = useState('surf_beginner')
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<'surf' | 'bhop'>('surf')

  useEffect(() => {
    fetchTimes()
  }, [selectedMap])

  async function fetchTimes() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/times?map=${selectedMap}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setMapData(data)
      }
    } catch (error) {
      console.error('Failed to fetch times:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentMaps = activeMode === 'surf' ? SURF_MAPS : BHOP_MAPS

  const getTierColor = (tier: number) => {
    if (tier === 1) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (tier === 2) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    if (tier === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    if (tier === 4) return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Leaderboards
        </h1>
        <p className="text-gray-400 text-lg">
          Compete for the fastest times on our servers
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-ghost-card/50 p-1.5 rounded-xl inline-flex gap-1">
          <button
            onClick={() => {
              setActiveMode('surf')
              setSelectedMap('surf_beginner')
            }}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeMode === 'surf'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Surf
            </span>
          </button>
          <button
            onClick={() => {
              setActiveMode('bhop')
              setSelectedMap('bhop_badges')
            }}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeMode === 'bhop'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Bhop
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Maps
              </h2>
              <div className="space-y-1.5">
                {currentMaps.map(map => (
                  <button
                    key={map.name}
                    onClick={() => setSelectedMap(map.name)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      selectedMap === map.name
                        ? 'bg-gradient-to-r from-purple-600/80 to-purple-500/80 text-white shadow-lg'
                        : 'bg-ghost-bg/50 hover:bg-white/5 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{map.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-md border ${getTierColor(map.tier)}`}>
                        T{map.tier}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {/* Map Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="font-heading text-3xl font-bold text-white">{selectedMap}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {currentMaps.find(m => m.name === selectedMap)?.tier
                      ? `Tier ${currentMaps.find(m => m.name === selectedMap)?.tier}`
                      : ''
                    } {activeMode === 'surf' ? 'Surf' : 'Bhop'} Map
                  </p>
                </div>
                {mapData?.wr && (
                  <div className="text-right bg-gradient-to-br from-amber-500/20 to-yellow-500/10 px-5 py-3 rounded-xl border border-amber-500/20">
                    <div className="text-xs text-amber-400/80 uppercase tracking-wider font-medium">Server Record</div>
                    <div className="text-2xl font-bold text-amber-400 font-mono">
                      {formatTime(mapData.wr.time)}
                    </div>
                    {mapData.wr.playerName && (
                      <div className="text-xs text-gray-400 mt-0.5">by {mapData.wr.playerName}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Leaderboard Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                  <span className="ml-3 text-gray-400">Loading times...</span>
                </div>
              ) : mapData?.leaderboard && mapData.leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="pb-3 pl-2 w-16">Rank</th>
                        <th className="pb-3">Player</th>
                        <th className="pb-3 text-right">Time</th>
                        <th className="pb-3 text-right pr-2 hidden sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapData.leaderboard.map((record, i) => (
                        <tr
                          key={`${record.steamId}-${i}`}
                          className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                            i === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' :
                            i === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent' :
                            i === 2 ? 'bg-gradient-to-r from-orange-600/10 to-transparent' : ''
                          }`}
                        >
                          <td className="py-4 pl-2">
                            {i === 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm">1</span>
                            ) : i === 1 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">2</span>
                            ) : i === 2 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm">3</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 text-sm">{record.rank}</span>
                            )}
                          </td>
                          <td className="py-4">
                            <a
                              href={`https://steamcommunity.com/profiles/${record.steamId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-purple-400 transition-colors font-medium"
                            >
                              {record.playerName || record.steamId}
                            </a>
                          </td>
                          <td className="py-4 text-right font-mono text-white">
                            {record.formattedTime}
                          </td>
                          <td className="py-4 text-right pr-2 text-gray-500 text-sm hidden sm:table-cell">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-gray-400 mb-2 font-medium">No times recorded yet</div>
                  <p className="text-sm text-gray-600">
                    Be the first to set a record on this map!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commands Card */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                In-Game Commands
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-ghost-bg/50 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                  <code className="text-purple-400 font-bold">!r</code>
                  <p className="text-gray-500 text-sm mt-1">Restart run</p>
                </div>
                <div className="bg-ghost-bg/50 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                  <code className="text-purple-400 font-bold">!cp</code>
                  <p className="text-gray-500 text-sm mt-1">Save checkpoint</p>
                </div>
                <div className="bg-ghost-bg/50 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                  <code className="text-purple-400 font-bold">!tp</code>
                  <p className="text-gray-500 text-sm mt-1">Teleport to CP</p>
                </div>
                <div className="bg-ghost-bg/50 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                  <code className="text-purple-400 font-bold">!sr</code>
                  <p className="text-gray-500 text-sm mt-1">Server record</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const ms = Math.round((secs % 1) * 1000)
  return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}
