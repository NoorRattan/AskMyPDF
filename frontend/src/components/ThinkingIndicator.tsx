import { motion, useReducedMotion } from "framer-motion"

interface ThinkingIndicatorProps {
  label?: string
}

export function ThinkingIndicator({ label = "Thinking..." }: ThinkingIndicatorProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 self-start"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border-4 border-[#FFE600] text-[11px] font-black text-white"
        style={{
          background: "linear-gradient(135deg, #FF3AF2, #7B2FFF, #00F5D4)",
          boxShadow: "0 0 18px rgba(255,58,242,0.56), 4px 4px 0 #00F5D4",
        }}
        aria-label="AI thinking"
      >
        AI
      </span>

      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border-4 border-[#00F5D4] px-4 py-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(13,13,26,0.96) 0%, rgba(45,27,78,0.92) 100%)",
          boxShadow: "6px 6px 0 #7B2FFF, 0 0 24px rgba(0,245,212,0.24)",
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
              background: idx === 1 ? "#FFE600" : idx === 2 ? "#FF3AF2" : "#00F5D4",
              boxShadow: idx === 1 ? "0 0 10px rgba(255,230,0,0.88)" : "0 0 8px rgba(0,245,212,0.72)",
            }}
          />
        ))}
        <span className="ml-1 font-mono text-[11px] font-bold text-[#DCD7FF]">{label}</span>
      </div>
    </motion.div>
  )
}
