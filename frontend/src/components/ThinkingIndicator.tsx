import { motion, useReducedMotion } from "framer-motion"

export function ThinkingIndicator() {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 self-start"
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
          boxShadow: "0 0 16px #7C3AED55",
        }}
        aria-label="AI thinking"
      >
        AI
      </span>

      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(26,27,46,0.95) 0%, rgba(18,19,31,0.9) 100%)",
          border: "1px solid rgba(42,43,69,0.9)",
          borderLeft: "2px solid #7C3AED",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={
              shouldReduce
                ? {}
                : {
                    y: [0, -7, 0],
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 1.2, 1],
                  }
            }
            transition={{
              delay: idx * 0.16,
              repeat: Infinity,
              duration: 0.7,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full"
            style={{
              background: idx === 1 ? "#A78BFA" : "#7C3AED",
              boxShadow: idx === 1 ? "0 0 8px #A78BFA88" : "0 0 6px #7C3AED66",
            }}
          />
        ))}
        <span className="ml-1 font-mono text-[11px] text-secondary/60">Thinking...</span>
      </div>
    </motion.div>
  )
}
