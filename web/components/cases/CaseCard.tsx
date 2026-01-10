'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { GhostCaseImage } from './GhostCaseImage'
import type { Case } from '@/types'

interface CaseCardProps {
  caseData: Case
  featured?: boolean
}

export function CaseCard({ caseData, featured }: CaseCardProps) {
  const isGhostCase = caseData.id === 1

  return (
    <Link href={`/open/${caseData.id}`} className="block">
      <Card hover glow className="group overflow-hidden cursor-pointer">
        {/* Case Image */}
        <div className="relative aspect-square bg-gradient-to-b from-ghost-elevated to-ghost-bg p-2">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Case image */}
          <div className="relative w-full h-full flex items-center justify-center">
            {isGhostCase ? (
              <GhostCaseImage className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
            ) : caseData.image_url ? (
              <img
                src={caseData.image_url}
                alt={caseData.name}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center border border-white/10">
                <CaseIcon className="w-10 h-10 text-white/60" />
              </div>
            )}
          </div>

          {/* Premium badge */}
          {caseData.is_premium_only && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-500 text-[10px] font-semibold">
                PREMIUM
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <h3 className="font-heading text-sm font-semibold mb-0.5 truncate">
            {caseData.name}
          </h3>
          {caseData.description && (
            <p className="text-gray-400 text-xs mb-2 line-clamp-1">
              {caseData.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-1">
            <SoulIcon className="w-4 h-4 text-accent-primary" />
            <span className="font-semibold text-sm">{caseData.cost}</span>
            <span className="text-gray-400 text-xs">souls</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// Compact version for sidebars/lists
export function CaseCardCompact({ caseData }: { caseData: Case }) {
  return (
    <Link href={`/open/${caseData.id}`}>
      <Card hover className="p-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-ghost-elevated flex items-center justify-center flex-shrink-0 overflow-hidden">
          {caseData.image_url ? (
            <img
              src={caseData.image_url}
              alt={caseData.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <CaseIcon className="w-6 h-6 text-white/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{caseData.name}</h4>
          <div className="flex items-center gap-1 text-sm">
            <SoulIcon className="w-4 h-4 text-accent-primary" />
            <span className="text-gray-400">{caseData.cost}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function CaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
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
