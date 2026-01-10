'use client'

import { Card, CardContent } from '@/components/ui/Card'

export default function AdminServersPage() {
  const servers = [
    { name: 'Retake', ip: 'retake.ghostservers.site', status: 'offline', players: 0, maxPlayers: 16 },
    { name: 'Surf', ip: 'surf.ghostservers.site', status: 'offline', players: 0, maxPlayers: 32 },
    { name: 'Bhop', ip: 'bhop.ghostservers.site', status: 'offline', players: 0, maxPlayers: 32 },
  ]

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Server Status</h1>

      <div className="grid gap-4">
        {servers.map((server) => (
          <Card key={server.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    server.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-semibold">Ghost {server.name}</div>
                    <div className="text-sm text-gray-500">{server.ip}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{server.players}/{server.maxPlayers}</div>
                  <div className="text-sm text-gray-500 capitalize">{server.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-gray-500">
        Server status updates when servers are connected via plugin API.
      </div>
    </div>
  )
}
