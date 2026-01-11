'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Announcement {
  id: string
  name: string
  message: string
  type: 'chat' | 'center' | 'html'
  color: string
  prefix: string
  prefixColor: string
  isActive: boolean
  sortOrder: number
}

interface ChatColor {
  id: string
  name: string
  hex: string
}

interface PluginSetting {
  id: string
  key: string
  value: string
  category: string
  description: string | null
}

const DEFAULT_SETTINGS = [
  { key: 'announcements.enabled', value: 'true', category: 'announcements', description: 'Enable announcement rotation' },
  { key: 'announcements.interval', value: '120', category: 'announcements', description: 'Seconds between announcements' },
  { key: 'discord.webhook', value: '', category: 'discord', description: 'Discord webhook URL for rare drops' },
  { key: 'discord.invite', value: 'https://discord.gg/aSDrPk6Y8q', category: 'discord', description: 'Discord invite link' },
  { key: 'server.friendly_fire', value: 'false', category: 'server', description: 'Allow friendly fire' },
  { key: 'server.buy_anywhere', value: 'true', category: 'server', description: 'Allow buying anywhere' },
  { key: 'hud.souls_display', value: 'true', category: 'hud', description: 'Show souls HUD to players' },
  { key: 'drops.announce_rare', value: 'true', category: 'drops', description: 'Announce rare drops in-game' },
  { key: 'drops.announce_discord', value: 'true', category: 'drops', description: 'Send rare drops to Discord' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'settings' | 'maps'>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [colors, setColors] = useState<ChatColor[]>([])
  const [settings, setSettings] = useState<Record<string, PluginSetting[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState<{
    name: string
    message: string
    type: 'chat' | 'center' | 'html'
    color: string
    prefix: string
    prefixColor: string
  }>({
    name: '',
    message: '',
    type: 'chat',
    color: 'white',
    prefix: '[Ghost]',
    prefixColor: 'purple'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [announcementsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/announcements'),
        fetch('/api/admin/settings')
      ])

      if (announcementsRes.ok) {
        const data = await announcementsRes.json()
        setAnnouncements(data.announcements || [])
        setColors(data.colors || [])
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function createAnnouncement() {
    if (!newAnnouncement.name || !newAnnouncement.message) return

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      })

      if (res.ok) {
        setNewAnnouncement({
          name: '',
          message: '',
          type: 'chat',
          color: 'white',
          prefix: '[Ghost]',
          prefixColor: 'purple'
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create announcement:', error)
    }
  }

  async function updateAnnouncement(announcement: Announcement) {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
      })

      if (res.ok) {
        setEditingAnnouncement(null)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update announcement:', error)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  async function updateSetting(key: string, value: string) {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  async function initializeSettings() {
    for (const setting of DEFAULT_SETTINGS) {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      })
    }
    fetchData()
  }

  function getColorHex(colorId: string) {
    return colors.find(c => c.id === colorId)?.hex || '#ffffff'
  }

  if (isLoading) {
    return <div className="text-gray-400">Loading settings...</div>
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Plugin Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'announcements'
              ? 'bg-accent-primary text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-accent-primary text-white'
              : 'bg-ghost-card text-gray-400 hover:text-white'
          }`}
        >
          General Settings
        </button>
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Announcement Settings */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Announcement Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-ghost-bg rounded-lg">
                  <div>
                    <div className="font-medium">Enabled</div>
                    <div className="text-sm text-gray-400">Show announcements in-game</div>
                  </div>
                  <button
                    onClick={() => {
                      const current = Object.values(settings).flat().find(s => s.key === 'announcements.enabled')
                      updateSetting('announcements.enabled', current?.value === 'true' ? 'false' : 'true')
                    }}
                    className={`px-4 py-1.5 rounded-lg font-medium ${
                      Object.values(settings).flat().find(s => s.key === 'announcements.enabled')?.value === 'true'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {Object.values(settings).flat().find(s => s.key === 'announcements.enabled')?.value === 'true' ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-ghost-bg rounded-lg">
                  <div>
                    <div className="font-medium">Interval (seconds)</div>
                    <div className="text-sm text-gray-400">Time between messages</div>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    value={Object.values(settings).flat().find(s => s.key === 'announcements.interval')?.value || '120'}
                    onChange={e => updateSetting('announcements.interval', e.target.value)}
                    className="w-24 bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white text-center"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-ghost-bg rounded-lg">
                  <div>
                    <div className="font-medium">Active Messages</div>
                    <div className="text-sm text-gray-400">Currently rotating</div>
                  </div>
                  <span className="text-2xl font-bold text-accent-primary">
                    {announcements.filter(a => a.isActive).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create new announcement */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Create Announcement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name (internal)</label>
                  <input
                    type="text"
                    value={newAnnouncement.name}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, name: e.target.value })}
                    placeholder="e.g. Discord Promo"
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as 'chat' | 'center' | 'html' })}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="chat">Chat Message</option>
                    <option value="center">Center Screen</option>
                    <option value="html">HTML Panel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={newAnnouncement.prefix}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, prefix: e.target.value })}
                    placeholder="[Ghost]"
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prefix Color</label>
                  <select
                    value={newAnnouncement.prefixColor}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, prefixColor: e.target.value })}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    {colors.map(color => (
                      <option key={color.id} value={color.id} style={{ color: color.hex }}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Message</label>
                  <input
                    type="text"
                    value={newAnnouncement.message}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Join our Discord: discord.gg/..."
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Message Color</label>
                  <select
                    value={newAnnouncement.color}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, color: e.target.value })}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    {colors.map(color => (
                      <option key={color.id} value={color.id} style={{ color: color.hex }}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={createAnnouncement} className="w-full">
                    Add Announcement
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-3 bg-black/50 rounded-lg font-mono text-sm">
                <span style={{ color: getColorHex(newAnnouncement.prefixColor) }}>
                  {newAnnouncement.prefix}
                </span>{' '}
                <span style={{ color: getColorHex(newAnnouncement.color) }}>
                  {newAnnouncement.message || 'Your message here...'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Existing announcements */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Active Announcements</h2>
              {announcements.length === 0 ? (
                <p className="text-gray-400">No announcements yet. Create one above!</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, index) => (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-lg border ${
                        ann.isActive ? 'bg-ghost-bg border-white/10' : 'bg-ghost-bg/50 border-white/5 opacity-60'
                      }`}
                    >
                      {editingAnnouncement?.id === ann.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editingAnnouncement.name}
                              onChange={e => setEditingAnnouncement({ ...editingAnnouncement, name: e.target.value })}
                              className="bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white"
                            />
                            <input
                              type="text"
                              value={editingAnnouncement.prefix}
                              onChange={e => setEditingAnnouncement({ ...editingAnnouncement, prefix: e.target.value })}
                              className="bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white"
                            />
                          </div>
                          <input
                            type="text"
                            value={editingAnnouncement.message}
                            onChange={e => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                            className="w-full bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={editingAnnouncement.prefixColor}
                              onChange={e => setEditingAnnouncement({ ...editingAnnouncement, prefixColor: e.target.value })}
                              className="bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white"
                            >
                              {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                              value={editingAnnouncement.color}
                              onChange={e => setEditingAnnouncement({ ...editingAnnouncement, color: e.target.value })}
                              className="bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white"
                            >
                              {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateAnnouncement(editingAnnouncement)}>Save</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-500 text-sm">#{index + 1}</span>
                              <span className="font-semibold">{ann.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${ann.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {ann.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <div className="font-mono text-sm">
                              <span style={{ color: getColorHex(ann.prefixColor) }}>{ann.prefix}</span>{' '}
                              <span style={{ color: getColorHex(ann.color) }}>{ann.message}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateAnnouncement({ ...ann, isActive: !ann.isActive })}
                              className="p-2 hover:bg-white/10 rounded"
                              title={ann.isActive ? 'Disable' : 'Enable'}
                            >
                              {ann.isActive ? (
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setEditingAnnouncement(ann)}
                              className="p-2 hover:bg-white/10 rounded"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteAnnouncement(ann.id)}
                              className="p-2 hover:bg-red-500/20 rounded text-red-400"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {Object.keys(settings).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-400 mb-4">No settings found. Initialize default settings?</p>
                <Button onClick={initializeSettings}>Initialize Settings</Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(settings).map(([category, categorySettings]) => (
              <Card key={category}>
                <CardContent className="p-6">
                  <h2 className="font-heading text-xl font-bold mb-4 capitalize">{category}</h2>
                  <div className="space-y-4">
                    {categorySettings.map(setting => (
                      <div key={setting.id} className="flex items-center justify-between p-3 bg-ghost-bg rounded-lg">
                        <div>
                          <div className="font-medium">{setting.key.split('.').pop()}</div>
                          {setting.description && (
                            <div className="text-sm text-gray-400">{setting.description}</div>
                          )}
                        </div>
                        <div>
                          {setting.value === 'true' || setting.value === 'false' ? (
                            <button
                              onClick={() => updateSetting(setting.key, setting.value === 'true' ? 'false' : 'true')}
                              className={`px-4 py-1.5 rounded-lg font-medium ${
                                setting.value === 'true'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {setting.value === 'true' ? 'Enabled' : 'Disabled'}
                            </button>
                          ) : (
                            <input
                              type="text"
                              value={setting.value}
                              onChange={e => updateSetting(setting.key, e.target.value)}
                              className="bg-ghost-card border border-white/10 rounded px-3 py-1.5 text-white w-48"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Discord Settings Helper */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-ghost-bg rounded-lg">
                  <div className="font-medium mb-2">Discord Webhook</div>
                  <p className="text-sm text-gray-400 mb-3">
                    For rare drop announcements in Discord
                  </p>
                  <a
                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary text-sm hover:underline"
                  >
                    How to create a webhook
                  </a>
                </div>
                <div className="p-4 bg-ghost-bg rounded-lg">
                  <div className="font-medium mb-2">Your Discord</div>
                  <p className="text-sm text-gray-400 mb-3">
                    discord.gg/aSDrPk6Y8q
                  </p>
                  <a
                    href="https://discord.gg/aSDrPk6Y8q"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary text-sm hover:underline"
                  >
                    Open Discord
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
