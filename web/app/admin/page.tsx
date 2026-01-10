'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface DashboardStats {
  totalPlayers: number
  totalSouls: number
  totalCasesOpened: number
  playersToday: number
  soulsToday: number
  casesToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>

      {isLoading ? (
        <div className="text-gray-400">Loading stats...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Players"
            value={stats.totalPlayers.toLocaleString()}
            subtitle={`+${stats.playersToday} today`}
            color="purple"
          />
          <StatCard
            title="Total Souls"
            value={stats.totalSouls.toLocaleString()}
            subtitle={`+${stats.soulsToday.toLocaleString()} today`}
            color="green"
          />
          <StatCard
            title="Cases Opened"
            value={stats.totalCasesOpened.toLocaleString()}
            subtitle={`+${stats.casesToday} today`}
            color="yellow"
          />
        </div>
      ) : (
        <div className="text-red-400">Failed to load stats</div>
      )}

      <div className="mt-12">
        <h2 className="font-heading text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            href="/admin/users"
            title="Manage Users"
            description="Edit souls, roles, bans"
          />
          <QuickAction
            href="/admin/giveaways"
            title="Giveaways"
            description="Create & manage giveaways"
          />
          <QuickAction
            href="/admin/news"
            title="Post News"
            description="Announcements & updates"
          />
          <QuickAction
            href="/admin/servers"
            title="Server Status"
            description="View server health"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: string
  subtitle: string
  color: 'purple' | 'green' | 'yellow'
}) {
  const colors = {
    purple: 'text-accent-primary',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm text-gray-400 mb-1">{title}</div>
        <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
        <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  )
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      className="block p-4 bg-ghost-card border border-white/10 rounded-lg hover:border-accent-primary/50 transition-colors"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </a>
  )
}
