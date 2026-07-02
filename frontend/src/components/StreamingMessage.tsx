import { motion, useReducedMotion } from "framer-motion"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
}

function AiAvatar() {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white"
      style={{
        background: "linear-gradient(135deg, #14B8A6, #67E8F9)",
        boxShadow: "0 0 16px #14B8A655",
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
        className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm sm:max-w-[90%]"
        style={{
          background: "linear-gradient(135deg, rgba(26,27,46,0.95) 0%, rgba(18,19,31,0.9) 100%)",
          border: "1px solid rgba(42,43,69,0.9)",
          borderLeft: "2px solid #14B8A6",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-text [overflow-wrap:anywhere]">
          {content}
          {isStreaming ? (
            <motion.span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                background: "linear-gradient(180deg, #67E8F9, #14B8A6)",
                marginLeft: "3px",
                verticalAlign: "middle",
                borderRadius: "1px",
                boxShadow: "0 0 8px #67E8F988",
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
