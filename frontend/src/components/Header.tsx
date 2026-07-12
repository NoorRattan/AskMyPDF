import { FileText, RotateCcw } from "lucide-react"

import type { UploadState } from "../types"

interface HeaderProps {
  uploadState: UploadState
  onReset: () => void
  onHome?: () => void
}

export function Header({ uploadState, onReset, onHome }: HeaderProps) {
  const isReady = uploadState.status === "ready"

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-ink-800 bg-ink-900/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onHome}
        className="flex min-w-0 items-center gap-3 rounded-lg text-left transition hover:opacity-80"
        aria-label="Return to AskMyPDF home"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
          <FileText size={18} className="text-brand-400" />
        </div>
        <span className="truncate text-base font-bold tracking-tight text-ink-100">AskMyPDF</span>
      </button>

      {isReady ? (
        <div className="flex min-w-0 items-center gap-3">
          <span
            title={uploadState.filename ?? undefined}
            className="flex max-w-[140px] items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm font-medium text-ink-300 sm:max-w-[280px]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            <span className="min-w-0 truncate">{uploadState.filename}</span>
          </span>
          <button
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm font-medium text-ink-300 transition hover:border-brand-500/50 hover:bg-ink-700 hover:text-ink-100"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">New PDF</span>
          </button>
        </div>
      ) : null}
    </header>
  )
}
