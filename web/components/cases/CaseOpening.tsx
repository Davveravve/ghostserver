'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Item } from '@/types'
import { useCaseSound } from '@/hooks/useCaseSound'

interface OpenCaseResult {
  wonItem: Item & { floatValue: number }
  winnerIndex: number
  newBalance: number
}

interface CaseOpeningProps {
  items: Item[]
  caseCost: number
  userSouls: number | null
  onOpenCase: () => Promise<OpenCaseResult | null>
  onBalanceUpdate?: (newBalance: number) => void
}

// Generate random items for the roulette
function generateRouletteItems(items: Item[], count: number = 50): Item[] {
  const result: Item[] = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * items.length)
    result.push(items[randomIndex])
  }
  return result
}

const WINNING_INDEX = 40

export function CaseOpening({ items, caseCost, userSouls, onOpenCase, onBalanceUpdate }: CaseOpeningProps) {
  const [caseCount, setCaseCount] = useState(1)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinKey, setSpinKey] = useState(0)
  const [spinnerData, setSpinnerData] = useState<Array<{
    rouletteItems: Item[]
    wonItem: (Item & { floatValue: number }) | null
  }>>([])

  const sound = useCaseSound()
  const completedCount = useRef(0)

  // Calculate max affordable cases
  const maxAffordable = userSouls !== null && caseCost > 0
    ? Math.min(5, Math.floor(userSouls / caseCost))
    : 0

  // Auto-adjust caseCount if user can't afford current selection
  useEffect(() => {
    if (!isSpinning && caseCount > maxAffordable && maxAffordable > 0) {
      setCaseCount(maxAffordable)
    }
  }, [maxAffordable, caseCount, isSpinning])

  // Clear spinner data when not spinning (prevents old results from showing)
  useEffect(() => {
    if (!isSpinning) {
      setSpinnerData([])
    }
  }, [isSpinning])

  const startSpin = useCallback(async () => {
    if (isSpinning || items.length === 0) return

    sound.initAudio()
    setIsSpinning(true)
    completedCount.current = 0

    // Call API for all cases first (sequentially to get correct balance updates)
    const results: (OpenCaseResult | null)[] = []
    for (let i = 0; i < caseCount; i++) {
      const result = await onOpenCase()
      results.push(result)
    }

    // Update balance with final result
    const lastValidResult = results.filter(r => r !== null).pop()
    if (lastValidResult) {
      onBalanceUpdate?.(lastValidResult.newBalance)
    }

    // Check if all failed
    if (results.every(r => r === null)) {
      setIsSpinning(false)
      return
    }

    // Setup roulette items for each spinner
    const newData = results.map((result) => {
      if (!result) {
        return { rouletteItems: [], wonItem: null }
      }
      const generated = generateRouletteItems(items, 50)
      generated[WINNING_INDEX] = result.wonItem
      return {
        rouletteItems: generated,
        wonItem: result.wonItem,
      }
    })

    setSpinnerData(newData)
    setSpinKey(prev => prev + 1) // Force re-mount of spinners to start animation
  }, [items, isSpinning, caseCount, onOpenCase, onBalanceUpdate, sound])

  const handleSpinComplete = useCallback(() => {
    completedCount.current++
    if (completedCount.current >= caseCount) {
      setIsSpinning(false)
    }
  }, [caseCount])

  return (
    <div className="w-full">
      {/* Controls Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Case Count Selector */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-medium">Open</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((num) => {
              const canAfford = num <= maxAffordable
              const isSelected = caseCount === num
              return (
                <button
                  key={num}
                  onClick={() => canAfford && setCaseCount(num)}
                  disabled={isSpinning || !canAfford}
                  className={cn(
                    'w-9 h-9 rounded-lg font-bold text-sm transition-all',
                    isSelected
                      ? 'bg-accent-primary text-white shadow-glow'
                      : canAfford
                        ? 'bg-ghost-elevated border border-white/10 text-white hover:border-accent-primary/50'
                        : 'bg-ghost-elevated/50 border border-white/5 text-gray-600 cursor-not-allowed'
                  )}
                >
                  {num}
                </button>
              )
            })}
          </div>
          <span className="text-gray-400 text-sm font-medium">{caseCount === 1 ? 'case' : 'cases'}</span>
        </div>

        {/* Open Button */}
        <button
          onClick={startSpin}
          disabled={isSpinning || items.length === 0 || maxAffordable === 0}
          className={cn(
            'px-6 py-2.5 rounded-lg font-heading font-bold transition-all flex items-center gap-2',
            isSpinning || maxAffordable === 0
              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
              : 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:shadow-glow hover:scale-105'
          )}
        >
          {isSpinning ? (
            'Opening...'
          ) : maxAffordable === 0 ? (
            'Not enough souls'
          ) : (
            <>
              OPEN {caseCount > 1 ? `${caseCount} CASES` : 'CASE'}
              <span className="text-white/80 font-normal">
                ({(caseCost * caseCount).toLocaleString()})
              </span>
            </>
          )}
        </button>
      </div>

      {/* Spinners Stack */}
      <div className="space-y-1.5">
        {Array(caseCount).fill(null).map((_, index) => (
          <SingleSpinner
            key={`${spinKey}-${index}`}
            data={spinnerData[index]}
            playSound={index === 0}
            onSpinComplete={handleSpinComplete}
            sound={sound}
            caseCount={caseCount}
          />
        ))}
      </div>
    </div>
  )
}

