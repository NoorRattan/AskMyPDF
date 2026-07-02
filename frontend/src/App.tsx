import gsap from "gsap"
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  CircuitBoard,
  FileText,
  MousePointer2,
  ScanLine,
  TerminalSquare,
  Waves,
} from "lucide-react"
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react"

import { ChatInterface } from "./components/ChatInterface"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header"
import { ModelSelector } from "./components/ModelSelector"
import { ProductionStatusPanel } from "./components/ProductionStatusPanel"
import { UploadZone } from "./components/UploadZone"
import { useChat } from "./hooks/useChat"
import { useSystemStatus } from "./hooks/useSystemStatus"
import { useUpload } from "./hooks/useUpload"
import { accentAt, maxCardAt } from "./lib/designSystem"
import { cn } from "./lib/utils"
import type { ModelPreference } from "./types"

const navLinks = ["Signal", "Artifacts", "Protocol", "Upload"] as const

const valueProps = [
  {
    title: "PDFs become searchable signal",
    descriptor: "AskMyPDF indexes each page into retrievable context before a single answer is written.",
  },
  {
    title: "Ask like the author is online",
    descriptor: "Natural language questions stream through the document, not around it.",
  },
  {
    title: "Every answer keeps receipts",
    descriptor: "Citations, page references, and session boundaries keep the workspace accountable.",
  },
] as const

const shufflerLabels = ["Parse pages", "Embed passages", "Rank context"] as const

const telemetryLines = [
  "question.receive('summarize the risk')",
  "retriever.match(page: 04, confidence: 0.91)",
  "context.lock(session: private)",
  "answer.stream(tokens: cited)",
] as const

const weekDays = [
  { short: "S", label: "Sunday" },
  { short: "M", label: "Monday" },
  { short: "T", label: "Tuesday" },
  { short: "W", label: "Wednesday" },
  { short: "T", label: "Thursday" },
  { short: "F", label: "Friday" },
  { short: "S", label: "Saturday" },
] as const

const protocolSteps = [
  {
    number: "01",
    title: "Ingest the document field",
    description: "A dense PDF enters a private session, then resolves into pages, chunks, and document structure.",
    icon: CircuitBoard,
  },
  {
    number: "02",
    title: "Scan for semantic pressure",
    description: "Retrieval searches the indexed field for the passages that matter to the question in front of you.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Stream a cited response",
    description: "The assistant answers from retrieved context and keeps the visible source trail attached.",
    icon: Waves,
  },
] as const

const floatingShapes = [
  { label: "PDF", className: "left-[3%] top-[14%] h-16 w-16 -rotate-6 animate-[float_6s_ease-in-out_infinite]", color: "#FFE600" },
  { label: "AI", className: "right-[7%] top-[18%] h-20 w-20 rotate-6 animate-[float-reverse_5s_ease-in-out_infinite]", color: "#00F5D4" },
  { label: "ASK", className: "bottom-[12%] left-[8%] h-14 w-24 rotate-3 animate-[wiggle_1.8s_ease-in-out_infinite]", color: "#FF6B35" },
  { label: "GO", className: "bottom-[18%] right-[11%] h-16 w-16 -rotate-3 animate-[float_7s_ease-in-out_infinite]", color: "#FF3AF2" },
] as const

function FloatingShapes() {
  return (
    <>
      {floatingShapes.map((shape) => (
        <span
          key={shape.label}
          className={`floating-shape hidden rounded-[1.5rem] lg:grid ${shape.className}`}
          style={{ color: shape.color }}
          aria-hidden="true"
        >
          {shape.label}
        </span>
      ))}
    </>
  )
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(query.matches)

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches)
    }

    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

function splitWords(text: string) {
  return text.split(" ").map((word, index) => (
    <span key={`${word}-${index}`} className="manifesto-word inline-block">
      {word}
      {index < text.split(" ").length - 1 ? "\u00a0" : ""}
    </span>
  ))
}

