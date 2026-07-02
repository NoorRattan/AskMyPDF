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
    <div className="mt-3.5 border-t-4 border-[#FF3AF2]/60 pt-3">
      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border-2 border-[#FFE600] bg-[#0D0D1A]/70 px-2 py-1 text-xs font-black uppercase tracking-wide text-white outline-none shadow-[3px_3px_0_#FF3AF2] transition-colors duration-150 hover:bg-[#2D1B4E] hover:text-[#FFE600] focus-visible:ring-4 focus-visible:ring-[#FFE600]"
        whileTap={shouldReduce ? undefined : { scale: 0.97 }}
      >
        <BookOpen size={12} aria-hidden="true" className="text-[#00F5D4]" />
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
                  className="group rounded-xl border-2 border-[#00F5D4]/80 bg-[#0D0D1A]/76 p-3 shadow-[4px_4px_0_#7B2FFF] transition-colors duration-150 hover:border-[#FFE600] hover:bg-[#2D1B4E]/80"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="rounded-md border-2 border-[#FFE600] bg-[#FFE600]/12 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wide text-[#FFE600]">
                      Page {src.page_number}
                    </span>
                  </div>
                  <p className="break-words font-mono text-xs font-semibold leading-relaxed text-[#DCD7FF] [overflow-wrap:anywhere]">
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
