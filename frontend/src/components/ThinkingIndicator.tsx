import { motion, useReducedMotion } from "framer-motion"

interface ThinkingIndicatorProps {
  label?: string
}

export function ThinkingIndicator({ label = "Thinking..." }: ThinkingIndicatorProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 self-start"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(0,82,255,0.22)]" aria-label="AI thinking">
        AI
      </span>

      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-white px-4 py-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={
              shouldReduce
                ? {}
                : {
                    y: [0, -6, 0],
                    opacity: [0.35, 1, 0.35],
                    scale: [1, 1.18, 1],
                  }
            }
            transition={{
              delay: idx * 0.16,
              repeat: Infinity,
              duration: 0.72,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        ))}
        <span className="ml-1 font-mono text-[11px] text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  )
}
