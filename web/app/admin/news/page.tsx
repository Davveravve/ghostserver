'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AdminNewsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">News & Announcements</h1>
        <Button>Create Post</Button>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold mb-2">News System</h2>
          <p className="text-gray-400 mb-4">
            Post announcements, updates, and news for your community.
            Will be displayed on the homepage and in-game.
          </p>
          <p className="text-gray-500 text-sm">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
