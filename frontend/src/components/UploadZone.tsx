import { CheckCircle2, FileText, UploadCloud } from "lucide-react"
import { type ChangeEvent, type DragEvent, type KeyboardEvent, forwardRef, useImperativeHandle, useRef, useState } from "react"

import { cn } from "../lib/utils"
import type { UploadState } from "../types"
import { PDFParticles } from "./PDFParticles"

interface UploadZoneProps {
  uploadState: UploadState
  onUpload: (file: File) => Promise<void>
  onReset: () => void
}

export interface UploadZoneHandle {
  openPicker: () => void
}

const fallbackError = "Couldn't process that PDF. Make sure it's not scanned or encrypted."

export const UploadZone = forwardRef<UploadZoneHandle, UploadZoneProps>(function UploadZone({ uploadState, onUpload, onReset }, ref) {
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

  useImperativeHandle(ref, () => ({ openPicker }), [isBusy])

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
          "upload-zone-modern group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-4 bg-[#0D0D1A]/95 p-6 text-center transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:min-h-80 sm:p-10",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0D0D1A]",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,58,242,0.34),transparent_34%),linear-gradient(135deg,rgba(0,245,212,0.2),transparent_38%,rgba(255,230,0,0.18))] before:opacity-90 before:transition-opacity",
          "after:absolute after:inset-px after:rounded-[calc(2.5rem-2px)] after:border-2 after:border-white/12 after:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_45%,rgba(0,0,0,0.24))]",
          isDragging && "scale-[1.018] rotate-1 border-[#FFE600] bg-[#2D1B4E] shadow-[0_0_0_6px_rgba(255,58,242,0.32),inset_0_0_80px_rgba(255,230,0,0.18),10px_10px_0_#00F5D4,20px_20px_0_#FF3AF2] before:opacity-100",
          !isDragging && !isBusy && !isError && "border-[#FFE600] shadow-[0_0_34px_rgba(255,230,0,0.42),10px_10px_0_#FF3AF2,20px_20px_0_#7B2FFF] hover:-translate-y-1 hover:rotate-[0.35deg] hover:border-[#00F5D4] hover:shadow-[0_0_46px_rgba(0,245,212,0.56),12px_12px_0_#FFE600,24px_24px_0_#FF3AF2]",
          isBusy && "processing-active pointer-events-none border-solid border-[#00F5D4] shadow-[0_0_42px_rgba(0,245,212,0.42),10px_10px_0_#FFE600] before:opacity-100",
          isError && "border-solid border-[#EF4444] shadow-[0_0_34px_rgba(239,68,68,0.38),10px_10px_0_#FF3AF2]",
        )}
      >
        <span className="upload-mesh" aria-hidden="true" />
        <span className="upload-scan-line" aria-hidden="true" />
        {!isBusy ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
            aria-hidden="true"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,230,0,0.28) 0%, transparent 64%)",
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
                className="block h-full rounded-full bg-gradient-to-r from-[#FF3AF2] via-[#FFE600] to-[#00F5D4] transition-[width] duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-widest text-[#00F5D4]">
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
                "upload-icon absolute -bottom-3 flex h-12 w-12 items-center justify-center rounded-[1.25rem] border-4 border-[#0D0D1A] bg-[#FF3AF2] text-white shadow-[5px_5px_0_#FFE600,0_0_28px_rgba(255,58,242,0.62)] transition-all duration-300",
                isDragging && "upload-icon-dragging",
              )}
            >
              <UploadCloud size={23} aria-hidden="true" />
            </div>
          </div>
        )}

        <p className="relative z-10 mt-2 font-heading text-3xl font-black leading-tight text-white sm:text-4xl">
          {isBusy ? (uploadState.message ?? "Turning pages into context...") : "Drop your PDF here"}
        </p>
        <p className="relative z-10 mt-2 min-h-5 text-sm font-bold text-[#DCD7FF]">
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
          {["PDF only", "50MB max", "PDF scoped"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00F5D4] bg-[#2D1B4E]/85 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#FF3AF2]"
            >
              <CheckCircle2 size={12} className="text-[#FFE600]" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 text-center">
          <p className="rounded-[1rem] border-4 border-[#EF4444] bg-[#0D0D1A] px-4 py-3 text-sm font-bold text-[#FCA5A5] shadow-[5px_5px_0_#FF3AF2]">{error}</p>
          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-3 cursor-pointer rounded-[1.25rem] border-4 border-[#FFE600] bg-[#FF3AF2] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white outline-none shadow-[5px_5px_0_#00F5D4] transition hover:-translate-y-1 hover:rotate-1 focus-visible:ring-4 focus-visible:ring-[#FFE600]"
          >
            Try again
          </button>
        </div>
      ) : null}
    </>
  )
})
