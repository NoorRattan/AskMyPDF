import { FileText, CloudUpload as UploadCloud } from "lucide-react"
import { type ChangeEvent, type DragEvent, type KeyboardEvent, forwardRef, useImperativeHandle, useRef, useState } from "react"

import { cn } from "../lib/utils"
import type { UploadState } from "../types"

interface UploadZoneProps {
  uploadState: UploadState
  onUpload: (file: File) => Promise<void>
  onReset: () => void
}

export interface UploadZoneHandle {
  openPicker: () => void
}

const fallbackError = "Couldn't process that PDF. Make sure it's not scanned or encrypted."

export const UploadZone = forwardRef<UploadZoneHandle, UploadZoneProps>(function UploadZone(
  { uploadState, onUpload, onReset },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const isBusy = uploadState.status === "uploading" || uploadState.status === "processing"
  const isError = uploadState.status === "error" || Boolean(clientError)
  const error = clientError ?? uploadState.error ?? fallbackError
  const progress = uploadState.progress ?? (uploadState.status === "uploading" ? 2 : 0)
  const stageLabel = uploadState.stage
    ? uploadState.stage.replace(/^\w/, (char) => char.toUpperCase())
    : "Queued"

  function openPicker() {
    if (!isBusy) {
      inputRef.current?.click()
    }
  }

  useImperativeHandle(ref, () => ({ openPicker }), [isBusy])

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setClientError("Only PDF files are accepted.")
      return
    }

    setClientError(null)
    await onUpload(file)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openPicker()
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]

    if (file) {
      void handleFile(file)
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      void handleFile(file)
    }

    event.target.value = ""
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} className="sr-only" />
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF file - click or drag and drop"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 p-8 text-center transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
          isDragging && "border-brand-400 bg-brand-500/5 scale-[1.01]",
          !isDragging && !isBusy && !isError && "border-ink-700 bg-ink-800/40 hover:border-brand-500/50 hover:bg-ink-800/60",
          isBusy && "pointer-events-none border-brand-500/50 bg-ink-800/60",
          isError && "border-danger/50 bg-danger/5",
        )}
      >
        {isBusy ? (
          <div role="status" aria-label="Processing" className="flex flex-col items-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-ink-700" />
              <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-brand-400" />
              <div className="absolute inset-2 animate-spin-slow rounded-full border-2 border-transparent border-b-accent-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              <FileText size={24} className="text-brand-400" />
            </div>
            <div className="mb-3 h-1.5 w-48 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="font-mono text-xs font-medium text-ink-400">
              {stageLabel} · {Math.round(progress)}%
            </p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">{uploadState.message ?? "Processing..."}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink-700 bg-ink-800 transition-all duration-300 group-hover:border-brand-500/50 group-hover:bg-brand-500/10",
                isDragging && "border-brand-400 bg-brand-500/10",
              )}
            >
              <UploadCloud size={28} className={cn("text-ink-400 transition-colors group-hover:text-brand-400", isDragging && "text-brand-400")} />
            </div>
            <p className="text-lg font-semibold text-ink-100">
              {isDragging ? "Drop your PDF here" : "Upload a PDF"}
            </p>
            <p className="mt-1.5 text-sm text-ink-500">Drag and drop or click to browse</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["PDF only", "50MB max", "Session-scoped"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-ink-700 bg-ink-800/60 px-3 py-1 font-mono text-[11px] font-medium text-ink-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isError ? (
        <div className="mt-4 text-center">
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">{error}</p>
          <button
            type="button"
            onClick={() => {
              setClientError(null)
              onReset()
            }}
            className="mt-3 rounded-lg border border-ink-700 bg-ink-800 px-5 py-2 text-sm font-medium text-ink-200 transition hover:bg-ink-700"
          >
            Try again
          </button>
        </div>
      ) : null}
    </>
  )
})
