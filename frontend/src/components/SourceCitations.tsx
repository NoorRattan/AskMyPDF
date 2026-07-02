import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { BookOpen, ChevronDown } from "lucide-react"
import { useState } from "react"

import type { SourceChunk } from "../types"

interface SourceCitationsProps {
  sources: SourceChunk[]
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <div className="mt-3.5 border-t border-border pt-3">
      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none transition hover:border-primary/30 hover:bg-blue-50 hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/20"
        whileTap={shouldReduce ? undefined : { scale: 0.98 }}
      >
        <BookOpen size={12} aria-hidden="true" className="text-primary" />
        <span>{isOpen ? "Hide sources" : `View ${sources.length} source${sources.length !== 1 ? "s" : ""}`}</span>
        <motion.span
          animate={shouldReduce ? undefined : { rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="ml-auto"
        >
          <ChevronDown size={12} aria-hidden="true" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, height: 0 }}
            animate={shouldReduce ? undefined : { opacity: 1, height: "auto" }}
            exit={shouldReduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-col gap-2">
              {sources.map((src, idx) => (
                <motion.div
                  key={`${src.page_number}-${src.chunk_index}-${idx}`}
                  initial={shouldReduce ? false : { opacity: 0, x: -8 }}
                  animate={shouldReduce ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2, ease: "easeOut" }}
                  className="rounded-xl border border-border bg-slate-50 p-3 transition hover:border-primary/30 hover:bg-blue-50"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="rounded-md border border-primary/20 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-primary">
                      Page {src.page_number}
                    </span>
                  </div>
                  <p className="break-words font-mono text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                    {src.text.length > 220 ? `${src.text.slice(0, 220)}...` : src.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
