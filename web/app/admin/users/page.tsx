'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Player {
  id: string
  steamId: string
  username: string
  avatarUrl: string | null
  souls: number
  elo: number
  premiumTier: string
  isPremium: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [editSouls, setEditSouls] = useState('')
  const [editElo, setEditElo] = useState('')
  const [editPremium, setEditPremium] = useState('none')

  // Load all players on mount
  useEffect(() => {
    loadAllPlayers()
  }, [])

  async function loadAllPlayers() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users/search?q=')
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.players)
      }
    } catch (error) {
      console.error('Failed to load players:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function searchPlayers() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data.players)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function selectPlayer(player: Player) {
    setSelectedPlayer(player)
    setEditSouls(player.souls.toString())
    setEditElo(player.elo.toString())
    setEditPremium(player.premiumTier)
  }

  async function savePlayer() {
    if (!selectedPlayer) return

    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlayer.id,
          souls: parseInt(editSouls) || 0,
          elo: parseInt(editElo) || 1000,
          premiumTier: editPremium,
        }),
      })

      if (res.ok) {
        // Update local state
        setPlayers(players.map(p =>
          p.id === selectedPlayer.id
            ? { ...p, souls: parseInt(editSouls), elo: parseInt(editElo), premiumTier: editPremium }
            : p
        ))
        setSelectedPlayer(null)
        alert('Player updated!')
      } else {
        alert('Failed to update player')
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update player')
    }
  }

  async function addSouls(amount: number) {
    if (!selectedPlayer) return

    const newSouls = parseInt(editSouls) + amount
    setEditSouls(Math.max(0, newSouls).toString())
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Manage Users</h1>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
              placeholder="Search by username or SteamID..."
              className="flex-1 bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
            />
            <Button onClick={searchPlayers} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Results */}
        <div>
          <h2 className="font-heading text-xl font-bold mb-4">
            {searchQuery ? 'Search Results' : 'All Players'} ({players.length})
          </h2>
          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className={`p-4 bg-ghost-card border rounded-lg cursor-pointer transition-colors ${
                    selectedPlayer?.id === player.id
                      ? 'border-accent-primary'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {player.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ghost-elevated" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{player.username}</div>
                      <div className="text-xs text-gray-500">{player.steamId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-accent-primary font-bold">{player.souls.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">souls</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              {isLoading ? 'Loading...' : 'No players found.'}
            </div>
          )}
        </div>

        {/* Edit Panel */}
        <div>
          <h2 className="font-heading text-xl font-bold mb-4">Edit Player</h2>
          {selectedPlayer ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {selectedPlayer.avatarUrl ? (
                    <img
                      src={selectedPlayer.avatarUrl}
                      alt={selectedPlayer.username}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-ghost-elevated" />
                  )}
                  <div>
                    <div className="font-heading text-xl font-bold">{selectedPlayer.username}</div>
                    <div className="text-sm text-gray-500">{selectedPlayer.steamId}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Souls */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Souls</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editSouls}
                        onChange={(e) => setEditSouls(e.target.value)}
                        className="flex-1 bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                      />
                      <button
                        onClick={() => addSouls(-100)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        -100
                      </button>
                      <button
                        onClick={() => addSouls(100)}
                        className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                      >
                        +100
                      </button>
                      <button
                        onClick={() => addSouls(1000)}
                        className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                      >
                        +1K
                      </button>
                    </div>
                  </div>

                  {/* ELO */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ELO</label>
                    <input
                      type="number"
                      value={editElo}
                      onChange={(e) => setEditElo(e.target.value)}
                      className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  {/* Premium */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Premium Tier</label>
                    <select
                      value={editPremium}
                      onChange={(e) => setEditPremium(e.target.value)}
                      className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                    >
                      <option value="none">None</option>
                      <option value="ascended">ASCENDED</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <Button onClick={savePlayer} className="flex-1">
                      Save Changes
                    </Button>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-gray-500 text-center py-8 border border-dashed border-white/10 rounded-lg">
              Select a player to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
