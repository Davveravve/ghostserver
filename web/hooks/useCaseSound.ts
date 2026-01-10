'use client'

import { useCallback } from 'react'
import { useSoundContext } from '@/components/providers/SoundProvider'

// Web Audio API-based sound system for case opening
// Synthesized sounds = no licensing issues, instant load, precise timing

export function useCaseSound() {
  const { initAudio, getMasterGain } = useSoundContext()

  // Tick sound - short click when item passes
  const playTick = useCallback((pitch: number = 1) => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 800 * pitch // Higher pitch = faster

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialDecayTo?.(0.001, ctx.currentTime + 0.05) ||
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    oscillator.connect(gainNode)
    gainNode.connect(getMasterGain())

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }, [initAudio, getMasterGain])

  // Mechanical tick - more CS2-like
  const playMechanicalTick = useCallback((intensity: number = 1) => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    // Click sound using noise burst
    const bufferSize = ctx.sampleRate * 0.02 // 20ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate click impulse
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * intensity
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Bandpass filter for metallic sound
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2000 + Math.random() * 1000
    filter.Q.value = 5

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.5 * intensity

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(getMasterGain())

    source.start(ctx.currentTime)
  }, [initAudio, getMasterGain])

  // Whoosh sound - for slowdown
  const playWhoosh = useCallback((duration: number = 0.5, reverse: boolean = false) => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    // Create noise
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Low-pass filter with sweep
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 2

    if (reverse) {
      filter.frequency.setValueAtTime(200, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + duration)
    } else {
      filter.frequency.setValueAtTime(2000, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration)
    }

    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(getMasterGain())

    source.start(ctx.currentTime)
  }, [initAudio, getMasterGain])

  // Win reveal sound - satisfying landing sound
  const playWinReveal = useCallback(() => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    // Main impact sound
    const baseFreq = 500
    const notes = [1, 1.5, 2, 2.5]

    notes.forEach((mult, i) => {
      const delay = i * 0.06

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = baseFreq * mult

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, ctx.currentTime + delay)
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3)

      osc.connect(gain)
      gain.connect(getMasterGain()!)

      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.4)
    })

    // Add subtle bass thump for impact
    const bass = ctx.createOscillator()
    bass.type = 'sine'
    bass.frequency.setValueAtTime(100, ctx.currentTime)
    bass.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2)

    const bassGain = ctx.createGain()
    bassGain.gain.setValueAtTime(0.06, ctx.currentTime)
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    bass.connect(bassGain)
    bassGain.connect(getMasterGain())

    bass.start(ctx.currentTime)
    bass.stop(ctx.currentTime + 0.3)
  }, [initAudio, getMasterGain])

  // Open case click sound
  const playOpenClick = useCallback(() => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    // Mechanical latch sound
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      // Two impulses - click and release
      const click1 = Math.exp(-t * 50) * (Math.random() * 2 - 1)
      const click2 = t > 0.3 ? Math.exp(-(t - 0.3) * 80) * (Math.random() * 2 - 1) * 0.5 : 0
      data[i] = click1 + click2
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 500

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.5

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(getMasterGain())

    source.start(ctx.currentTime)
  }, [initAudio, getMasterGain])

  // Spin start - rising whoosh
  const playSpinStart = useCallback(() => {
    const ctx = initAudio()
    if (!ctx || !getMasterGain()) return

    // Rising tone
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(getMasterGain())

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)

    // Add whoosh
    playWhoosh(0.4, true)
  }, [initAudio, getMasterGain, playWhoosh])

  return {
    playTick,
    playMechanicalTick,
    playWhoosh,
    playWinReveal,
    playOpenClick,
    playSpinStart,
    initAudio,
  }
}
