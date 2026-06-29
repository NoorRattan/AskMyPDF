import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

import type { SourceChunk } from "../types"

interface SourceCitationsProps {
  sources: SourceChunk[]
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="mt-3 flex items-center gap-1.5 rounded text-sm text-secondary outline-none transition-colors duration-150 hover:text-primary-light focus-visible:ring-2 focus-visible:ring-primary"
        whileTap={shouldReduce ? undefined : { scale: 0.97 }}
      >
        <motion.span
          animate={shouldReduce ? undefined : { rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </motion.span>
        {isOpen ? "Hide sources" : `View sources (${sources.length})`}
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
            <div className="mt-2 flex flex-col gap-2">
              {sources.map((src, idx) => (
                <motion.div
                  key={`${src.page_number}-${src.chunk_index}-${idx}`}
                  initial={shouldReduce ? false : { opacity: 0, y: -4 }}
                  animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.2, ease: "easeOut" }}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <p className="mb-1 font-mono text-xs uppercase tracking-wide text-secondary">Page {src.page_number}</p>
                  <p className="font-mono text-sm leading-relaxed text-secondary">
                    {src.text.length > 200 ? `${src.text.slice(0, 200)}...` : src.text}
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
