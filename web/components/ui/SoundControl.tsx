'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSoundContext } from '@/components/providers/SoundProvider'
import { cn } from '@/lib/utils'

export function SoundControl() {
  const { volume, isMuted, setVolume, toggleMute } = useSoundContext()
  const [isHovered, setIsHovered] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Play toggle sound directly (can't use useUISound as it depends on SoundContext)
  const playToggleSound = useCallback((isOn: boolean) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = isOn ? 700 : 400

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  }, [])

  const handleToggle = () => {
    playToggleSound(isMuted) // Play "on" sound if currently muted (will be unmuted)
    toggleMute()
  }

  // Calculate volume level for icon (0-3 bars)
  const volumeLevel = isMuted ? 0 : Math.ceil(volume * 3)

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Volume Slider - appears on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden mr-2"
          >
            <div className="w-[120px] h-9 flex items-center px-3 bg-ghost-card/90 backdrop-blur-sm rounded-lg border border-white/10">
              {/* Custom slider track */}
              <div className="relative w-full h-2 bg-white/10 rounded-full">
                {/* Filled portion */}
                <div
                  className="absolute top-0 left-0 h-full bg-accent-primary rounded-full"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
                {/* Native input for interaction */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none transition-transform hover:scale-110"
                  style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 8px)` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound Icon Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
          'bg-ghost-card/50 hover:bg-ghost-card border border-white/10 hover:border-white/20',
          isMuted && 'text-gray-500'
        )}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <AnimatePresence mode="wait">
          {isMuted ? (
            <motion.svg
              key="muted"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Speaker */}
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {/* X mark */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                d="M23 9l-6 6M17 9l6 6"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="unmuted"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Speaker */}
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {/* Volume waves */}
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: volumeLevel >= 1 ? 1 : 0,
                  opacity: volumeLevel >= 1 ? 1 : 0.3
                }}
                transition={{ duration: 0.2 }}
                d="M15.54 8.46a5 5 0 0 1 0 7.07"
              />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: volumeLevel >= 2 ? 1 : 0,
                  opacity: volumeLevel >= 2 ? 1 : 0.3
                }}
                transition={{ duration: 0.2, delay: 0.05 }}
                d="M18.36 5.64a9 9 0 0 1 0 12.73"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
