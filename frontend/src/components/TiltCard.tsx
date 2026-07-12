import { motion } from "framer-motion"
import { type ReactNode, type MouseEvent, useRef, useState, useCallback } from "react"

import { cn } from "../lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  scale?: number
  glare?: boolean
  springConfig?: { stiffness: number; damping: number }
}

export function TiltCard({
  children,
  className,
  maxTilt = 10,
  scale = 1.03,
  glare = true,
  springConfig = { stiffness: 250, damping: 20 },
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 })
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!ref.current) {
        return
      }

      const rect = ref.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5

      setTransform({
        rotateX: -y * maxTilt,
        rotateY: x * maxTilt,
        scale,
      })

      if (glare) {
        setGlarePos({
          x: (x + 0.5) * 100,
          y: (y + 0.5) * 100,
          opacity: 0.15,
        })
      }
    },
    [maxTilt, scale, glare],
  )

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 })
    setGlarePos((prev) => ({ ...prev, opacity: 0 }))
  }, [])

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      animate={{
        rotateX: transform.rotateX,
        rotateY: transform.rotateY,
        scale: transform.scale,
      }}
      transition={{ type: "spring", stiffness: springConfig.stiffness, damping: springConfig.damping }}
      className={cn("relative", className)}
    >
      {children}
      {glare ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2), transparent 50%)`,
            opacity: glarePos.opacity,
          }}
        />
      ) : null}
    </motion.div>
  )
}
