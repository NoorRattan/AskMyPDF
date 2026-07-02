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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/88 px-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_12px_26px_rgba(0,82,255,0.22)]"
          aria-hidden="true"
        >
          <FileText size={16} aria-hidden="true" />
        </div>
        <span className="truncate font-serif text-xl tracking-normal text-foreground">AskMyPDF</span>
      </div>

      {isReady ? (
        <div className="flex min-w-0 items-center gap-3">
          <span
            title={uploadState.filename ?? undefined}
            className="flex max-w-[136px] items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground sm:max-w-[260px]"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-success"
              style={{ animation: shouldReduce ? undefined : "pulse-dot 2s ease-out infinite" }}
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{uploadState.filename}</span>
          </span>
          <motion.button
            type="button"
            onClick={onReset}
            whileHover={shouldReduce ? undefined : { y: -1 }}
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary-light px-3 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,82,255,0.2)] outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Upload new PDF
          </motion.button>
        </div>
      ) : (
        <motion.button
          type="button"
          onClick={onStart}
          whileHover={shouldReduce ? undefined : { y: -1 }}
          whileTap={shouldReduce ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,82,255,0.2)] outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Start
        </motion.button>
      )}
    </header>
  )
}
