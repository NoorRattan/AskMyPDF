import { motion, useReducedMotion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function StreamingMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const shouldReduce = useReducedMotion()
  return <motion.article initial={shouldReduce ? false : { opacity: 0, y: 10 }} animate={shouldReduce ? undefined : { opacity: 1, y: 0 }} className="message-row message-assistant"><span className="assistant-avatar" aria-hidden="true"><Sparkles size={13} /></span><div className="message-content"><div className="message-meta"><span>AskMyPDF</span><span>Writing</span></div><div className="message-bubble"><p>{content || ""}{isStreaming ? <span className="stream-cursor" aria-label="Response streaming" /> : null}</p></div></div></motion.article>
}
