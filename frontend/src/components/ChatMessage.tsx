import { motion, useReducedMotion } from "framer-motion"
import { CheckCircle2, Save } from "lucide-react"

import type { Message } from "../types"
import { SourceCitations } from "./SourceCitations"

interface ChatMessageProps {
  message: Message
  onSave?: () => void
  isSaving?: boolean
  isSaved?: boolean
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function AiAvatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(0,82,255,0.22)]" aria-hidden="true">
      AI
    </span>
  )
}

export function ChatMessage({ message, onSave, isSaving = false, isSaved = false }: ChatMessageProps) {
  const shouldReduce = useReducedMotion()

  if (message.role === "user") {
    return (
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-w-full flex-col items-end gap-1 self-end"
      >
        <div className="min-w-0 max-w-[82%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-primary-light px-4 py-3 shadow-[0_14px_34px_rgba(0,82,255,0.2)]">
          <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-white [overflow-wrap:anywhere]">
            {message.content}
          </p>
        </div>
        <p className="pr-1 font-mono text-[11px] text-muted-foreground">{formatTime(message.timestamp)}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex max-w-full flex-col gap-1 self-start"
    >
      <div className="flex max-w-full items-start gap-2.5">
        <AiAvatar />
        <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-white px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground [overflow-wrap:anywhere]">
            {message.content}
          </p>
          {message.modelUsed ? (
            <p className="mt-3 rounded-xl border border-border bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {message.modeUsed === "offline" ? "Answered without external AI using " : "Answered online with "}
              <span className="font-bold text-foreground">{message.modelUsed}</span>
              {message.providerUsed ? ` via ${message.providerUsed}` : ""}
            </p>
          ) : null}
          {message.sources && message.sources.length > 0 && onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isSaved}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-blue-50 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-primary transition hover:-translate-y-0.5 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
            >
              {isSaved ? <CheckCircle2 size={13} aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
              {isSaving ? "Saving" : isSaved ? "Saved cited answer" : "Save cited answer"}
            </button>
          ) : null}
          {message.sources && message.sources.length > 0 ? <SourceCitations sources={message.sources} /> : null}
        </div>
      </div>
      <p className="pl-10 font-mono text-[11px] text-muted-foreground">{formatTime(message.timestamp)}</p>
    </motion.div>
  )
}
