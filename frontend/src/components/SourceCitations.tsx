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
    <div className="mt-3.5 border-t border-border/40 pt-3">
      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-secondary outline-none transition-colors duration-150 hover:bg-primary/10 hover:text-primary-light focus-visible:ring-2 focus-visible:ring-primary"
        whileTap={shouldReduce ? undefined : { scale: 0.97 }}
      >
        <BookOpen size={12} aria-hidden="true" className="text-primary-light" />
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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-col gap-2">
              {sources.map((src, idx) => (
                <motion.div
                  key={`${src.page_number}-${src.chunk_index}-${idx}`}
                  initial={shouldReduce ? false : { opacity: 0, x: -8 }}
                  animate={shouldReduce ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.055, duration: 0.22, ease: "easeOut" }}
                  className="group rounded-xl border border-border/70 bg-bg/60 p-3 transition-colors duration-150 hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary-light">
                      Page {src.page_number}
                    </span>
                  </div>
                  <p className="font-mono text-xs leading-relaxed text-secondary/80">
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
