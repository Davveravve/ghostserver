'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSoundContext } from './SoundProvider'

// Global click sound for all interactive elements
export function GlobalClickSound() {
  const { initAudio, getMasterGain } = useSoundContext()
  const lastClickTime = useRef(0)

  const playClick = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    // Mechanical click sound
    const bufferSize = ctx.sampleRate * 0.06
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      // Sharp click with quick decay
      const click = Math.exp(-t * 40) * (Math.random() * 2 - 1)
      data[i] = click
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2500
    filter.Q.value = 3

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.35

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(masterGain)

    source.start(ctx.currentTime)
  }, [initAudio, getMasterGain])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Check if clicked element or its parent is interactive
      const isInteractive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input[type="submit"]') ||
        target.closest('input[type="button"]') ||
        target.closest('[data-clickable]') ||
        target.closest('.cursor-pointer')

      if (isInteractive) {
        // Debounce to prevent double sounds
        const now = Date.now()
        if (now - lastClickTime.current > 50) {
          lastClickTime.current = now
          playClick()
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [playClick])

  return null
}
