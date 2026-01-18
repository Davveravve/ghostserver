'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/components/providers/AuthProvider'

export function HomeCTA() {
  const { isAuthenticated, isLoading } = useAuthContext()

  // Don't show CTA if user is logged in
  if (isAuthenticated) {
    return null
  }

  // Show loading skeleton while checking auth
  if (isLoading) {
    return null
  }

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/10 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-4xl font-bold mb-4">
          Ready to Start?
        </h2>
        <p className="text-gray-400 mb-8">
          Sign in with Steam to track your progress and compete for records.
        </p>
        <Link href="/api/auth/steam">
          <Button size="lg">
            Sign In with Steam
          </Button>
        </Link>
      </div>
    </section>
  )
}
