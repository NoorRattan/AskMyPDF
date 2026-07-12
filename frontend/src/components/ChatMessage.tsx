import { motion, useReducedMotion } from "framer-motion"
import { CircleCheck as CheckCircle2, Save } from "lucide-react"

import type { Message } from "../types"
import { SourceCitations } from "./SourceCitations"

interface ChatMessageProps {
  message: Message
  onSave?: () => void
  isSaving?: boolean
  isSaved?: boolean
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
}

export function ChatMessage({ message, onSave, isSaving = false, isSaved = false }: ChatMessageProps) {
  const shouldReduce = useReducedMotion()

  if (message.role === "user") {
    return (
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 10, rotateX: -8 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="flex max-w-full flex-col items-end gap-1 self-end"
      >
        <div style={{ transform: "translateZ(20px)" }} className="min-w-0 max-w-[82%] rounded-2xl rounded-tr-sm border border-brand-500/30 bg-brand-500/10 px-4 py-3">
          <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-ink-100 [overflow-wrap:anywhere]">
            {message.content}
          </p>
        </div>
        <p className="pr-1 font-mono text-[11px] text-ink-500">{formatTime(message.timestamp)}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10, rotateX: 8 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
      className="flex max-w-full flex-col gap-1 self-start"
    >
      <div style={{ transform: "translateZ(20px)" }} className="flex max-w-full items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
          <span className="text-[11px] font-bold text-brand-400">AI</span>
        </div>
        <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm border border-ink-700 bg-ink-800/50 px-4 py-3">
          <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-ink-100 [overflow-wrap:anywhere]">
            {message.content}
          </p>
          {message.modelUsed ? (
            <p className="mt-3 rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 font-mono text-[11px] text-ink-400">
              {message.modeUsed === "offline" ? "Answered by the backend-only route using " : "Answered online with "}
              {message.modelUsed}
              {message.providerUsed ? ` via ${message.providerUsed}` : ""}
            </p>
          ) : null}
          {message.sources && message.sources.length > 0 && onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isSaved}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-300 transition hover:border-brand-500/50 hover:bg-ink-700 hover:text-ink-100 disabled:cursor-default disabled:opacity-60"
            >
              {isSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {isSaving ? "Saving" : isSaved ? "Saved cited answer" : "Save cited answer"}
            </button>
          ) : null}
          {message.sources && message.sources.length > 0 ? <SourceCitations sources={message.sources} /> : null}
        </div>
      </div>
      <p className="pl-10 font-mono text-[11px] text-ink-500">{formatTime(message.timestamp)}</p>
    </motion.div>
  )
}
