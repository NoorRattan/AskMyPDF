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
        style={isBusy ? { animation: "border-pulse 2s ease-in-out infinite" } : undefined}
        className={cn(
          "upload-zone-modern group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border bg-graphite/95 p-6 text-center transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:min-h-80 sm:p-10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plasma",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(123,97,255,0.28),transparent_34%),linear-gradient(135deg,rgba(103,232,249,0.12),transparent_38%,rgba(123,97,255,0.14))] before:opacity-80 before:transition-opacity",
          "after:absolute after:inset-px after:rounded-[calc(2.5rem-2px)] after:border after:border-white/10 after:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_45%,rgba(0,0,0,0.2))]",
          isDragging && "scale-[1.012] border-plasma bg-plasma/5 shadow-[0_0_0_4px_#7B61FF33,inset_0_0_70px_#7B61FF26,0_32px_90px_#7B61FF28] before:opacity-100",
          !isDragging && !isBusy && !isError && "border-white/14 shadow-[0_34px_95px_rgba(10,10,20,0.32)] hover:scale-[1.004] hover:border-plasma/60 hover:shadow-[0_34px_110px_rgba(123,97,255,0.18)]",
          isBusy && "processing-active pointer-events-none border-solid border-plasma shadow-[0_0_42px_#7B61FF24] before:opacity-100",
          isError && "border-solid border-error",
        )}
      >
        <span className="upload-mesh" aria-hidden="true" />
        <span className="upload-scan-line" aria-hidden="true" />
        {!isBusy ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
            aria-hidden="true"
            style={{
              background: "radial-gradient(ellipse at center, #7B61FF2E 0%, transparent 64%)",
              animation: "glow-pulse 3s ease-in-out infinite",
            }}
          />
        ) : null}

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
            <div className="mt-5 h-1.5 w-52 overflow-hidden rounded-full bg-border/70">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-plasma to-cyan-300 transition-[width] duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase text-cyan-50/62">
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
                "upload-icon absolute -bottom-3 flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-cyan-200/20 bg-plasma text-white shadow-[0_18px_46px_rgba(123,97,255,0.42)] transition-all duration-300",
                isDragging && "upload-icon-dragging",
              )}
            >
              <UploadCloud size={23} aria-hidden="true" />
            </div>
          </div>
        )}

        <p className="relative z-10 mt-2 text-2xl font-extrabold leading-tight text-ghost sm:text-3xl">
          {isBusy ? (uploadState.message ?? "Turning pages into context...") : "Drop your PDF here"}
        </p>
        <p className="relative z-10 mt-2 min-h-5 text-sm font-medium text-cyan-50/80">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 font-mono text-[11px] uppercase text-cyan-50/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <CheckCircle2 size={12} className="text-cyan-200" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-3 cursor-pointer rounded-[1.25rem] border border-deep-void/12 bg-white px-5 py-2.5 text-sm font-medium text-plasma outline-none transition hover:-translate-y-px hover:border-plasma hover:shadow-[0_0_0_1px_#7B61FF,0_4px_16px_rgba(123,97,255,0.15)] focus-visible:ring-2 focus-visible:ring-plasma"
          >
            Try again
          </button>
        </div>
      ) : null}
    </>
  )
}
