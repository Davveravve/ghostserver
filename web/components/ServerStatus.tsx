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

  function copyConnect(ip: string, port: number) {
    navigator.clipboard.writeText(`connect ${ip}:${port}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-ghost-card rounded w-1/3 mb-2" />
            <div className="h-4 bg-ghost-card rounded w-1/4" />
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center text-gray-400 py-8">
        Failed to load server status
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.servers.map(server => (
        <Card key={server.id} hover className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    server.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <h3 className="font-heading font-semibold text-lg">
                  {server.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  server.gameMode === 'surf' ? 'bg-blue-500/20 text-blue-400' :
                  server.gameMode === 'bhop' ? 'bg-green-500/20 text-green-400' :
                  server.gameMode === 'retake' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {server.gameMode}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {server.isOnline ? server.map : 'Server offline'}
              </p>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${server.isOnline ? '' : 'text-gray-500'}`}>
                {server.isOnline ? `${server.players}/${server.maxPlayers}` : 'Offline'}
              </div>
              {server.isOnline && (
                <button
                  onClick={() => copyConnect(server.ip, server.port)}
                  className="text-accent-primary text-sm hover:underline"
                >
                  Copy IP
                </button>
              )}
            </div>
          </div>

          {/* Player bar */}
          {server.isOnline && (
            <div className="mt-3 h-1.5 bg-ghost-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  server.gameMode === 'surf' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                  server.gameMode === 'bhop' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  'bg-gradient-to-r from-accent-primary to-accent-secondary'
                }`}
                style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
              />
            </div>
          )}
        </Card>
      ))}

      {/* Total players badge */}
      <div className="text-center text-sm text-gray-500 pt-2">
        {data.onlineServers}/{data.servers.length} servers online |{' '}
        <span className="text-green-400">{data.totalPlayers}</span> players
      </div>
    </div>
  )
}
