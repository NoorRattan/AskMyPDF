import { motion, useReducedMotion } from "framer-motion"

import type { Message } from "../types"
import { SourceCitations } from "./SourceCitations"

interface ChatMessageProps {
  message: Message
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function ChatMessage({ message }: ChatMessageProps) {
  const shouldReduce = useReducedMotion()

  if (message.role === "user") {
    return (
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[82%] self-end"
      >
        <div className="rounded-2xl rounded-tr-sm border border-primary/15 bg-[#1E1B4B] px-4 py-3 text-primary-light shadow-[0_14px_42px_rgba(30,27,75,0.36)]">
          <p className="whitespace-pre-wrap text-[15px] leading-6">{message.content}</p>
        </div>
        <p className="mt-1.5 text-right font-mono text-xs text-secondary">{formatTime(message.timestamp)}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[88%] self-start"
    >
      <div className="rounded-2xl rounded-tl-sm border border-border/70 border-l-2 border-l-primary bg-surface-raised/95 px-4 py-3 shadow-[0_14px_42px_rgba(0,0,0,0.26)] backdrop-blur">
        <p className="whitespace-pre-wrap text-[15px] leading-6 text-text">{message.content}</p>
        {message.sources && message.sources.length > 0 ? <SourceCitations sources={message.sources} /> : null}
      </div>
      <p className="mt-1.5 font-mono text-xs text-secondary">{formatTime(message.timestamp)}</p>
    </motion.div>
  )
}
