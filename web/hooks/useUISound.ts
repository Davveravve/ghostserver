'use client'

import { useCallback } from 'react'
import { useSoundContext } from '@/components/providers/SoundProvider'

// Subtle UI sounds for general interactions
export function useUISound() {
  const { initAudio, getMasterGain } = useSoundContext()

  // Soft click for buttons
  const playClick = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 600

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }, [initAudio, getMasterGain])

  // Hover sound - very subtle
  const playHover = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 800

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.03, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  }, [initAudio, getMasterGain])

  // Success sound
  const playSuccess = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2)

      osc.connect(gain)
      gain.connect(masterGain)

      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.25)
    })
  }, [initAudio, getMasterGain])

  // Error sound
  const playError = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.15)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  }, [initAudio, getMasterGain])

  // Navigation click
  const playNav = useCallback(() => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    // Soft pop
    const bufferSize = ctx.sampleRate * 0.03
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      data[i] = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 20) * 0.3
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.value = 0.15

    source.connect(gain)
    gain.connect(masterGain)

    source.start(ctx.currentTime)
  }, [initAudio, getMasterGain])

  // Toggle sound (for switches)
  const playToggle = useCallback((isOn: boolean) => {
    const ctx = initAudio()
    const masterGain = getMasterGain()
    if (!ctx || !masterGain) return

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = isOn ? 700 : 500

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(masterGain)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  }, [initAudio, getMasterGain])

  return {
    playClick,
    playHover,
    playSuccess,
    playError,
    playNav,
    playToggle,
  }
}
