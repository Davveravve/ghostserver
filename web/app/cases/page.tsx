import { CaseCard } from '@/components/cases/CaseCard'
import { RecentDrops } from '@/components/cases/RecentDrops'
import { cases, getItemById } from '@/lib/items-data'
import { prisma } from '@/lib/prisma'
import { isAnnouncementItem } from '@/lib/item-utils'

async function getRecentDrops() {
  const drops = await prisma.caseOpen.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      player: {
        select: { username: true, avatarUrl: true },
      },
    },
  })

  return drops.map((drop) => {
    const item = getItemById(drop.itemId)
    return {
      id: drop.id,
      player: drop.player.username,
      avatarUrl: drop.player.avatarUrl,
      weapon: drop.itemWeapon,
      skinName: drop.itemName,
      wear: drop.itemWear,
      imageUrl: item?.image_url || null,
      isRare: isAnnouncementItem(drop.itemWeapon, drop.itemName, null),
      createdAt: drop.createdAt,
    }
  })
}

export default async function CasesPage() {
  const ghostCase = cases[0]
  const premiumCases = cases.slice(1, 3)
  const weaponCases = cases.slice(3)
  const recentDrops = await getRecentDrops()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold mb-3">
          Open Cases
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Use your souls to open cases and win random CS2 items.
          All items go directly to your shared inventory across all servers.
        </p>
      </div>

      {/* Top Row: Featured Ghost Case + Premium Cases */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-12">
        {/* Ghost Case - Featured */}
        <div className="relative group">
          <div className="absolute -inset-3 bg-gradient-to-r from-accent-primary/30 via-accent-secondary/20 to-accent-primary/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative">
            <div className="text-center mb-2">
              <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider">Featured</span>
            </div>
            <div className="w-36">
              <CaseCard caseData={ghostCase} featured />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-40 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Premium Cases */}
        <div>
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Premium</span>
          </div>
          <div className="flex gap-3">
            {premiumCases.map((caseData) => (
              <div key={caseData.id} className="w-32">
                <CaseCard caseData={caseData} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weapon Cases Grid */}
      <div className="mb-40">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1 max-w-32" />
          <h2 className="font-heading text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Weapon Cases
          </h2>
          <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1 max-w-32" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 max-w-4xl mx-auto">
          {weaponCases.map((caseData) => (
            <CaseCard key={caseData.id} caseData={caseData} />
          ))}
        </div>
      </div>

      {/* Recent Drops - Auto-updates every 3 seconds */}
      <RecentDrops initialDrops={recentDrops} />

      {/* Info Section */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <InfoCard
          title="Cross-Server Items"
          description="Win items once, use them on any Ghost Gaming server."
          icon={<ServerIcon />}
        />
        <InfoCard
          title="Earn Souls"
          description="Get kills on our servers to earn souls for cases!"
          icon={<TargetIcon />}
        />
        <InfoCard
          title="Rare Announcements"
          description="Win rare items and get announced on all servers!"
          icon={<MegaphoneIcon />}
        />
      </div>
    </div>
  )
}

function InfoCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="bg-ghost-card border border-white/10 rounded-lg p-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mx-auto mb-3 text-accent-primary">
        {icon}
      </div>
      <h3 className="font-heading text-sm font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
    </div>
  )
}

function ServerIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function MegaphoneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
    </svg>
  )
}