function MagneticButton({
  children,
  className = "",
  onClick,
  href,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
}) {
  const content = (
    <>
      <span className="button-slide" aria-hidden="true" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} onClick={onClick} className={`magnetic-button ${className}`}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`magnetic-button ${className}`}>
      {content}
    </button>
  )
}

function FloatingNav({
  onStart,
  navRef,
}: {
  onStart: () => void
  navRef: RefObject<HTMLElement | null>
}) {
  return (
    <nav
      ref={navRef}
      className="landing-nav fixed left-1/2 top-4 z-50 flex w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full px-3 py-2 text-ghost sm:top-6 sm:w-[min(92vw,980px)] sm:px-4"
      aria-label="Landing navigation"
    >
      <a href="#top" className="max-focus flex min-w-0 items-center gap-3 rounded-full">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-[#FFE600] bg-[#0D0D1A] text-[#00F5D4] shadow-[0_0_22px_rgba(0,245,212,0.65),4px_4px_0_#FF6B35]">
          <FileText size={17} aria-hidden="true" />
        </span>
        <span className="truncate font-display text-sm tracking-normal sm:text-base">AskMyPDF</span>
      </a>

      <div className="hidden items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <a
            key={link}
            href={link === "Upload" ? "#upload" : `#${link.toLowerCase()}`}
            className="max-focus rounded-full px-3 py-2 text-sm font-black uppercase tracking-widest transition hover:-translate-y-1 hover:rotate-1 hover:bg-[#FFE600] hover:text-[#0D0D1A]"
          >
            {link}
          </a>
        ))}
      </div>

      <MagneticButton onClick={onStart} className="max-button px-4 py-2 text-xs font-black uppercase tracking-widest sm:px-5 sm:text-sm">
        Upload <ArrowDown size={15} aria-hidden="true" />
      </MagneticButton>
    </nav>
  )
}

