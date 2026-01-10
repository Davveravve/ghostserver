import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const tier = {
  name: 'Ascended',
  price: 1.99,
  color: 'from-accent-primary via-purple-500 to-accent-secondary',
  features: [
    'Priority queue',
    '3x Soul earnings',
    'Ascended name color in servers',
    'Exclusive Ascended case',
  ],
}

export default function PremiumPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          Become <span className="text-gradient">Ascended</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Transcend to the next level. Unlock exclusive perks,
          faster soul earnings, and premium rewards.
        </p>
      </div>

      {/* Single Premium Card */}
      <div className="flex justify-center mb-16">
        <Card className="relative overflow-hidden max-w-md w-full ring-2 ring-accent-primary/50 shadow-glow">
          {/* Tier header with gradient */}
          <div className={cn('p-8 bg-gradient-to-br text-center', tier.color)}>
            <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-sm font-medium text-white mb-4">
              PREMIUM MEMBERSHIP
            </div>
            <h3 className="font-heading text-4xl font-bold text-white mb-2">
              {tier.name}
            </h3>
            <div className="mt-4">
              <span className="text-5xl font-bold text-white">${tier.price}</span>
              <span className="text-white/70 text-lg">/month</span>
            </div>
          </div>

          <CardContent className="p-8">
            {/* Features */}
            <ul className="space-y-4 mb-8">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-accent-primary flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button className="w-full text-lg py-3" variant="primary">
              Become Ascended
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="font-heading text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FaqItem
            question="How do soul multipliers work?"
            answer="As an Ascended member, you earn souls 3x faster for every action on our servers - kills, objectives, playtime, and more."
          />
          <FaqItem
            question="When do I get my benefits?"
            answer="Instantly! As soon as your payment is processed, all Ascended benefits are active on your account."
          />
          <FaqItem
            question="Do Ascended benefits work on all servers?"
            answer="Yes, your Ascended status is shared across all Ghost Gaming servers - Surf, Retake, Competitive, and more."
          />
          <FaqItem
            question="How do I cancel?"
            answer="You can cancel anytime from your account settings. You'll keep your benefits until the end of your billing period."
          />
        </div>
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-gray-400 text-sm">{answer}</p>
    </Card>
  )
}
