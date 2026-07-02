import { motion, useReducedMotion } from "framer-motion"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
}

function AiAvatar() {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border-4 border-[#FFE600] text-[11px] font-black text-white"
      style={{
        background: "linear-gradient(135deg, #FF3AF2, #7B2FFF, #00F5D4)",
        boxShadow: "0 0 18px rgba(255,58,242,0.56), 4px 4px 0 #00F5D4",
      }}
      aria-hidden="true"
    >
      AI
    </span>
  )
}

export function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex max-w-full items-start gap-2.5 self-start"
    >
      <AiAvatar />
      <div
        className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border-4 border-[#00F5D4] px-4 py-3 backdrop-blur-sm sm:max-w-[90%]"
        style={{
          background: "linear-gradient(135deg, rgba(13,13,26,0.96) 0%, rgba(45,27,78,0.92) 100%)",
          boxShadow: "6px 6px 0 #7B2FFF, 0 0 24px rgba(0,245,212,0.24)",
        }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-white [overflow-wrap:anywhere]">
          {content}
          {isStreaming ? (
            <motion.span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                background: "linear-gradient(180deg, #FFE600, #FF3AF2, #00F5D4)",
                marginLeft: "3px",
                verticalAlign: "middle",
                borderRadius: "1px",
                boxShadow: "0 0 8px rgba(255,230,0,0.88)",
              }}
              animate={shouldReduce ? undefined : { opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
            />
          ) : null}
        </p>
      </div>
    </motion.div>
  )
}
