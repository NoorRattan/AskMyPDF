import { motion, useReducedMotion } from "framer-motion"

export function ThinkingIndicator() {
  const shouldReduce = useReducedMotion()

  return (
    <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-tl-sm border-l-2 border-primary bg-surface-raised px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
      {[0, 1, 2].map((idx) => (
        <motion.div
          key={idx}
          animate={shouldReduce ? {} : { y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ delay: idx * 0.15, repeat: Infinity, duration: 0.65, ease: "easeInOut" }}
          className="h-2 w-2 rounded-full bg-primary"
        />
      ))}
    </div>
  )
}
