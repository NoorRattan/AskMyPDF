import { motion, useReducedMotion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function ThinkingIndicator({ label = "Reading the document" }: { label?: string }) {
  const shouldReduce = useReducedMotion()
  return <motion.div initial={shouldReduce ? false : { opacity: 0, y: 8 }} animate={shouldReduce ? undefined : { opacity: 1, y: 0 }} className="thinking-row"><span className="assistant-avatar" aria-hidden="true"><Sparkles size={13} /></span><div><div className="thinking-dots" aria-hidden="true"><i /><i /><i /></div><span>{label}</span></div></motion.div>
}
