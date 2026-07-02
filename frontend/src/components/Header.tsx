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
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between overflow-hidden border-b border-border/80 bg-bg/88 px-5 shadow-[0_1px_0_0_rgba(20,184,166,0.12),0_14px_44px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #14B8A6, #67E8F9)",
            boxShadow: "0 0 16px #14B8A644, inset 0 1px 0 rgba(255,255,255,0.22)",
            animation: shouldReduce ? undefined : "icon-breathe 2.5s ease-in-out infinite",
          }}
          aria-hidden="true"
        >
          <FileText size={16} className="text-white" aria-hidden="true" />
        </div>
        <span className="truncate text-xl font-extrabold tracking-normal text-text">AskMyPDF</span>
      </div>

      {isReady ? (
        <div className="flex min-w-0 items-center gap-3">
          <span
            title={uploadState.filename ?? undefined}
            className="flex max-w-[136px] items-center gap-2 rounded-xl border border-border bg-surface-raised/95 px-3 py-2 text-sm font-medium text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-success/50 hover:shadow-[0_0_0_2px_rgba(16,185,129,0.15)] sm:max-w-[260px]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-success"
              style={{ animation: shouldReduce ? undefined : "success-ping 2s ease-out infinite" }}
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{uploadState.filename}</span>
          </span>
          <motion.button
            type="button"
            onClick={onReset}
            whileHover={
              shouldReduce
                ? undefined
                : {
                    y: -1,
                    borderColor: "#14B8A6",
                    boxShadow: "0 10px 28px rgba(20,184,166,0.16)",
                  }
            }
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="shrink-0 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-secondary outline-none transition-colors duration-150 hover:text-primary-light focus-visible:ring-2 focus-visible:ring-primary"
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
                    borderColor: "#14B8A6",
                    boxShadow: "0 0 0 1px #14B8A6, 0 4px 16px rgba(20,184,166,0.15)",
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
            background: "linear-gradient(90deg, transparent, #14B8A6, #67E8F9, transparent)",
            animation: shouldReduce ? undefined : "shimmer-x 3.5s ease-in-out infinite",
          }}
        />
      </div>
    </header>
  )
}
