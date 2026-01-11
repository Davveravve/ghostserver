'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface MapPool {
  id: string
  workshopId: string
  name: string
  gameMode: string
  tier: number
  isActive: boolean
  imageUrl: string | null
}

const GAME_MODES = [
  { id: 'surf', name: 'Surf', color: 'text-blue-400' },
  { id: 'bhop', name: 'Bhop', color: 'text-green-400' },
  { id: 'retake', name: 'Retake', color: 'text-orange-400' },
  { id: 'competitive', name: 'Competitive', color: 'text-red-400' },
]

// Pre-populated surf maps (popular CS2 surf maps)
const SUGGESTED_SURF_MAPS = [
  { workshopId: '3070321829', name: 'surf_utopia', tier: 1 },
  { workshopId: '3073866847', name: 'surf_beginner', tier: 1 },
  { workshopId: '3076438391', name: 'surf_rookie', tier: 1 },
  { workshopId: '3082756590', name: 'surf_mesa', tier: 2 },
  { workshopId: '3083058442', name: 'surf_kitsune', tier: 2 },
  { workshopId: '3093554920', name: 'surf_ace', tier: 2 },
  { workshopId: '3073487701', name: 'surf_beginner2', tier: 1 },
  { workshopId: '3109712171', name: 'surf_calycate', tier: 3 },
  { workshopId: '3088327629', name: 'surf_heaven', tier: 2 },
  { workshopId: '3101419900', name: 'surf_aircontrol', tier: 3 },
  { workshopId: '3095915223', name: 'surf_ski_2', tier: 2 },
  { workshopId: '3107851333', name: 'surf_forbidden_ways', tier: 3 },
]

// Pre-populated bhop maps
const SUGGESTED_BHOP_MAPS = [
  { workshopId: '3104517802', name: 'bhop_badges', tier: 1 },
  { workshopId: '3076439901', name: 'bhop_eazy', tier: 1 },
  { workshopId: '3073864312', name: 'bhop_beginner', tier: 1 },
  { workshopId: '3089712543', name: 'bhop_lego', tier: 2 },
  { workshopId: '3074892118', name: 'bhop_aux', tier: 2 },
  { workshopId: '3092563891', name: 'bhop_easy2', tier: 1 },
  { workshopId: '3101753689', name: 'bhop_miku', tier: 2 },
  { workshopId: '3095738291', name: 'bhop_areaportal', tier: 2 },
  { workshopId: '3084723891', name: 'bhop_strafe', tier: 3 },
  { workshopId: '3108923471', name: 'bhop_arcane', tier: 3 },
]

