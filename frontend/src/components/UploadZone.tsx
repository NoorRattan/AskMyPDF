import { CheckCircle2, FileText, UploadCloud } from "lucide-react"
import { type ChangeEvent, type DragEvent, type KeyboardEvent, useRef, useState } from "react"

import { cn } from "../lib/utils"
import type { UploadState } from "../types"
import { PDFParticles } from "./PDFParticles"

interface UploadZoneProps {
  uploadState: UploadState
  onUpload: (file: File) => Promise<void>
  onReset: () => void
}

const fallbackError = "Couldn't process that PDF. Make sure it's not scanned or encrypted."

export function UploadZone({ uploadState, onUpload, onReset }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [showParticles, setShowParticles] = useState(false)
  const isBusy = uploadState.status === "uploading" || uploadState.status === "processing"
  const isError = uploadState.status === "error" || Boolean(clientError)
  const error = clientError ?? uploadState.error ?? fallbackError
  const progress = uploadState.progress ?? (uploadState.status === "uploading" ? 2 : 0)
  const stageLabel = uploadState.stage ? uploadState.stage.replace(/^\w/, (char) => char.toUpperCase()) : "Queued"

  function openPicker() {
    if (!isBusy) {
      inputRef.current?.click()
    }
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setClientError("Only PDF files are accepted.")
      return
    }

    setClientError(null)
    setShowParticles(true)
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

  function handleTryAgain() {
    setClientError(null)
    onReset()
  }

  return (
    <>
      {showParticles ? <PDFParticles onComplete={() => setShowParticles(false)} /> : null}
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
          "upload-zone-modern relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border bg-white p-6 text-center transition duration-300 sm:min-h-80 sm:p-10",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(0,82,255,0.10),transparent_38%),linear-gradient(135deg,rgba(0,82,255,0.08),transparent_42%,rgba(77,124,255,0.07))]",
          "after:absolute after:inset-px after:rounded-[calc(1.75rem-1px)] after:border after:border-white/70",
          isDragging && "scale-[1.01] border-primary bg-blue-50 shadow-[0_20px_60px_rgba(0,82,255,0.14)]",
          !isDragging && !isBusy && !isError && "border-border shadow-[0_20px_60px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_80px_rgba(0,82,255,0.14)]",
          isBusy && "processing-active pointer-events-none border-primary/40 shadow-[0_24px_80px_rgba(0,82,255,0.16)]",
          isError && "border-error/60 bg-red-50 shadow-[0_20px_60px_rgba(239,68,68,0.12)]",
        )}
      >
        <span className="upload-mesh" aria-hidden="true" />
        <span className="upload-scan-line" aria-hidden="true" />

        {isBusy ? (
          <div role="status" aria-label="Processing" className="relative z-10 mb-6 flex flex-col items-center">
            <div className="processing-orb" aria-hidden="true">
              <span className="processing-ring processing-ring-a" />
              <span className="processing-ring processing-ring-b" />
              <span className="processing-dot processing-dot-a" />
              <span className="processing-dot processing-dot-b" />
              <span className="processing-document">
                <FileText size={30} />
                <span className="processing-scan" />
              </span>
            </div>
            <div className="mt-5 h-1.5 w-52 overflow-hidden rounded-full bg-slate-200">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-primary">
              <span>{stageLabel}</span>
              <span className="opacity-35">/</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mb-6 grid place-items-center">
            <div className="upload-file-stack" aria-hidden="true">
              <span className="upload-file upload-file-back" />
              <span className="upload-file upload-file-mid" />
              <span className="upload-file upload-file-front">
                <FileText size={28} />
              </span>
            </div>
            <div
              className={cn(
                "absolute -bottom-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_14px_30px_rgba(0,82,255,0.28)] transition duration-300",
                isDragging && "upload-icon-dragging",
              )}
            >
              <UploadCloud size={22} aria-hidden="true" />
            </div>
          </div>
        )}

        <p className="relative z-10 mt-2 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
          {isBusy ? (uploadState.message ?? "Turning pages into context...") : "Drop your PDF here"}
        </p>
        <p className="relative z-10 mt-3 min-h-5 text-sm font-medium text-muted-foreground">
          {isBusy
            ? [
                uploadState.pageCount ? `${uploadState.pageCount} pages` : null,
                uploadState.chunkCount ? `${uploadState.chunkCount} chunks` : null,
              ]
                .filter(Boolean)
                .join(" / ") || "The upload can continue while the document index builds."
            : "Drag a file in or click to open your browser"}
        </p>
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2">
          {["PDF only", "50MB max", "Private session"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-600"
            >
              <CheckCircle2 size={12} className="text-success" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 text-center">
          <p className="rounded-2xl border border-error/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-3 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(0,82,255,0.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Try again
          </button>
        </div>
      ) : null}
    </>
  )
}
