import { motion, useReducedMotion } from "framer-motion"

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
}

export function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[85%] self-start sm:max-w-[90%]"
    >
      <div className="rounded-2xl rounded-tl-sm border-l-2 border-primary bg-surface-raised px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <p className="whitespace-pre-wrap text-sm text-text">
          {content}
          {isStreaming ? (
            <motion.span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "2px",
                height: "1em",
                background: "#A78BFA",
                marginLeft: "2px",
                verticalAlign: "middle",
                borderRadius: "1px",
              }}
              animate={shouldReduce ? undefined : { opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
          ) : null}
        </p>
      </div>
    </motion.div>
  )
}
