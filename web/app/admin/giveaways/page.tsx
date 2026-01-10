'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AdminGiveawaysPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Giveaways</h1>
        <Button>Create Giveaway</Button>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,12 20,22 4,22 4,12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold mb-2">Giveaway System</h2>
          <p className="text-gray-400 mb-4">
            Create random giveaways or leaderboard-based rewards.
            Players can join on the website.
          </p>
          <p className="text-gray-500 text-sm">Coming soon...</p>
        </CardContent>
      </Card>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Random Giveaway</h3>
          <p className="text-sm text-gray-400">
            Players join and a random winner is picked at the end date.
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Leaderboard Rewards</h3>
          <p className="text-sm text-gray-400">
            Automatic rewards for top players (ELO, Souls, Surf times).
          </p>
        </Card>
      </div>
    </div>
  )
}
