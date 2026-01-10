'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'

interface SoundContextType {
  volume: number
  isMuted: boolean
  setVolume: (volume: number) => void
  toggleMute: () => void
  getAudioContext: () => AudioContext | null
  getMasterGain: () => GainNode | null
  initAudio: () => AudioContext | null
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: ReactNode }) {
  const [volume, setVolumeState] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  // Initialize shared audio context
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.gain.value = isMuted ? 0 : volume
      masterGainRef.current.connect(audioContextRef.current.destination)
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [volume, isMuted])

  // Update master gain when volume or mute changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current?.currentTime || 0
      )
    }
  }, [volume, isMuted])

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const getAudioContext = useCallback(() => audioContextRef.current, [])
  const getMasterGain = useCallback(() => masterGainRef.current, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <SoundContext.Provider value={{
      volume,
      isMuted,
      setVolume,
      toggleMute,
      getAudioContext,
      getMasterGain,
      initAudio
    }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundContext() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider')
  }
  return context
}
