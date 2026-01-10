'use client'

import { useState, useEffect } from 'react'
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
  createdAt: string
  _count: { entries: number }
  winners: { steamId: string; username: string; placement: number }[]
}

export default function AdminGiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prizeType, setPrizeType] = useState('souls')
  const [prizeSouls, setPrizeSouls] = useState('1000')
  const [prizeCustom, setPrizeCustom] = useState('')
  const [giveawayType, setGiveawayType] = useState('random')
  const [leaderboardType, setLeaderboardType] = useState('elo')
  const [winnersCount, setWinnersCount] = useState('1')
  const [minSouls, setMinSouls] = useState('0')
  const [minElo, setMinElo] = useState('0')
  const [requirePremium, setRequirePremium] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('18:00')

  useEffect(() => {
    loadGiveaways()
  }, [])

  async function loadGiveaways() {
    try {
      const res = await fetch('/api/admin/giveaways')
      if (res.ok) {
        const data = await res.json()
        setGiveaways(data.giveaways)
      }
    } catch (error) {
      console.error('Failed to load giveaways:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function createGiveaway() {
    if (!title || !endDate) {
      alert('Title and end date are required')
      return
    }

    const endsAt = new Date(`${endDate}T${endTime}:00`)

    try {
      const res = await fetch('/api/admin/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          prizeType,
          prizeSouls: prizeType === 'souls' ? parseInt(prizeSouls) : null,
          prizeCustom: prizeType === 'custom' ? prizeCustom : null,
          giveawayType,
          leaderboardType: giveawayType === 'leaderboard' ? leaderboardType : null,
          winnersCount: parseInt(winnersCount),
          minSouls: parseInt(minSouls),
          minElo: parseInt(minElo),
          requirePremium,
          endsAt: endsAt.toISOString(),
        }),
      })

      if (res.ok) {
        // Reset form
        setTitle('')
        setDescription('')
        setPrizeType('souls')
        setPrizeSouls('1000')
        setPrizeCustom('')
        setGiveawayType('random')
        setWinnersCount('1')
        setMinSouls('0')
        setMinElo('0')
        setRequirePremium(false)
        setEndDate('')
        setShowCreate(false)
        loadGiveaways()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create giveaway')
      }
    } catch (error) {
      console.error('Failed to create giveaway:', error)
      alert('Failed to create giveaway')
    }
  }

  async function endGiveaway(id: string) {
    if (!confirm('End this giveaway and pick winners?')) return

    try {
      const res = await fetch(`/api/admin/giveaways/${id}/end`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Winners: ${data.winners.map((w: { username: string }) => w.username).join(', ')}`)
        loadGiveaways()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to end giveaway')
      }
    } catch (error) {
      console.error('Failed to end giveaway:', error)
      alert('Failed to end giveaway')
    }
  }

  async function deleteGiveaway(id: string) {
    if (!confirm('Delete this giveaway?')) return

    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadGiveaways()
      } else {
        alert('Failed to delete giveaway')
      }
    } catch (error) {
      console.error('Failed to delete giveaway:', error)
      alert('Failed to delete giveaway')
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getPrizeText(g: Giveaway) {
    if (g.prizeType === 'souls' && g.prizeSouls) {
      return `${g.prizeSouls.toLocaleString()} Souls`
    }
    if (g.prizeType === 'custom' && g.prizeCustom) {
      return g.prizeCustom
    }
    return 'Custom Prize'
  }

  const activeGiveaways = giveaways.filter((g) => g.status === 'active')
  const endedGiveaways = giveaways.filter((g) => g.status === 'ended')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Giveaways</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Giveaway'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="font-heading text-xl font-bold mb-4">Create New Giveaway</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Weekend Giveaway"
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter giveaway for a chance to win..."
                  rows={2}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Giveaway Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={giveawayType}
                  onChange={(e) => setGiveawayType(e.target.value)}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="random">Random Winner</option>
                  <option value="leaderboard">Leaderboard</option>
                </select>
              </div>

              {/* Leaderboard Type (conditional) */}
              {giveawayType === 'leaderboard' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Leaderboard Type</label>
                  <select
                    value={leaderboardType}
                    onChange={(e) => setLeaderboardType(e.target.value)}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                  >
                    <option value="elo">Top ELO</option>
                    <option value="souls">Top Souls Earned</option>
                    <option value="kills">Top Kills</option>
                  </select>
                </div>
              )}

              {/* Prize Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prize Type</label>
                <select
                  value={prizeType}
                  onChange={(e) => setPrizeType(e.target.value)}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="souls">Souls</option>
                  <option value="custom">Custom Prize</option>
                </select>
              </div>

              {/* Prize Value */}
              {prizeType === 'souls' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Souls Amount</label>
                  <input
                    type="number"
                    value={prizeSouls}
                    onChange={(e) => setPrizeSouls(e.target.value)}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                  />
                </div>
              )}

              {prizeType === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Custom Prize Description</label>
                  <input
                    type="text"
                    value={prizeCustom}
                    onChange={(e) => setPrizeCustom(e.target.value)}
                    placeholder="Steam Gift Card, Discord Nitro, etc."
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                  />
                </div>
              )}

              {/* Winners Count */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of Winners</label>
                <input
                  type="number"
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Requirements Section */}
              <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                <h3 className="font-semibold mb-3">Entry Requirements (optional)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Minimum Souls</label>
                    <input
                      type="number"
                      value={minSouls}
                      onChange={(e) => setMinSouls(e.target.value)}
                      className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Minimum ELO</label>
                    <input
                      type="number"
                      value={minElo}
                      onChange={(e) => setMinElo(e.target.value)}
                      className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requirePremium}
                        onChange={(e) => setRequirePremium(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">ASCENDED Only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={createGiveaway}>Create Giveaway</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Giveaways */}
      <h2 className="font-heading text-xl font-bold mb-4">Active Giveaways ({activeGiveaways.length})</h2>
      {isLoading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : activeGiveaways.length > 0 ? (
        <div className="space-y-4 mb-8">
          {activeGiveaways.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading text-lg font-bold">{g.title}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                        Active
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400">
                        {g.giveawayType === 'random' ? 'Random' : `Top ${g.winnersCount} ${g.leaderboardType}`}
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-sm text-gray-400 mb-2">{g.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Prize:</span>{' '}
                        <span className="text-accent-primary font-semibold">{getPrizeText(g)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Entries:</span>{' '}
                        <span className="font-semibold">{g._count.entries}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ends:</span>{' '}
                        <span>{formatDate(g.endsAt)}</span>
                      </div>
                      {(g.minSouls > 0 || g.minElo > 0 || g.requirePremium) && (
                        <div>
                          <span className="text-gray-500">Requirements:</span>{' '}
                          <span className="text-yellow-400">
                            {g.minSouls > 0 && `${g.minSouls} souls`}
                            {g.minElo > 0 && ` ${g.minElo} ELO`}
                            {g.requirePremium && ' ASCENDED'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => endGiveaway(g.id)}
                      className="text-green-400 hover:bg-green-500/20"
                    >
                      End & Pick
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGiveaway(g.id)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">No active giveaways</div>
          </CardContent>
        </Card>
      )}

      {/* Ended Giveaways */}
      <h2 className="font-heading text-xl font-bold mb-4">Past Giveaways ({endedGiveaways.length})</h2>
      {endedGiveaways.length > 0 ? (
        <div className="space-y-4">
          {endedGiveaways.map((g) => (
            <Card key={g.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading text-lg font-bold">{g.title}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                        Ended
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Prize:</span>{' '}
                        <span className="text-accent-primary">{getPrizeText(g)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Entries:</span>{' '}
                        <span>{g._count.entries}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Winners:</span>{' '}
                        <span className="text-green-400">
                          {g.winners.map((w) => w.username).join(', ') || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGiveaway(g.id)}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">No past giveaways</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
