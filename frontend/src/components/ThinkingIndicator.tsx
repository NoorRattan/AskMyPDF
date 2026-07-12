import { motion, useReducedMotion } from "framer-motion"

interface ThinkingIndicatorProps {
  label?: string
}

export function ThinkingIndicator({ label = "Thinking..." }: ThinkingIndicatorProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 8, rotateX: -6 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
      className="flex items-start gap-2.5 self-start"
    >
      <div style={{ transform: "translateZ(20px)" }} className="flex max-w-full items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
          <span className="text-[11px] font-bold text-brand-400">AI</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-ink-700 bg-ink-800/60 px-4 py-3.5">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              animate={shouldReduce ? {} : { y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ delay: idx * 0.15, repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
              className="h-2 w-2 rounded-full"
              style={{
                background: idx === 0 ? "#3B82F6" : idx === 1 ? "#22D3EE" : "#818CF8",
              }}
            />
          ))}
          <span className="ml-1 font-mono text-[11px] font-medium text-ink-400">{label}</span>
        </div>
      </div>
    </motion.div>
  )
}
