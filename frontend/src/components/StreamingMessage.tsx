import { motion, useReducedMotion } from "framer-motion"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
}

function AiAvatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(0,82,255,0.22)]" aria-hidden="true">
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
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-white px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:max-w-[90%]">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground [overflow-wrap:anywhere]">
          {content}
          {isStreaming ? (
            <motion.span
              aria-hidden="true"
              className="ml-1 inline-block h-[1em] w-0.5 translate-y-0.5 rounded bg-primary"
              animate={shouldReduce ? undefined : { opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
            />
          ) : null}
        </p>
      </div>
    </motion.div>
  )
}
