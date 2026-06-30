import { motion, useReducedMotion } from "framer-motion"
import { FileText, Upload } from "lucide-react"
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
  const shouldReduce = useReducedMotion()
  const isBusy = uploadState.status === "uploading" || uploadState.status === "processing"
  const isError = uploadState.status === "error" || Boolean(clientError)
  const error = clientError ?? uploadState.error ?? fallbackError

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
      <motion.div
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
        animate={
          shouldReduce || isBusy
            ? undefined
            : {
                borderColor: isDragging ? "#7C3AED" : isError ? "#EF4444" : "#2A2B45",
                boxShadow: isDragging ? "0 0 0 4px #7C3AED33, inset 0 0 40px #7C3AED22" : "0 0 0 0px transparent",
                scale: isDragging ? 1.012 : 1,
              }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        whileHover={shouldReduce ? undefined : { borderColor: "#7C3AED", scale: 1.004 }}
        style={isBusy ? { animation: "border-pulse 2s ease-in-out infinite" } : undefined}
        className={cn(
          "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-surface/92 p-8 text-center transition sm:min-h-72 sm:p-12",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(124,58,237,0.14),transparent_34%,rgba(16,185,129,0.08))] before:opacity-0 before:transition-opacity",
          "after:absolute after:inset-px after:rounded-[15px] after:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]",
          isDragging && "border-solid border-primary bg-primary/5 shadow-[0_0_0_4px_#7C3AED22,0_28px_80px_#7C3AED24] before:opacity-100",
          !isDragging && !isBusy && !isError && "border-dashed border-border hover:border-primary/60 hover:shadow-[0_26px_70px_#00000045]",
          isBusy && "processing-active pointer-events-none border-solid border-primary shadow-[0_0_42px_#7C3AED24] before:opacity-100",
          isError && "border-solid border-error",
        )}
      >
        {!isBusy ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            aria-hidden="true"
            style={{
              background: "radial-gradient(ellipse at center, #7C3AED22 0%, transparent 70%)",
              animation: shouldReduce ? undefined : "glow-pulse 3s ease-in-out infinite",
            }}
          />
        ) : null}
        <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} className="sr-only" />

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
              <span className="processing-progress block h-full rounded-full" />
            </div>
          </div>
        ) : (
          <motion.div
            className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-raised"
            animate={
              shouldReduce
                ? undefined
                : isDragging
                  ? { y: [-4, -8, -4], scale: [1.08, 1.18, 1.08] }
                  : { y: 0, scale: 1 }
            }
            transition={
              isDragging
                ? { repeat: Infinity, duration: 0.9, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 20 }
            }
            whileHover={
              shouldReduce
                ? undefined
                : {
                    y: -4,
                    scale: 1.08,
                    boxShadow: "0 8px 24px #7C3AED55",
                    background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.08))",
                  }
            }
          >
            <Upload size={28} className="text-primary" aria-hidden="true" />
          </motion.div>
        )}

        <p className="relative z-10 text-lg font-semibold text-text">
          {isBusy ? "Turning pages into context..." : "Drop your PDF here"}
        </p>
        {!isBusy ? <p className="relative z-10 mt-1 text-sm text-secondary">or click to browse</p> : null}
        <p className="relative z-10 mt-4 font-mono text-xs text-secondary">PDF / up to 50MB / private session</p>
      </motion.div>

      {isError ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-error">{error}</p>
          <motion.button
            type="button"
            onClick={handleTryAgain}
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
            className="mt-3 cursor-pointer rounded-xl border border-border bg-surface-raised px-5 py-2.5 text-sm font-medium text-primary-light outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            Try again
          </motion.button>
        </div>
      ) : null}
    </>
  )
}
