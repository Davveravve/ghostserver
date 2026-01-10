import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const wearColors: Record<string, string> = {
  FN: 'text-green-400 bg-green-400',
  MW: 'text-lime-400 bg-lime-400',
  FT: 'text-yellow-400 bg-yellow-400',
  WW: 'text-orange-400 bg-orange-400',
  BS: 'text-red-400 bg-red-400',
}

const servers = [
  { name: 'Surf', players: 0, maxPlayers: 32, map: 'surf_utopia', status: 'online' },
  { name: 'Retake', players: 0, maxPlayers: 16, map: 'de_mirage', status: 'online' },
  { name: 'Competitive', players: 0, maxPlayers: 10, map: 'de_dust2', status: 'online' },
]

async function getStats() {
  try {
    const [playerCount, casesOpened, soulsData, recentDrops] = await Promise.all([
      prisma.player.count(),
      prisma.caseOpen.count(),
      prisma.player.aggregate({ _sum: { totalSoulsEarned: true } }),
      prisma.caseOpen.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { player: { select: { username: true } } },
      }),
    ])

    return {
      totalPlayers: playerCount,
      onlinePlayers: 0,
      casesOpened,
      soulsEarned: soulsData._sum.totalSoulsEarned || 0,
      recentDrops: recentDrops.map((drop) => ({
        player: drop.player.username,
        item: drop.itemWeapon + ' | ' + drop.itemName,
        wear: drop.itemWear,
        isSpecial: drop.itemWeapon.includes('Knife') || drop.itemWeapon.includes('Karambit'),
      })),
    }
  } catch (error) {
    console.error('Database error:', error)
    return {
      totalPlayers: 0,
      onlinePlayers: 0,
      casesOpened: 0,
      soulsEarned: 0,
      recentDrops: [],
    }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-primary/20 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/logo.png"
                alt="Ghost Servers"
                width={220}
                height={220}
                className="rounded-2xl mb-4"
              />
              <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white">
                GhostServers.site
              </h1>
            </div>
            <p className="text-xl text-gray-400 mb-8">
              Premium CS2 community servers with a unique souls economy.
              Surf, Retake, and Compete while earning rewards.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/cases">
                <Button size="lg" className="w-full sm:w-auto">
                  Open Cases
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Join Discord
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Players" value={stats.totalPlayers.toLocaleString()} />
            <StatCard label="Online Now" value={stats.onlinePlayers.toString()} highlight />
            <StatCard label="Cases Opened" value={stats.casesOpened.toLocaleString()} />
            <StatCard label="Souls Earned" value={formatSouls(stats.soulsEarned)} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-ghost-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Play on Our Servers"
              description="Join any of our CS2 servers - Surf, Retake, or Competitive. Every server shares the same account."
            />
            <StepCard
              number={2}
              title="Earn Souls"
              description="Earn 1 Soul for every 20 minutes of playtime. Premium members earn up to 5x more souls!"
            />
            <StepCard
              number={3}
              title="Open Cases"
              description="Use your souls to open cases and win random skins, knives, and rare items for your inventory."
            />
          </div>
        </div>
      </section>

      {/* Live Feed & Servers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Drops */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold">Recent Drops</h2>
                <Link href="/cases" className="text-accent-primary text-sm hover:underline">
                  View All
                </Link>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/10">
                    {stats.recentDrops.length > 0 ? (
                      stats.recentDrops.map((drop, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${wearColors[drop.wear]?.split(' ')[1] || 'bg-gray-400'}`} />
                            <div>
                              <span className="font-semibold">{drop.player}</span>
                              <span className="text-gray-400"> won </span>
                              {drop.isSpecial && <span className="text-yellow-400">* </span>}
                              <span className={`${wearColors[drop.wear]?.split(' ')[0] || 'text-gray-400'} font-medium`}>
                                {drop.item}
                              </span>
                              <span className={`ml-2 text-xs ${wearColors[drop.wear]?.split(' ')[0] || 'text-gray-400'}`}>
                                ({drop.wear})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-gray-400 text-center">
                        No drops yet. Be the first!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Server Status */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold">Server Status</h2>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  Coming Soon
                </span>
              </div>
              <div className="space-y-4">
                {servers.map((server) => (
                  <Card key={server.name} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-lg">
                          Ghost {server.name}
                        </h3>
                        <p className="text-gray-400 text-sm">{server.map}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {server.players}/{server.maxPlayers}
                        </div>
                        <button className="text-accent-primary text-sm hover:underline">
                          Connect
                        </button>
                      </div>
                    </div>
                    {/* Player bar */}
                    <div className="mt-3 h-1.5 bg-ghost-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                        style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-400 mb-8">
            Sign in with Steam to track your progress and start opening cases.
          </p>
          <Link href="/api/auth/steam">
            <Button size="lg">
              Sign In with Steam
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="p-6 text-center">
      <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-green-500' : ''}`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center mx-auto mb-4">
        <span className="text-accent-primary font-bold text-lg">{number}</span>
      </div>
      <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function formatSouls(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}
