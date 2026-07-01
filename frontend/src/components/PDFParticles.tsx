import { type CSSProperties, useEffect, useMemo } from "react"

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
          color: Math.random() > 0.45 ? "#7B61FF" : "#67E8F9",
          opacity: 0.6 + Math.random() * 0.35,
        }
      }),
    [],
  )

  useEffect(() => {
    const timeout = window.setTimeout(onComplete, 2300)
    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="pdf-particle"
          style={
            {
              width: particle.size,
              height: particle.size,
              background: particle.color,
              opacity: particle.opacity,
              "--particle-x": `${particle.x}px`,
              "--particle-y": `${particle.y}px`,
              "--particle-delay": `${particle.delay}s`,
              "--particle-duration": `${particle.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