function DiagnosticShuffler() {
  const [order, setOrder] = useState([0, 1, 2])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOrder((current) => {
        const next = [...current]
        const last = next.pop()

        if (last !== undefined) {
          next.unshift(last)
        }

        return next
      })
    }, 3000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="pattern-checker relative h-52 overflow-hidden rounded-[2rem] border-4 border-[#00F5D4] bg-[#0D0D1A] p-4 shadow-[0_0_26px_rgba(0,245,212,0.46),8px_8px_0_#FF6B35]">
      {order.map((labelIndex, stackIndex) => (
        <div
          key={shufflerLabels[labelIndex]}
          className="absolute left-4 right-4 rounded-[1.5rem] border-4 border-dashed border-[#FFE600] bg-[#2D1B4E]/95 p-4 shadow-[6px_6px_0_#FF3AF2] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            top: 18 + stackIndex * 44,
            zIndex: 10 - stackIndex,
            transform: `scale(${1 - stackIndex * 0.055}) rotate(${stackIndex % 2 === 0 ? -1.2 : 1.2}deg)`,
            opacity: 1 - stackIndex * 0.18,
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/70">diagnostic layer {labelIndex + 1}</span>
            <CheckCircle2 size={15} className="text-[#00F5D4]" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold text-ghost">{shufflerLabels[labelIndex]}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-[#00F5D4] bg-white/8">
            <span className="block h-full w-4/5 rounded-full bg-gradient-to-r from-[#FF3AF2] via-[#FFE600] to-[#00F5D4]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TelemetryTypewriter() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const line = telemetryLines[messageIndex]

  useEffect(() => {
    const typing = window.setInterval(() => {
      setVisibleChars((count) => {
        if (count < line.length) {
          return count + 1
        }

        window.clearInterval(typing)
        window.setTimeout(() => {
          setVisibleChars(0)
          setMessageIndex((index) => (index + 1) % telemetryLines.length)
        }, 900)

        return count
      })
    }, 34)

    return () => window.clearInterval(typing)
  }, [line])

  return (
    <div className="pattern-dots rounded-[2rem] border-4 border-[#FF3AF2] bg-[#0D0D1A] p-4 shadow-[0_0_26px_rgba(255,58,242,0.46),8px_8px_0_#FFE600]">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/70">
          <span className="h-3 w-3 rounded-full bg-[#00F5D4] shadow-[0_0_18px_rgba(0,245,212,0.85)] animate-pulse" />
          Live Feed
        </span>
        <TerminalSquare size={16} className="text-[#FFE600]" aria-hidden="true" />
      </div>
      <div className="min-h-40 rounded-[1.5rem] border-4 border-dashed border-[#00F5D4] bg-black/50 p-4 font-mono text-sm leading-7 text-white">
        <p className="text-white/48">askmypdf.kernel</p>
        <p className="mt-3">
          <span className="text-[#FFE600]">$</span> {line.slice(0, visibleChars)}
          <span className="ml-1 inline-block h-5 w-2 translate-y-1 bg-[#FF3AF2] animate-pulse" aria-hidden="true" />
        </p>
      </div>
    </div>
  )
}

function SchedulerArtifact() {
  const schedulerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const dayRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [activeDay, setActiveDay] = useState(2)

  useEffect(() => {
    const root = schedulerRef.current
    const cursor = cursorRef.current

    if (!root || !cursor || dayRefs.current.some((day) => !day)) {
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, defaults: { ease: "power2.inOut" } })
      const rootBounds = root.getBoundingClientRect()

      dayRefs.current.forEach((day, index) => {
        if (!day) {
          return
        }

        const bounds = day.getBoundingClientRect()
        const x = bounds.left - rootBounds.left + bounds.width * 0.55
        const y = bounds.top - rootBounds.top + bounds.height * 0.48

        tl.to(cursor, { autoAlpha: 1, x, y, duration: 0.72 })
          .call(() => setActiveDay(index))
          .to(day, { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1 }, "<")
          .to(cursor, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1 }, "<")
      })

      tl.to(cursor, { x: rootBounds.width - 78, y: rootBounds.height - 34, duration: 0.72 })
        .to(".scheduler-save", { scale: 0.96, duration: 0.12, yoyo: true, repeat: 1 }, "<")
        .to(cursor, { autoAlpha: 0, duration: 0.26 })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={schedulerRef} className="pattern-stripes relative overflow-hidden rounded-[2rem] border-4 border-[#FFE600] bg-[#0D0D1A] p-4 shadow-[0_0_26px_rgba(255,230,0,0.42),8px_8px_0_#00F5D4]">
      <div ref={cursorRef} className="pointer-events-none absolute left-0 top-0 z-20 text-[#00F5D4] opacity-0 drop-shadow-[0_0_10px_rgba(0,245,212,0.9)]">
        <MousePointer2 size={24} fill="currentColor" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-white/70">citation protocol</span>
        <CalendarDays size={16} className="text-[#FF3AF2]" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => (
          <button
            key={day.label}
            ref={(node) => {
              dayRefs.current[index] = node
            }}
            type="button"
            aria-label={day.label}
            onClick={() => setActiveDay(index)}
            className={`aspect-square rounded-[1rem] border font-mono text-xs transition ${
              activeDay === index
                ? "border-[#FFE600] bg-[#FFE600] text-[#0D0D1A] shadow-[0_0_28px_rgba(255,230,0,0.58)]"
                : "border-[#FF3AF2]/45 bg-white/[0.06] text-white/70"
            }`}
          >
            {day.short}
          </button>
        ))}
      </div>
      <span className="scheduler-save mt-4 block w-full rounded-full border-4 border-[#FF3AF2] bg-[#00F5D4] px-4 py-3 text-center text-sm font-black uppercase text-[#0D0D1A] shadow-[5px_5px_0_#FFE600]">
        Saved citation trail
      </span>
    </div>
  )
}

