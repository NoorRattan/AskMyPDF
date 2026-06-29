import { motion, useReducedMotion } from "framer-motion"
import { FileText } from "lucide-react"

import type { UploadState } from "../types"

interface HeaderProps {
  uploadState: UploadState
  onReset: () => void
  onStart?: () => void
}

export function Header({ uploadState, onReset, onStart }: HeaderProps) {
  const isReady = uploadState.status === "ready"
  const shouldReduce = useReducedMotion()

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between overflow-hidden border-b border-border/70 bg-bg/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            boxShadow: "0 0 14px #7C3AED33",
            animation: shouldReduce ? undefined : "icon-breathe 2.5s ease-in-out infinite",
          }}
          aria-hidden="true"
        >
          <FileText size={16} className="text-white" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold tracking-normal text-text">AskMyPDF</span>
      </div>

      {isReady ? (
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[180px] items-center gap-1.5 truncate rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-secondary transition-all duration-200 hover:border-success/50 hover:shadow-[0_0_0_2px_rgba(16,185,129,0.15)] sm:flex">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-success"
              style={{ animation: shouldReduce ? undefined : "success-ping 2s ease-out infinite" }}
              aria-hidden="true"
            />
            {uploadState.filename}
          </span>
          <motion.button
            type="button"
            onClick={onReset}
            whileHover={shouldReduce ? undefined : { x: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="rounded px-1 py-1 text-sm text-secondary transition-colors duration-150 hover:text-primary-light hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Upload new PDF
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-5 text-sm text-secondary md:flex" aria-label="Landing sections">
            <a
              className="rounded transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href="#demo"
            >
              Demo
            </a>
            <a
              className="rounded transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href="#trust"
            >
              Engine
            </a>
          </nav>
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={
              shouldReduce
                ? undefined
                : {
                    y: -1,
                    borderColor: "#7C3AED",
                    boxShadow: "0 0 0 1px #7C3AED, 0 4px 16px rgba(124,58,237,0.15)",
                  }
            }
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="cursor-pointer rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-primary-light outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            Start
          </motion.button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px overflow-hidden" aria-hidden="true">
        <div
          className="h-full w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, #7C3AED, #A78BFA, transparent)",
            animation: shouldReduce ? undefined : "shimmer-x 3.5s ease-in-out infinite",
          }}
        />
      </div>
    </header>
  )
}
