'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

interface Server {
  id: string
  name: string
  ip: string
  port: number
  gameMode: string
  maxPlayers: number
  players: number
  map: string
  isOnline: boolean
}

interface ServerStatusData {
  servers: Server[]
  totalPlayers: number
  onlineServers: number
}

export function ServerStatus() {
  const [data, setData] = useState<ServerStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/servers/status')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function copyConnect(id: string, ip: string, port: number) {
    navigator.clipboard.writeText(`connect ${ip}:${port}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function joinServer(ip: string, port: number) {
    window.location.href = `steam://connect/${ip}:${port}`
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-ghost-card/50 border border-white/5 rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/3 mb-3" />
            <div className="h-4 bg-white/10 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.servers.length === 0) {
    return (
      <div className="bg-ghost-card/50 border border-white/5 rounded-xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <div className="text-gray-400">Servers loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.servers.map(server => (
        <Card key={server.id} className="overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-200">
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      server.isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'
                    }`}
                  />
                  <h3 className="font-heading font-bold text-lg text-white truncate">
                    {server.name}
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    server.gameMode === 'surf' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    server.gameMode === 'bhop' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    server.gameMode === 'retake' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {server.gameMode.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {server.isOnline ? server.map : 'Server offline'}
                </p>
              </div>

              {/* Player Count & Actions */}
              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${
                  server.isOnline
                    ? server.players > 0 ? 'text-green-400' : 'text-gray-400'
                    : 'text-red-400'
                }`}>
                  {server.isOnline ? `${server.players}/${server.maxPlayers}` : 'OFF'}
                </div>
                <div className="text-xs text-gray-500">
                  {server.isOnline ? 'players' : 'offline'}
                </div>
              </div>
            </div>

            {/* Player bar */}
            {server.isOnline && (
              <div className="mt-4 h-2 bg-ghost-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    server.gameMode === 'surf' ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                    server.gameMode === 'bhop' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                    'bg-gradient-to-r from-purple-600 to-purple-400'
                  }`}
                  style={{ width: `${Math.max((server.players / server.maxPlayers) * 100, 2)}%` }}
                />
              </div>
            )}

            {/* Action Buttons */}
            {server.isOnline && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => joinServer(server.ip, server.port)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    server.gameMode === 'surf'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                      : server.gameMode === 'bhop'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Join Server
                </button>
                <button
                  onClick={() => copyConnect(server.id, server.ip, server.port)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all flex items-center gap-2"
                >
                  {copiedId === server.id ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy IP
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Summary */}
      <div className="flex items-center justify-center gap-4 pt-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-gray-400">{data.onlineServers} online</span>
        </div>
        <div className="w-px h-4 bg-white/10"></div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-green-400 font-medium">{data.totalPlayers}</span>
          <span className="text-gray-400">players total</span>
        </div>
      </div>
    </div>
  )
}
