import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo } from "react"

interface PDFParticlesProps {
  onComplete: () => void
}

interface Particle {
  id: number
  size: number
  x: number
  y: number
  delay: number
  duration: number
  color: string
  opacity: number
}

export function PDFParticles({ onComplete }: PDFParticlesProps) {
  const shouldReduce = useReducedMotion()
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 28 }, (_, idx) => {
        const angle = Math.random() * 2 * Math.PI
        const radius = 20 + Math.random() * 90

        return {
          id: idx,
          size: 4 + Math.random() * 8,
          x: Math.cos(angle) * radius,
          y: -(70 + Math.random() * 140),
          delay: Math.random() * 0.5,
          duration: 1.2 + Math.random() * 0.7,
          color: Math.random() > 0.45 ? "#7C3AED" : "#A78BFA",
          opacity: 0.6 + Math.random() * 0.35,
        }
      }),
    [],
  )

  useEffect(() => {
    if (shouldReduce) {
      onComplete()
    }
  }, [onComplete, shouldReduce])

  if (shouldReduce) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            style={{
              position: "absolute",
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              background: particle.color,
              opacity: particle.opacity,
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0 }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: [0, 0.6, 1, 0.4],
            }}
            onAnimationComplete={particle.id === 27 ? onComplete : undefined}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}
