'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  target: number
  duration?: number
}

export function AnimatedCounter({ target, duration = 1500 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(easeOutQuart * target)

      if (currentCount !== countRef.current) {
        countRef.current = currentCount
        setCount(currentCount)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    startTimeRef.current = null
    countRef.current = 0
    requestAnimationFrame(animate)
  }, [target, duration])

  return <span>{count.toLocaleString()}</span>
}
