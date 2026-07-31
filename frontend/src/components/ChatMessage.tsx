import { motion, useReducedMotion } from "framer-motion"
import { Bookmark, Check, Sparkles } from "lucide-react"

import type { Message } from "../types"
import { SourceCitations } from "./SourceCitations"

interface ChatMessageProps { message: Message; onSave?: () => void; isSaving?: boolean; isSaved?: boolean }

function time(date: Date) { return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date) }

export function ChatMessage({ message, onSave, isSaving = false, isSaved = false }: ChatMessageProps) {
  const shouldReduce = useReducedMotion()
  const isUser = message.role === "user"
  return (
    <motion.article initial={shouldReduce ? false : { opacity: 0, y: 12 }} animate={shouldReduce ? undefined : { opacity: 1, y: 0 }} transition={{ duration: .35, ease: [0.22, 1, .36, 1] }} className={`message-row ${isUser ? "message-user" : "message-assistant"}`}>
      {!isUser ? <span className="assistant-avatar" aria-hidden="true"><Sparkles size={13} /></span> : null}
      <div className="message-content">
        <div className="message-meta"><span>{isUser ? "You" : "AskMyPDF"}</span><time>{time(message.timestamp)}</time></div>
        <div className="message-bubble">
          <p>{message.content}</p>
          {message.modelUsed ? <p className="model-attribution">{message.modeUsed === "offline" ? "Private route" : "Online route"} · {message.modelUsed}{message.providerUsed ? ` via ${message.providerUsed}` : ""}</p> : null}
          {message.sources?.length ? <SourceCitations sources={message.sources} /> : null}
          {message.sources?.length && onSave ? <button type="button" onClick={onSave} disabled={isSaving || isSaved} className="save-answer">{isSaved ? <Check size={13} /> : <Bookmark size={13} />}{isSaving ? "Saving…" : isSaved ? "Saved to this session" : "Save this answer"}</button> : null}
        </div>
      </div>
    </motion.article>
  )
}
