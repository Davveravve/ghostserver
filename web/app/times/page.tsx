'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface TimeRecord {
  rank: number
  steamId: string
  time: number
  formattedTime: string
  checkpoints: number
  date: string
}

interface MapData {
  map: string
  style: string
  wr: { steamId: string; time: number } | null
  leaderboard: TimeRecord[]
}

const POPULAR_MAPS = [
  { name: 'surf_utopia', mode: 'surf', tier: 1 },
  { name: 'surf_beginner', mode: 'surf', tier: 1 },
  { name: 'surf_mesa', mode: 'surf', tier: 2 },
  { name: 'surf_kitsune', mode: 'surf', tier: 2 },
  { name: 'bhop_badges', mode: 'bhop', tier: 1 },
  { name: 'bhop_eazy', mode: 'bhop', tier: 1 },
  { name: 'bhop_lego', mode: 'bhop', tier: 2 },
]

export default function TimesPage() {
  const [selectedMap, setSelectedMap] = useState('surf_utopia')
  const [selectedStyle, setSelectedStyle] = useState('normal')
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<'surf' | 'bhop'>('surf')

  useEffect(() => {
    fetchTimes()
  }, [selectedMap, selectedStyle])

  async function fetchTimes() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/times?map=${selectedMap}&style=${selectedStyle}&limit=20`)
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

  const filteredMaps = POPULAR_MAPS.filter(m => m.mode === activeMode)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold mb-4">Surf & Bhop Times</h1>
        <p className="text-gray-400">
          Compete for world records on our surf and bhop servers
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => {
            setActiveMode('surf')
            setSelectedMap('surf_utopia')
          }}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeMode === 'surf'
              ? 'bg-blue-500 text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
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
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeMode === 'bhop'
              ? 'bg-green-500 text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Bhop
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-heading text-lg font-bold mb-4">Maps</h2>
              <div className="space-y-2">
                {filteredMaps.map(map => (
                  <button
                    key={map.name}
                    onClick={() => setSelectedMap(map.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedMap === map.name
                        ? 'bg-accent-primary text-white'
                        : 'bg-ghost-bg hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{map.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        map.tier <= 2 ? 'bg-green-500/20 text-green-400' :
                        map.tier <= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        T{map.tier}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Style Selection */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-sm text-gray-400 mb-2">Style</h3>
                <select
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="sideways">Sideways</option>
                  <option value="w-only">W-Only</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold">{selectedMap}</h2>
                  <p className="text-gray-400 text-sm">Style: {selectedStyle}</p>
                </div>
                {mapData?.wr && (
                  <div className="text-right">
                    <div className="text-sm text-gray-400">World Record</div>
                    <div className="text-2xl font-bold text-gold">
                      {formatTime(mapData.wr.time)}
                    </div>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center text-gray-400 py-8">Loading times...</div>
              ) : mapData?.leaderboard && mapData.leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                        <th className="pb-3 w-16">#</th>
                        <th className="pb-3">Player</th>
                        <th className="pb-3 text-right">Time</th>
                        <th className="pb-3 text-right hidden sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapData.leaderboard.map((record, i) => (
                        <tr
                          key={`${record.steamId}-${i}`}
                          className={`border-b border-white/5 ${
                            i === 0 ? 'bg-gold/10' :
                            i === 1 ? 'bg-gray-400/10' :
                            i === 2 ? 'bg-orange-400/10' : ''
                          }`}
                        >
                          <td className="py-3">
                            {i === 0 ? (
                              <span className="text-gold font-bold">1st</span>
                            ) : i === 1 ? (
                              <span className="text-gray-300 font-bold">2nd</span>
                            ) : i === 2 ? (
                              <span className="text-orange-400 font-bold">3rd</span>
                            ) : (
                              <span className="text-gray-500">#{record.rank}</span>
                            )}
                          </td>
                          <td className="py-3">
                            <a
                              href={`https://steamcommunity.com/profiles/${record.steamId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent-primary transition-colors"
                            >
                              {record.steamId}
                            </a>
                          </td>
                          <td className="py-3 text-right font-mono">
                            {record.formattedTime}
                          </td>
                          <td className="py-3 text-right text-gray-500 hidden sm:table-cell">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-2">No times recorded yet</div>
                  <p className="text-sm text-gray-600">
                    Be the first to set a record!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to Play */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-bold mb-4">Commands</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-ghost-bg p-3 rounded-lg">
                  <code className="text-accent-primary">!r</code>
                  <p className="text-gray-400 mt-1">Restart/Reset</p>
                </div>
                <div className="bg-ghost-bg p-3 rounded-lg">
                  <code className="text-accent-primary">!cp</code>
                  <p className="text-gray-400 mt-1">Save Checkpoint</p>
                </div>
                <div className="bg-ghost-bg p-3 rounded-lg">
                  <code className="text-accent-primary">!tp</code>
                  <p className="text-gray-400 mt-1">Teleport to CP</p>
                </div>
                <div className="bg-ghost-bg p-3 rounded-lg">
                  <code className="text-accent-primary">!pb</code>
                  <p className="text-gray-400 mt-1">Personal Best</p>
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
