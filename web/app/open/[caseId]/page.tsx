'use client'

import Link from 'next/link'
import { CaseOpening } from '@/components/cases/CaseOpening'
import { cases, getCaseById, getCaseItems } from '@/lib/items-data'
import { useAuthContext } from '@/components/providers/AuthProvider'

export default function CaseOpenPage({ params }: { params: { caseId: string } }) {
  const { souls: userSouls, isLoading, updateSouls } = useAuthContext()

  // Get case data (fallback to first case if not found)
  const currentCase = getCaseById(parseInt(params.caseId)) || cases[0]

  const canAfford = userSouls !== null && userSouls >= currentCase.cost

  // Calls API BEFORE animation - deducts souls and determines winner server-side
  const handleOpenCase = async () => {
    try {
      const res = await fetch('/api/cases/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: currentCase.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return {
          wonItem: data.wonItem,
          winnerIndex: data.winnerIndex,
          newBalance: data.newBalance,
        }
      } else {
        const error = await res.json()
        console.error('Failed to open case:', error.error)
        return null
      }
    } catch (error) {
      console.error('Failed to open case:', error)
      return null
    }
  }

  const handleBalanceUpdate = (newBalance: number) => {
    updateSouls(newBalance)
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-ghost-bg via-ghost-bg to-accent-primary/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/cases"
              className="text-gray-400 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Cases
            </Link>
            <h1 className="font-heading text-3xl font-bold">{currentCase.name}</h1>
            <p className="text-gray-400">{currentCase.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Your Balance</div>
            <div className="flex items-center gap-2">
              <SoulIcon className="w-6 h-6 text-accent-primary" />
              <span className="font-heading text-2xl font-bold">
                {isLoading ? '...' : userSouls !== null ? userSouls.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Case Opening */}
        <div className="mb-8">
          <CaseOpening
            items={getCaseItems(currentCase.id)}
            caseCost={currentCase.cost}
            userSouls={userSouls}
            onOpenCase={handleOpenCase}
            onBalanceUpdate={handleBalanceUpdate}
          />
        </div>

        {/* Not enough souls warning */}
        {!isLoading && !canAfford && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-red-400">
              You need <span className="font-bold">{userSouls !== null ? currentCase.cost - userSouls : currentCase.cost}</span> more souls to open this case.
            </p>
            <Link href="/" className="text-accent-primary hover:underline text-sm mt-1 inline-block">
              Earn more by getting kills on our servers
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function SoulIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
