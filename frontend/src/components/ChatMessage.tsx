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

function modelLabel(modelUsed: string): string {
  if (modelUsed.includes("8b") || modelUsed.includes("instant")) {
    return "Fast model"
  }

  if (modelUsed.includes("70b") || modelUsed.includes("versatile")) {
    return "Thinking model"
  }

  return modelUsed
}

/** Tiny avatar badge */
function AiAvatar() {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white"
      style={{
        background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
        boxShadow: "0 0 16px #7C3AED55",
      }}
      aria-hidden="true"
    >
      AI
    </span>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const shouldReduce = useReducedMotion()

  if (message.role === "user") {
    return (
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-w-full flex-col items-end gap-1 self-end"
      >
        <div
          className="min-w-0 max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 shadow-[0_8px_32px_rgba(30,27,75,0.45)]"
          style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #2D2A60 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-primary-light [overflow-wrap:anywhere]">
            {message.content}
          </p>
        </div>
        <p className="pr-1 font-mono text-[11px] text-secondary/50">{formatTime(message.timestamp)}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="flex max-w-full flex-col gap-1 self-start"
    >
      <div className="flex max-w-full items-start gap-2.5">
        <AiAvatar />
        <div
          className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(26,27,46,0.95) 0%, rgba(18,19,31,0.9) 100%)",
            border: "1px solid rgba(42,43,69,0.9)",
            borderLeft: "2px solid #7C3AED",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-text [overflow-wrap:anywhere]">
            {message.content}
          </p>
          {message.modelUsed ? (
            <p className="mt-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-primary-light">
              Answered with {modelLabel(message.modelUsed)}
            </p>
          ) : null}
          {message.sources && message.sources.length > 0 ? <SourceCitations sources={message.sources} /> : null}
        </div>
      </div>
      <p className="pl-9 font-mono text-[11px] text-secondary/50">{formatTime(message.timestamp)}</p>
    </motion.div>
  )
}