function FeatureArtifacts() {
  const artifacts = [<DiagnosticShuffler key="diagnostic" />, <TelemetryTypewriter key="telemetry" />, <SchedulerArtifact key="scheduler" />] as const

  return (
    <section id="artifacts" className="pattern-mesh relative overflow-hidden bg-[#0D0D1A] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[#0D0D1A]/78" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00F5D4]">Interactive artifacts</p>
            <h2 className="max-subtitle mt-4 max-w-3xl text-4xl leading-none sm:text-6xl">Document intelligence with visible motion.</h2>
          </div>
          <p className="max-w-2xl rounded-[1.5rem] border-4 border-[#FFE600] bg-[#2D1B4E]/86 p-5 text-base font-semibold leading-8 text-white shadow-[6px_6px_0_#FF3AF2]">
            Each surface translates a real AskMyPDF behavior into a software instrument: indexing, retrieval, and citation control.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {valueProps.map((item, index) => (
            <article
              key={item.title}
              className={cn("artifact-card rounded-[2rem] bg-[#0D0D1A]/94 p-4 text-white transition duration-300 hover:-translate-y-2 hover:rotate-1", maxCardAt(index))}
            >
              {artifacts[index]}
              <span
                className="mt-6 inline-flex rounded-full border-4 border-white bg-[#0D0D1A] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-[#0D0D1A]"
                style={{ backgroundColor: accentAt(index) }}
              >
                Signal {index + 1}
              </span>
              <h3 className="mt-4 font-heading text-2xl font-black leading-tight">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/76">{item.descriptor}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProtocolVisual({ index, accent }: { index: number; accent: string }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 240 240" className="protocol-motif h-52 w-52" style={{ color: accent }} aria-hidden="true">
        <defs>
          <filter id="protocol-glow-1" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="protocol-spin-slow" filter="url(#protocol-glow-1)">
          <animateTransform attributeName="transform" type="rotate" from="0 120 120" to="360 120 120" dur="8s" repeatCount="indefinite" />
          <circle cx="120" cy="120" r="76" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.34" strokeDasharray="22 10" />
          <path d="M72 74c44 18 52 74 96 92M168 74c-44 18-52 74-96 92" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className="protocol-spin-reverse" opacity="0.82">
          <animateTransform attributeName="transform" type="rotate" from="360 120 120" to="0 120 120" dur="5.5s" repeatCount="indefinite" />
          <circle cx="120" cy="120" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="14 8" />
          {[62, 88, 114, 140, 166].map((y) => (
            <line key={y} x1="82" x2="158" y1={y} y2={y} stroke="currentColor" strokeWidth="2.5" opacity="0.58" />
          ))}
        </g>
        <circle className="protocol-pulse-dot" cx="120" cy="120" r="8" fill="currentColor">
          <animate attributeName="r" values="5;11;5" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;1;0.55" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    )
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 240 240" className="protocol-scanner h-52 w-52 rounded-[2rem]" style={{ color: accent }} aria-hidden="true">
        <rect x="10" y="10" width="220" height="220" rx="34" fill="rgba(255,255,255,0.05)" stroke="currentColor" strokeWidth="5" />
        {Array.from({ length: 36 }, (_, cell) => {
          const col = cell % 6
          const row = Math.floor(cell / 6)
          const delay = (cell % 6) * 0.08 + row * 0.04

          return (
            <circle key={cell} cx={48 + col * 29} cy={48 + row * 29} r="6" fill="white" opacity="0.18">
              <animate attributeName="opacity" values="0.12;0.62;0.12" dur="1.8s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          )
        })}
        <line x1="18" x2="222" y1="44" y2="44" stroke="#FFE600" strokeWidth="5" strokeLinecap="round" className="scan-laser-svg">
          <animate attributeName="y1" values="42;198;42" dur="2.15s" repeatCount="indefinite" />
          <animate attributeName="y2" values="42;198;42" dur="2.15s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.82;1" dur="2.15s" repeatCount="indefinite" />
        </line>
        <rect x="32" y="32" width="176" height="176" rx="22" fill="none" stroke="#FF6B35" strokeWidth="3" strokeDasharray="16 10">
          <animate attributeName="stroke-dashoffset" values="0;-52" dur="1.6s" repeatCount="indefinite" />
        </rect>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 260 160" className="h-52 w-60" style={{ color: accent }} aria-hidden="true">
      <defs>
        <filter id="protocol-glow-3" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M5 82h36l10-32 18 74 18-106 20 64h38l16-38 18 74 18-55 13 19h45"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="11"
        opacity="0.18"
      />
      <path
        className="waveform-path"
        d="M5 82h36l10-32 18 74 18-106 20 64h38l16-38 18 74 18-55 13 19h45"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
        filter="url(#protocol-glow-3)"
        pathLength="520"
      >
        <animate attributeName="stroke-dashoffset" values="520;0;-520" dur="2.35s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;1;1;0.35" keyTimes="0;0.25;0.7;1" dur="2.35s" repeatCount="indefinite" />
      </path>
      <circle r="5.5" fill="#FFE600" filter="url(#protocol-glow-3)">
        <animateMotion
          dur="2.35s"
          repeatCount="indefinite"
          path="M5 82h36l10-32 18 74 18-106 20 64h38l16-38 18 74 18-55 13 19h45"
        />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.82;1" dur="2.35s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function Landing({
  uploadState,
  uploadFile,
  reset,
  systemStatus,
  selectedModel,
  onModelChange,
}: {
  uploadState: ReturnType<typeof useUpload>["state"]
  uploadFile: ReturnType<typeof useUpload>["uploadFile"]
  reset: ReturnType<typeof useUpload>["reset"]
  systemStatus: ReturnType<typeof useSystemStatus>
  selectedModel: ModelPreference
  onModelChange: (model: ModelPreference) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const uploadRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    function handleScroll() {
      navRef.current?.classList.toggle("landing-nav-scrolled", window.scrollY > window.innerHeight * 0.7)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const root = rootRef.current

    if (!root || prefersReducedMotion) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: "power3.out",
      })
    }, root)

    return () => ctx.revert()
  }, [prefersReducedMotion])

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div ref={rootRef} id="top" className="dopamine-shell relative min-h-screen overflow-hidden text-white">
      <FloatingShapes />
      <FloatingNav onStart={scrollToUpload} navRef={navRef} />

      <section
        id="upload"
        ref={uploadRef}
        className="relative min-h-[100dvh] overflow-hidden px-4 pb-14 pt-28 text-white sm:px-8 lg:px-12"
      >
        <div className="absolute inset-0 pattern-mesh opacity-95" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,58,242,0.12)_2px,transparent_2px),linear-gradient(0deg,rgba(0,245,212,0.09)_2px,transparent_2px)] bg-[size:76px_76px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[#0D0D1A]/56" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="hero-reveal min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border-4 border-[#00F5D4] bg-[#0D0D1A] px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[6px_6px_0_#FF3AF2]">
              <TerminalSquare size={14} aria-hidden="true" />
              AskMyPDF workspace
            </p>
            <h1 className="max-title mt-6 max-w-3xl text-[clamp(3rem,7.2vw,6.8rem)] leading-[0.86]">
              Choose model.
              <span className="block max-gradient-text">Drop PDF.</span>
              Ask fast.
            </h1>
            <p className="mt-7 max-w-2xl rounded-[1.5rem] border-4 border-[#FFE600] bg-[#2D1B4E]/88 p-5 text-base font-bold leading-7 text-white shadow-[6px_6px_0_#00F5D4] sm:text-lg">
              The document flow starts here. Pick the answer route before uploading, then AskMyPDF indexes the PDF and opens the chat workspace with citations attached.
            </p>

            <div className="max-card max-card-cyan mt-7 rounded-[2rem] p-4 text-white">
              <ModelSelector
                compact
                value={selectedModel}
                onChange={onModelChange}
                models={systemStatus.details?.available_models}
                disabled={uploadState.status === "uploading" || uploadState.status === "processing"}
              />
            </div>

          </div>

          <div className="hero-reveal relative min-w-0">
            <div className="absolute -inset-5 rounded-[3rem] bg-[linear-gradient(135deg,rgba(255,58,242,0.28),rgba(255,230,0,0.22),rgba(0,245,212,0.24))] blur-2xl" aria-hidden="true" />
            <div className="relative">
              <UploadZone uploadState={uploadState} onUpload={uploadFile} onReset={reset} />
            </div>
          </div>

          <div className="hero-reveal grid gap-4 lg:col-span-2 lg:grid-cols-[0.84fr_1.16fr]">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {["No external AI option", "Online model routes", "Cited answer stream"].map((item, index) => (
                <p
                  key={item}
                  className="flex min-h-12 items-center gap-2 rounded-[1.25rem] border-4 bg-[#0D0D1A]/86 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[5px_5px_0_rgba(255,255,255,0.16)]"
                  style={{ borderColor: accentAt(index), color: index === 2 ? "#FFE600" : "#FFFFFF" }}
                >
                  <CheckCircle2 size={16} className="shrink-0" style={{ color: accentAt(index + 1) }} aria-hidden="true" />
                  <span>{item}</span>
                </p>
              ))}
            </div>

            <ProductionStatusPanel {...systemStatus} />
          </div>
        </div>
      </section>

      <FeatureArtifacts />

      <section id="signal" className="relative overflow-hidden bg-[#FFE600] px-4 py-28 text-[#0D0D1A] sm:px-8 lg:px-12">
        <div className="absolute inset-0 pattern-dots opacity-40" aria-hidden="true" />
        <div className="absolute -right-20 top-10 h-52 w-52 rotate-12 border-4 border-[#0D0D1A] bg-[#FF3AF2] shadow-[12px_12px_0_#00F5D4]" aria-hidden="true" />
        <div className="absolute -left-16 bottom-12 h-44 w-64 -rotate-6 border-4 border-[#0D0D1A] bg-[#7B2FFF] shadow-[12px_12px_0_#FF6B35]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-8 inline-flex rounded-full border-4 border-[#0D0D1A] bg-white px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.28em] shadow-[6px_6px_0_#FF3AF2]">The signal</p>
          <p className="max-w-5xl font-heading text-3xl font-black leading-tight text-[#0D0D1A]/70 sm:text-5xl">
            Most document AI focuses on: quick summaries and vague chat bubbles.
          </p>
          <p className="mt-10 max-w-6xl font-heading text-5xl font-black leading-[0.92] text-[#0D0D1A] sm:text-7xl lg:text-8xl">
            {splitWords("We focus on: cited conversation that stays locked to your PDF.")}
          </p>
        </div>
      </section>

      <section id="protocol" className="relative overflow-hidden bg-[#0D0D1A] px-4 py-24 text-white sm:px-8 lg:px-12">
        <div className="absolute inset-0 pattern-mesh opacity-80" aria-hidden="true" />
        <div className="absolute inset-0 bg-[#0D0D1A]/74" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#00F5D4]">Workflow</p>
              <h2 className="max-subtitle mt-4 max-w-4xl text-4xl leading-none sm:text-6xl">Upload to answer stays visible.</h2>
            </div>
            <p className="max-w-2xl rounded-[1.5rem] border-4 border-[#FF6B35] bg-[#2D1B4E]/86 p-5 text-base font-semibold leading-8 text-white shadow-[6px_6px_0_#00F5D4]">
              Every stage stays visible as the PDF moves from ingestion to retrieval to a cited response, with the source trail carried through the whole workflow.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {protocolSteps.map((step, index) => {
              const Icon = step.icon
              const accent = accentAt(index + 2)

              return (
                <article
                  key={step.number}
                  className={cn(
                    "protocol-card relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#0D0D1A]/94 p-6 text-white backdrop-blur-xl transition duration-300 hover:-translate-y-2",
                    index === 1 && "lg:translate-y-10",
                    index === 2 && "lg:-translate-y-4",
                    maxCardAt(index + 2),
                  )}
                >
                  <div className="absolute inset-0 pattern-checker opacity-35" aria-hidden="true" />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,58,242,0.1))]" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <p className="rounded-full border-4 border-white bg-[#0D0D1A] px-3 py-1 font-mono text-sm font-black" style={{ color: accent }}>
                        STEP {step.number}
                      </p>
                      <span
                        className="grid h-12 w-12 place-items-center rounded-[1.25rem] border-4 bg-[#0D0D1A] shadow-[5px_5px_0_rgba(255,255,255,0.2)]"
                        style={{ borderColor: accent, color: accent }}
                      >
                        <Icon size={22} aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 font-heading text-3xl font-black leading-none sm:text-4xl">{step.title}</h3>
                    <p className="mt-5 text-sm font-semibold leading-7 text-white/72">{step.description}</p>
                  </div>
                  <div className="relative z-10 mt-8 grid place-items-center">
                    <ProtocolVisual index={index} accent={accent} />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="pattern-stripes rounded-t-[3rem] border-t-4 border-[#FFE600] bg-[#0D0D1A] px-4 py-12 text-white shadow-[0_-18px_0_#7B2FFF] sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
        <div>
          <p className="font-display text-2xl">AskMyPDF</p>
          <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/68">Conversational PDF intelligence for documents that deserve precise answers.</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00F5D4]">Navigate</p>
          <div className="mt-4 grid gap-2 text-sm font-bold text-white/74">
            <a href="#signal" className="rounded transition hover:-translate-y-px hover:text-[#FFE600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE600]">Signal</a>
            <a href="#artifacts" className="rounded transition hover:-translate-y-px hover:text-[#FFE600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE600]">Artifacts</a>
            <a href="#protocol" className="rounded transition hover:-translate-y-px hover:text-[#FFE600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE600]">Protocol</a>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF3AF2]">Legal</p>
          <div className="mt-4 grid gap-2 text-sm font-bold text-white/74">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
        <div className="self-start rounded-[2rem] border-4 border-[#00F5D4] bg-[#2D1B4E] p-5 shadow-[6px_6px_0_#FF3AF2]">
          <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-white">
            <span className="h-3 w-3 rounded-full bg-[#00F5D4] shadow-[0_0_18px_rgba(0,245,212,0.9)] animate-pulse" />
            System Operational
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const { state: uploadState, uploadFile, reset } = useUpload()
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(uploadState.sessionId)
  const systemStatus = useSystemStatus()
  const [selectedModel, setSelectedModel] = useState<ModelPreference>("offline")
  const isChat = uploadState.status === "ready"

  useEffect(() => {
    const models = systemStatus.details?.available_models
    if (!models?.length) {
      return
    }

    const active = models.find((model) => model.id === selectedModel)
    if (active && !active.available) {
      setSelectedModel("offline")
    }
  }, [selectedModel, systemStatus.details?.available_models])

  function handleReset() {
    reset()
    clearChat()
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0D0D1A] text-white">
        {isChat ? <Header uploadState={uploadState} onReset={handleReset} /> : null}

        <main>
          {!isChat ? (
            <Landing
              uploadState={uploadState}
              uploadFile={uploadFile}
              reset={reset}
              systemStatus={systemStatus}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          ) : (
            <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
              <ChatInterface
                uploadState={uploadState}
                messages={messages}
                isLoading={isLoading}
                error={error}
                modelPreference={selectedModel}
                onModelPreferenceChange={setSelectedModel}
                availableModels={systemStatus.details?.available_models}
                onSend={sendMessage}
              />
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
