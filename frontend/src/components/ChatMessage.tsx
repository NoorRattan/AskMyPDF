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

/** Tiny avatar badge */
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

export function ChatMessage({ message, onSave, isSaving = false, isSaved = false }: ChatMessageProps) {
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
          className="min-w-0 max-w-[82%] rounded-2xl rounded-tr-sm border-4 border-[#FFE600] px-4 py-3 shadow-[6px_6px_0_#FF3AF2,0_0_24px_rgba(255,230,0,0.28)]"
          style={{
            background: "linear-gradient(135deg, #2D1B4E 0%, #0D0D1A 100%)",
          }}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            {message.content}
          </p>
        </div>
        <p className="pr-1 font-mono text-[11px] font-bold text-[#DCD7FF]/55">{formatTime(message.timestamp)}</p>
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
          className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm border-4 border-[#00F5D4] px-4 py-3 backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(13,13,26,0.96) 0%, rgba(45,27,78,0.92) 100%)",
            boxShadow: "6px 6px 0 #7B2FFF, 0 0 24px rgba(0,245,212,0.24)",
          }}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            {message.content}
          </p>
          {message.modelUsed ? (
            <p className="mt-3 rounded-xl border-2 border-[#FFE600] bg-[#0D0D1A]/72 px-3 py-2 font-mono text-[11px] font-bold text-[#DCD7FF]">
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
              className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-[#FFE600] bg-[#FF3AF2] px-3 py-2 font-mono text-[11px] font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#00F5D4] transition hover:-translate-y-0.5 hover:rotate-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] disabled:cursor-default disabled:border-[#00F5D4] disabled:bg-[#2D1B4E] disabled:text-[#A7FFF4] disabled:shadow-[3px_3px_0_#7B2FFF]"
            >
              {isSaved ? <CheckCircle2 size={13} aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
              {isSaving ? "Saving" : isSaved ? "Saved cited answer" : "Save cited answer"}
            </button>
          ) : null}
          {message.sources && message.sources.length > 0 ? <SourceCitations sources={message.sources} /> : null}
        </div>
      </div>
      <p className="pl-10 font-mono text-[11px] font-bold text-[#DCD7FF]/55">{formatTime(message.timestamp)}</p>
    </motion.div>
  )
}