export default function MapsPage() {
  const [maps, setMaps] = useState<Record<string, MapPool[]>>({})
  const [allMaps, setAllMaps] = useState<MapPool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMode, setActiveMode] = useState('surf')
  const [newMap, setNewMap] = useState({
    workshopId: '',
    name: '',
    gameMode: 'surf',
    tier: 1
  })

  useEffect(() => {
    fetchMaps()
  }, [])

  async function fetchMaps() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/maps')
      if (res.ok) {
        const data = await res.json()
        setMaps(data.maps || {})
        setAllMaps(data.all || [])
      }
    } catch (error) {
      console.error('Failed to fetch maps:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addMap(map?: { workshopId: string; name: string; tier: number }) {
    const mapData = map || newMap
    if (!mapData.workshopId || !mapData.name) return

    try {
      const res = await fetch('/api/admin/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mapData,
          gameMode: map ? activeMode : newMap.gameMode
        })
      })

      if (res.ok) {
        if (!map) {
          setNewMap({ workshopId: '', name: '', gameMode: 'surf', tier: 1 })
        }
        fetchMaps()
      }
    } catch (error) {
      console.error('Failed to add map:', error)
    }
  }

  async function toggleMap(map: MapPool) {
    try {
      await fetch('/api/admin/maps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: map.id, isActive: !map.isActive })
      })
      fetchMaps()
    } catch (error) {
      console.error('Failed to toggle map:', error)
    }
  }

  async function deleteMap(id: string) {
    if (!confirm('Remove this map?')) return

    try {
      await fetch(`/api/admin/maps?id=${id}`, { method: 'DELETE' })
      fetchMaps()
    } catch (error) {
      console.error('Failed to delete map:', error)
    }
  }

  async function addAllSuggested(suggestions: typeof SUGGESTED_SURF_MAPS) {
    for (const map of suggestions) {
      if (!allMaps.some(m => m.workshopId === map.workshopId)) {
        await addMap(map)
      }
    }
  }

  const currentMaps = maps[activeMode] || []
  const suggestions = activeMode === 'surf' ? SUGGESTED_SURF_MAPS :
                     activeMode === 'bhop' ? SUGGESTED_BHOP_MAPS : []

  if (isLoading) {
    return <div className="text-gray-400">Loading maps...</div>
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Map Pool</h1>

      {/* Game Mode Tabs */}
      <div className="flex gap-2 mb-6">
        {GAME_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeMode === mode.id
                ? 'bg-accent-primary text-white'
                : 'bg-ghost-card text-gray-400 hover:text-white'
            }`}
          >
            {mode.name}
            <span className="ml-2 text-sm opacity-60">
              ({(maps[mode.id] || []).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Map Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Add Map</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Workshop ID</label>
                  <input
                    type="text"
                    value={newMap.workshopId}
                    onChange={e => setNewMap({ ...newMap, workshopId: e.target.value })}
                    placeholder="3070321829"
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Map Name</label>
                  <input
                    type="text"
                    value={newMap.name}
                    onChange={e => setNewMap({ ...newMap, name: e.target.value })}
                    placeholder="surf_utopia"
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Game Mode</label>
                  <select
                    value={newMap.gameMode}
                    onChange={e => setNewMap({ ...newMap, gameMode: e.target.value })}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    {GAME_MODES.map(mode => (
                      <option key={mode.id} value={mode.id}>{mode.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tier (1-6)</label>
                  <select
                    value={newMap.tier}
                    onChange={e => setNewMap({ ...newMap, tier: parseInt(e.target.value) })}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(tier => (
                      <option key={tier} value={tier}>Tier {tier}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => addMap()} className="w-full">
                  Add Map
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Maps */}
          {suggestions.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-bold">Suggested Maps</h2>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addAllSuggested(suggestions)}
                  >
                    Add All
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {suggestions.map(map => {
                    const exists = allMaps.some(m => m.workshopId === map.workshopId)
                    return (
                      <div
                        key={map.workshopId}
                        className={`flex items-center justify-between p-2 rounded ${
                          exists ? 'bg-green-500/10 text-green-400' : 'bg-ghost-bg'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-sm">{map.name}</span>
                          <span className="ml-2 text-xs text-gray-500">T{map.tier}</span>
                        </div>
                        {exists ? (
                          <span className="text-xs">Added</span>
                        ) : (
                          <button
                            onClick={() => addMap(map)}
                            className="text-accent-primary text-sm hover:underline"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map List */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">
                {GAME_MODES.find(m => m.id === activeMode)?.name} Maps
              </h2>
              {currentMaps.length === 0 ? (
                <p className="text-gray-400">No maps added yet. Add some from the suggested list!</p>
              ) : (
                <div className="space-y-2">
                  {currentMaps.map(map => (
                    <div
                      key={map.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        map.isActive ? 'bg-ghost-bg' : 'bg-ghost-bg/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          map.tier <= 2 ? 'bg-green-500/20 text-green-400' :
                          map.tier <= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          T{map.tier}
                        </span>
                        <div>
                          <span className="font-mono">{map.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ID: {map.workshopId}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleMap(map)}
                          className={`p-2 rounded hover:bg-white/10 ${
                            map.isActive ? 'text-green-400' : 'text-gray-400'
                          }`}
                          title={map.isActive ? 'Disable' : 'Enable'}
                        >
                          {map.isActive ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                        <a
                          href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${map.workshopId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded hover:bg-white/10 text-gray-400"
                          title="Open in Workshop"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => deleteMap(map.id)}
                          className="p-2 rounded hover:bg-red-500/20 text-red-400"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Workshop Collection Helper */}
              <div className="mt-6 p-4 bg-ghost-bg/50 rounded-lg">
                <h3 className="font-semibold mb-2">Workshop Command</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Use this command to load a map from the workshop:
                </p>
                <code className="block bg-black/50 p-2 rounded text-sm text-green-400 font-mono">
                  host_workshop_map {currentMaps[0]?.workshopId || 'WORKSHOP_ID'}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
