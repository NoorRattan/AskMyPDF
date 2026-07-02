import { motion, useReducedMotion } from "framer-motion"
import { FileSearch } from "lucide-react"

import type { UploadState } from "../types"

interface HeaderProps {
  uploadState: UploadState
  onReset: () => void
  onHome?: () => void
  onStart?: () => void
}

export function Header({ uploadState, onReset, onHome, onStart }: HeaderProps) {
  const isReady = uploadState.status === "ready"
  const shouldReduce = useReducedMotion()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between overflow-hidden border-b-4 border-[#FFE600] bg-[#0D0D1A]/92 px-5 shadow-[0_0_34px_rgba(255,58,242,0.28),0_8px_0_#7B2FFF] backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onHome ?? onStart}
        className="max-focus flex min-w-0 items-center gap-3 rounded-xl text-left"
        aria-label="Return to AskMyPDF home"
      >
        <div
          className="brand-glyph grid h-10 w-10 shrink-0 place-items-center rounded-xl border-4 border-[#FFE600]"
          style={{
            background: "linear-gradient(135deg, #FF3AF2, #7B2FFF, #00F5D4)",
            boxShadow: "0 0 22px rgba(255,58,242,0.58), 4px 4px 0 #00F5D4",
            animation: shouldReduce ? undefined : "icon-breathe 2.5s ease-in-out infinite",
          }}
          aria-hidden="true"
        >
          <FileSearch size={17} className="text-white" aria-hidden="true" />
          <span className="brand-glyph-pulse" aria-hidden="true" />
        </div>
        <span className="truncate font-display text-xl tracking-normal text-white">AskMyPDF</span>
      </button>

      {isReady ? (
        <div className="flex min-w-0 items-center gap-3">
          <span
            title={uploadState.filename ?? undefined}
            className="flex max-w-[136px] items-center gap-2 rounded-xl border-2 border-[#00F5D4] bg-[#2D1B4E]/95 px-3 py-2 text-sm font-bold text-white shadow-[4px_4px_0_#FF3AF2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFE600] sm:max-w-[260px]"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#00F5D4]"
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
                    borderColor: "#FFE600",
                    boxShadow: "5px 5px 0 #00F5D4, 0 0 24px rgba(255,230,0,0.34)",
                  }
            }
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="shrink-0 rounded-xl border-2 border-white/14 bg-[#0D0D1A] px-3 py-2 text-sm font-black uppercase tracking-wide text-[#FFE600] outline-none transition-colors duration-150 hover:text-white focus-visible:ring-4 focus-visible:ring-[#FFE600]"
          >
            Upload new PDF
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-5 text-sm text-secondary md:flex" aria-label="Landing sections">
            <a
              className="rounded font-bold transition hover:text-[#FFE600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE600]"
              href="#signal"
            >
              Signal
            </a>
            <a
              className="rounded font-bold transition hover:text-[#FFE600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE600]"
              href="#protocol"
            >
              Protocol
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
                        borderColor: "#FFE600",
                        boxShadow: "5px 5px 0 #00F5D4",
                      }
                }
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="cursor-pointer rounded-xl border-4 border-[#FFE600] bg-[#FF3AF2] px-4 py-2 text-sm font-black uppercase tracking-wide text-white outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#FFE600]"
          >
            Start
          </motion.button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px overflow-hidden" aria-hidden="true">
        <div
          className="h-full w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, #FF3AF2, #FFE600, #00F5D4, transparent)",
            animation: shouldReduce ? undefined : "shimmer-x 3.5s ease-in-out infinite",
          }}
        />
      </div>
    </header>
  )
}