interface SingleSpinnerProps {
  data?: {
    rouletteItems: Item[]
    wonItem: (Item & { floatValue: number }) | null
  }
  playSound: boolean
  onSpinComplete: () => void
  sound: ReturnType<typeof useCaseSound>
  caseCount: number
}

// Item sizes based on case count (larger when fewer cases)
const getItemSize = (caseCount: number) => {
  switch (caseCount) {
    case 1: return { width: 160, height: 160, imageSize: 'w-24 h-24' }
    case 2: return { width: 130, height: 130, imageSize: 'w-20 h-20' }
    case 3: return { width: 115, height: 115, imageSize: 'w-16 h-16' }
    case 4: return { width: 105, height: 105, imageSize: 'w-14 h-14' }
    default: return { width: 100, height: 100, imageSize: 'w-14 h-14' }
  }
}

function SingleSpinner({ data, playSound, onSpinComplete, sound, caseCount }: SingleSpinnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rouletteRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const lastTickIndexRef = useRef<number>(-1)
  const animationFrameRef = useRef<number>()
  const hasAnimated = useRef(false)
  const [hasResult, setHasResult] = useState(false)

  const itemSize = getItemSize(caseCount)
  const ITEM_WIDTH = itemSize.width + 8 // width + margin
  const VISIBLE_ITEMS = 7
  const rouletteItems = data?.rouletteItems || []

  // Track actual DOM position and play tick sounds
  const startTickTracking = useCallback((centerOffset: number) => {
    if (!playSound) return

    const tick = () => {
      if (!rouletteRef.current) {
        animationFrameRef.current = requestAnimationFrame(tick)
        return
      }

      const style = window.getComputedStyle(rouletteRef.current)
      const matrix = new DOMMatrix(style.transform)
      const currentX = matrix.m41

      const adjustedX = -currentX + centerOffset + (ITEM_WIDTH / 2)
      const currentIndex = Math.floor(adjustedX / ITEM_WIDTH)

      if (currentIndex !== lastTickIndexRef.current && currentIndex >= 0 && currentIndex < 50) {
        const prevIndex = lastTickIndexRef.current
        const indexDiff = Math.abs(currentIndex - prevIndex)
        const intensity = indexDiff > 2 ? 0.4 : indexDiff > 1 ? 0.6 : 1.0

        lastTickIndexRef.current = currentIndex
        sound.playMechanicalTick(intensity)
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [playSound, sound])

  // Run animation when mounted with data
  useEffect(() => {
    if (rouletteItems.length === 0 || hasAnimated.current) return
    hasAnimated.current = true

    const runAnimation = async () => {
      lastTickIndexRef.current = -1
      await controls.set({ x: 0 })

      const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH * 0.4)
      const containerWidth = containerRef.current?.offsetWidth || ITEM_WIDTH * VISIBLE_ITEMS
      const centerOffset = containerWidth / 2 - ITEM_WIDTH / 2
      const targetX = -(WINNING_INDEX * ITEM_WIDTH) + centerOffset + randomOffset

      if (playSound) {
        startTickTracking(centerOffset)
      }

      await controls.start({
        x: targetX,
        transition: {
          duration: 6,
          ease: [0.15, 0.85, 0.35, 1],
        },
      })

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (playSound) {
        sound.playWinReveal()
      }

      setHasResult(true)
      onSpinComplete()
    }

    runAnimation()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [rouletteItems.length, controls, playSound, sound, startTickTracking, onSpinComplete])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-ghost-card rounded-lg border border-white/10"
    >
      {/* Center indicator */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-accent-primary z-10 -translate-x-1/2" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-accent-primary" />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ghost-card to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ghost-card to-transparent z-10 pointer-events-none" />

      {/* Items roulette */}
      <motion.div
        ref={rouletteRef}
        animate={controls}
        className="flex py-1.5"
        style={{ width: 'fit-content', minHeight: `${itemSize.height + 6}px` }}
      >
        {rouletteItems.map((item, idx) => (
          <RouletteItem
            key={`${item.id}-${idx}`}
            item={item}
            isWinner={hasResult && idx === WINNING_INDEX}
            itemSize={itemSize}
          />
        ))}
      </motion.div>
    </div>
  )
}

interface RouletteItemProps {
  item: Item
  isWinner: boolean
  itemSize: { width: number; height: number; imageSize: string }
}

function RouletteItem({ item, isWinner, itemSize }: RouletteItemProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 mx-1 rounded-lg border transition-all duration-300',
        'bg-ghost-elevated flex flex-col items-center justify-center p-1',
        isWinner ? 'border-accent-primary border-2' : 'border-white/10'
      )}
      style={{ width: `${itemSize.width}px`, height: `${itemSize.height}px` }}
    >
      <div className={cn(itemSize.imageSize, 'rounded mb-0.5 flex items-center justify-center overflow-hidden')}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-2xl text-gray-500">?</span>
        )}
      </div>
      <span className="text-[9px] text-gray-400 truncate w-full text-center">
        {item.weapon}
      </span>
      <span className="text-[10px] font-semibold truncate w-full text-center text-white">
        {item.name}
      </span>
    </div>
  )
}
