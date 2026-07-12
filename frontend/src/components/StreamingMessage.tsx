import { motion, useReducedMotion } from "framer-motion"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
}

export function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex max-w-full items-start gap-2.5 self-start"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
        <span className="text-[11px] font-bold text-brand-400">AI</span>
      </div>
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-ink-700 bg-ink-800/60 px-4 py-3 sm:max-w-[90%]">
        <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-ink-100 [overflow-wrap:anywhere]">
          {content}
          {isStreaming ? (
            <motion.span
              aria-hidden="true"
              className="ml-0.5 inline-block h-4 w-0.5 bg-brand-400 align-middle"
              animate={shouldReduce ? undefined : { opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
            />
          ) : null}
        </p>
      </div>
    </motion.div>
  )
}
