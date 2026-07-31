import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronDown, Quote } from "lucide-react"
import { useState } from "react"

import type { SourceChunk } from "../types"

export function SourceCitations({ sources }: { sources: SourceChunk[] }) {
  const [open, setOpen] = useState(false)
  const shouldReduce = useReducedMotion()
  return <div className="citations"><button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="citation-toggle"><Quote size={12} /><span>{sources.length} cited {sources.length === 1 ? "passage" : "passages"}</span><motion.span animate={shouldReduce ? undefined : { rotate: open ? 180 : 0 }}><ChevronDown size={12} /></motion.span></button><AnimatePresence>{open ? <motion.div initial={shouldReduce ? false : { opacity: 0, height: 0 }} animate={shouldReduce ? undefined : { opacity: 1, height: "auto" }} exit={shouldReduce ? undefined : { opacity: 0, height: 0 }} className="citation-list">{sources.map((source, index) => <article key={`${source.page_number}-${source.chunk_index}-${index}`}><span>Page {source.page_number}</span><p>{source.text.length > 250 ? `${source.text.slice(0, 250)}…` : source.text}</p></article>)}</motion.div> : null}</AnimatePresence></div>
}
