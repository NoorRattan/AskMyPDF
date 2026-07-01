import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  FileText,
  MousePointer2,
  ScanLine,
  TerminalSquare,
  UploadCloud,
  Waves,
  Zap,
} from "lucide-react"
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react"

import { ChatInterface } from "./components/ChatInterface"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header"
import { ProductionStatusPanel } from "./components/ProductionStatusPanel"
import { UploadZone } from "./components/UploadZone"
import { useChat } from "./hooks/useChat"
import { useSystemStatus } from "./hooks/useSystemStatus"
import { useUpload } from "./hooks/useUpload"

gsap.registerPlugin(ScrollTrigger)

const heroImage =
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=2400&q=88"
const textureImage =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1800&q=80"
const protocolImage =
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1800&q=82"

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
      className="landing-nav fixed left-1/2 top-4 z-50 flex w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-[2rem] border border-white/10 px-3 py-2 text-ghost sm:top-6 sm:w-[min(92vw,980px)] sm:px-4"
      aria-label="Landing navigation"
    >
      <a href="#top" className="flex min-w-0 items-center gap-3 rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plasma">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[1.25rem] bg-plasma text-white shadow-[0_0_32px_rgba(123,97,255,0.45)]">
          <FileText size={17} aria-hidden="true" />
        </span>
        <span className="truncate text-sm font-extrabold tracking-normal sm:text-base">AskMyPDF</span>
      </a>

      <div className="hidden items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <a
            key={link}
            href={link === "Upload" ? "#upload" : `#${link.toLowerCase()}`}
            className="rounded-[1.25rem] px-3 py-2 text-sm font-medium transition hover:-translate-y-px hover:text-plasma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plasma"
          >
            {link}
          </a>
        ))}
      </div>

      <MagneticButton onClick={onStart} className="bg-plasma px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(123,97,255,0.32)]">
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
    <div className="relative h-52 overflow-hidden rounded-[2rem] border border-ghost/10 bg-deep-void p-4">
      {order.map((labelIndex, stackIndex) => (
        <div
          key={shufflerLabels[labelIndex]}
          className="absolute left-4 right-4 rounded-[1.5rem] border border-plasma/25 bg-graphite/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            top: 18 + stackIndex * 44,
            zIndex: 10 - stackIndex,
            transform: `scale(${1 - stackIndex * 0.055}) rotate(${stackIndex % 2 === 0 ? -1.2 : 1.2}deg)`,
            opacity: 1 - stackIndex * 0.18,
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase text-ghost/55">diagnostic layer {labelIndex + 1}</span>
            <CheckCircle2 size={15} className="text-plasma" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold text-ghost">{shufflerLabels[labelIndex]}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <span className="block h-full w-4/5 rounded-full bg-gradient-to-r from-plasma to-cyan-300" />
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
    <div className="rounded-[2rem] border border-ghost/10 bg-deep-void p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-xs uppercase text-ghost/60">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)] animate-pulse" />
          Live Feed
        </span>
        <TerminalSquare size={16} className="text-plasma" aria-hidden="true" />
      </div>
      <div className="min-h-40 rounded-[1.5rem] border border-white/8 bg-black/35 p-4 font-mono text-sm leading-7 text-cyan-100">
        <p className="text-ghost/40">askmypdf.kernel</p>
        <p className="mt-3">
          <span className="text-plasma">$</span> {line.slice(0, visibleChars)}
          <span className="ml-1 inline-block h-5 w-2 translate-y-1 bg-plasma animate-pulse" aria-hidden="true" />
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
    <div ref={schedulerRef} className="relative overflow-hidden rounded-[2rem] border border-ghost/10 bg-deep-void p-4">
      <div ref={cursorRef} className="pointer-events-none absolute left-0 top-0 z-20 text-cyan-200 opacity-0 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]">
        <MousePointer2 size={24} fill="currentColor" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs uppercase text-ghost/60">citation protocol</span>
        <CalendarDays size={16} className="text-plasma" aria-hidden="true" />
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
                ? "border-plasma bg-plasma text-white shadow-[0_0_28px_rgba(123,97,255,0.38)]"
                : "border-white/10 bg-white/[0.04] text-ghost/60"
            }`}
          >
            {day.short}
          </button>
        ))}
      </div>
      <button type="button" className="scheduler-save mt-4 w-full rounded-[1.25rem] bg-ghost px-4 py-3 text-sm font-bold text-deep-void">
        Save cited answer
      </button>
    </div>
  )
}

function FeatureArtifacts() {
  return (
    <section id="artifacts" className="relative bg-ghost px-4 py-24 text-deep-void sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase text-plasma">Interactive functional artifacts</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-extrabold leading-none sm:text-6xl">Document intelligence you can feel working.</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-graphite/70">
            Each surface translates a real AskMyPDF behavior into a software instrument: indexing, retrieval, and citation control.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <article className="artifact-card rounded-[2rem] border border-deep-void/10 bg-white p-4 shadow-[0_26px_90px_rgba(10,10,20,0.12)]">
            <DiagnosticShuffler />
            <h3 className="mt-5 text-2xl font-bold">{valueProps[0].title}</h3>
            <p className="mt-3 text-sm leading-6 text-graphite/65">{valueProps[0].descriptor}</p>
          </article>
          <article className="artifact-card rounded-[2rem] border border-deep-void/10 bg-white p-4 shadow-[0_26px_90px_rgba(10,10,20,0.12)]">
            <TelemetryTypewriter />
            <h3 className="mt-5 text-2xl font-bold">{valueProps[1].title}</h3>
            <p className="mt-3 text-sm leading-6 text-graphite/65">{valueProps[1].descriptor}</p>
          </article>
          <article className="artifact-card rounded-[2rem] border border-deep-void/10 bg-white p-4 shadow-[0_26px_90px_rgba(10,10,20,0.12)]">
            <SchedulerArtifact />
            <h3 className="mt-5 text-2xl font-bold">{valueProps[2].title}</h3>
            <p className="mt-3 text-sm leading-6 text-graphite/65">{valueProps[2].descriptor}</p>
          </article>
        </div>
      </div>
    </section>
  )
}

function ProtocolVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 240 240" className="protocol-motif h-52 w-52 text-plasma" aria-hidden="true">
        <circle cx="120" cy="120" r="76" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.28" />
        <circle cx="120" cy="120" r="44" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.58" />
        <path d="M72 74c44 18 52 74 96 92M168 74c-44 18-52 74-96 92" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        {[62, 88, 114, 140, 166].map((y) => (
          <line key={y} x1="82" x2="158" y1={y} y2={y} stroke="currentColor" strokeWidth="2" opacity="0.45" />
        ))}
      </svg>
    )
  }

  if (index === 1) {
    return (
      <div className="relative grid h-52 w-52 grid-cols-6 gap-2 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-white/[0.03] p-5" aria-hidden="true">
        <span className="scan-laser absolute left-0 right-0 top-6 h-px bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
        {Array.from({ length: 36 }, (_, cell) => (
          <span key={cell} className="rounded-full bg-ghost/15" />
        ))}
      </div>
    )
  }

  return (
    <svg viewBox="0 0 260 160" className="h-52 w-60 text-cyan-200" aria-hidden="true">
      <path
        className="waveform-path"
        d="M5 82h36l10-32 18 74 18-106 20 64h38l16-38 18 74 18-55 13 19h45"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  )
}

function Landing({
  uploadState,
  uploadFile,
  reset,
  systemStatus,
}: {
  uploadState: ReturnType<typeof useUpload>["state"]
  uploadFile: ReturnType<typeof useUpload>["uploadFile"]
  reset: ReturnType<typeof useUpload>["reset"]
  systemStatus: ReturnType<typeof useSystemStatus>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)
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

      gsap.from(".artifact-card", {
        scrollTrigger: {
          trigger: "#artifacts",
          start: "top 68%",
        },
        y: 44,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
      })

      gsap.from(".manifesto-word", {
        scrollTrigger: {
          trigger: "#signal",
          start: "top 65%",
        },
        y: 28,
        opacity: 0,
        duration: 0.68,
        stagger: 0.04,
        ease: "power3.out",
      })

      const cards = gsap.utils.toArray<HTMLElement>(".protocol-card")
      gsap.set(cards, { yPercent: (index) => (index === 0 ? 0 : 110), opacity: (index) => (index === 0 ? 1 : 0) })
      gsap.set(cards[0], { filter: "blur(0px)", scale: 1 })

      const protocolTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".protocol-stage",
          start: "top top",
          end: "+=2200",
          scrub: 0.85,
          pin: true,
        },
        defaults: { ease: "power2.inOut" },
      })

      protocolTimeline
        .to(cards[0], { scale: 0.9, filter: "blur(20px)", opacity: 0.5, duration: 1 })
        .to(cards[1], { yPercent: 0, opacity: 1, duration: 1 }, "<")
        .to(cards[1], { scale: 0.9, filter: "blur(20px)", opacity: 0.5, duration: 1 })
        .to(cards[2], { yPercent: 0, opacity: 1, duration: 1 }, "<")

    }, root)

    return () => ctx.revert()
  }, [prefersReducedMotion])

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div ref={rootRef} id="top" className="relative min-h-screen overflow-hidden bg-deep-void text-ghost">
      <FloatingNav onStart={scrollToUpload} navRef={navRef} />

      <section className="hero-section relative flex min-h-[100dvh] items-end overflow-hidden px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-void via-deep-void/78 to-deep-void/30" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(123,97,255,0.45),transparent_34%),radial-gradient(circle_at_78%_28%,rgba(103,232,249,0.18),transparent_28%)]" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-7xl">
          <div className="max-w-5xl">
            <p className="hero-reveal mb-5 inline-flex items-center gap-2 rounded-[2rem] border border-ghost/15 bg-ghost/8 px-4 py-2 font-mono text-xs uppercase tracking-normal text-cyan-100 backdrop-blur-xl">
              <Zap size={14} aria-hidden="true" />
              Conversational PDF intelligence
            </p>
            <h1 className="hero-reveal text-[clamp(3.1rem,14vw,12rem)] font-extrabold leading-[0.82] tracking-normal">
              Documents beyond
              <span className="mt-2 block font-serif text-[clamp(4.6rem,18vw,20rem)] font-normal italic leading-[0.72] text-plasma drop-shadow-[0_0_34px_rgba(123,97,255,0.42)]">
                silence.
              </span>
            </h1>
            <p className="hero-reveal mt-8 max-w-2xl text-lg leading-8 text-ghost/78 sm:text-xl">
              Upload a PDF and ask direct questions. AskMyPDF turns static pages into grounded, cited answers that stream back with the source trail attached.
            </p>
            <div className="hero-reveal mt-9 flex flex-col gap-3 sm:flex-row">
              <MagneticButton onClick={scrollToUpload} className="bg-plasma px-6 py-4 font-bold text-white shadow-[0_18px_46px_rgba(123,97,255,0.38)]">
                Upload a PDF <UploadCloud size={18} aria-hidden="true" />
              </MagneticButton>
              <MagneticButton href="#artifacts" className="border border-ghost/18 bg-ghost/8 px-6 py-4 font-semibold text-ghost backdrop-blur-xl">
                See the system <ChevronRight size={18} aria-hidden="true" />
              </MagneticButton>
            </div>
          </div>
          <div className="hero-reveal mt-10 max-w-4xl">
            <ProductionStatusPanel {...systemStatus} />
          </div>
        </div>
      </section>

      <FeatureArtifacts />

      <section id="signal" className="relative overflow-hidden bg-graphite px-4 py-28 text-ghost sm:px-8 lg:px-12">
        <img src={textureImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 bg-graphite/78" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-8 font-mono text-xs uppercase text-ghost/45">The manifesto</p>
          <p className="max-w-5xl text-3xl font-bold leading-tight text-ghost/55 sm:text-5xl">
            Most document AI focuses on: quick summaries and vague chat bubbles.
          </p>
          <p className="mt-10 max-w-6xl font-serif text-5xl italic leading-[0.95] text-ghost sm:text-7xl lg:text-8xl">
            {splitWords("We focus on: cited conversation that stays locked to your PDF.")}
          </p>
        </div>
      </section>

      <section id="protocol" className="relative bg-deep-void">
        <div className="px-4 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase text-plasma">Sticky stacking archive</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-extrabold leading-none sm:text-6xl">The path from upload to answer has weight.</h2>
          </div>
        </div>

        <div className="protocol-stage relative h-[100dvh] overflow-hidden px-4 py-6 sm:px-8 lg:px-12">
          <img src={protocolImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.18]" />
          <div className="absolute inset-0 bg-deep-void/82" aria-hidden="true" />
          <div className="relative mx-auto h-full max-w-7xl">
            {protocolSteps.map((step, index) => {
              const Icon = step.icon

              return (
                <article
                  key={step.number}
                  className="protocol-card absolute inset-0 grid place-items-center rounded-[3rem] border border-ghost/12 bg-graphite/90 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.44)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:p-12"
                >
                  <div className="flex h-full w-full flex-col justify-between">
                    <p className="font-mono text-sm text-plasma">STEP {step.number}</p>
                    <div>
                      <div className="mb-6 grid h-14 w-14 place-items-center rounded-[1.5rem] border border-plasma/35 bg-plasma/12 text-plasma">
                        <Icon size={25} aria-hidden="true" />
                      </div>
                      <h3 className="max-w-2xl text-4xl font-extrabold leading-none sm:text-6xl">{step.title}</h3>
                      <p className="mt-6 max-w-xl text-base leading-8 text-ghost/66">{step.description}</p>
                    </div>
                  </div>
                  <div className="mt-10 grid place-items-center lg:mt-0">
                    <ProtocolVisual index={index} />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="upload" className="relative bg-ghost px-4 py-24 text-deep-void sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[3rem] border border-deep-void/10 bg-white p-5 shadow-[0_34px_120px_rgba(10,10,20,0.14)] sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-plasma">Get started</p>
              <h2 className="mt-4 text-4xl font-extrabold leading-none sm:text-6xl">Turn the next long PDF into a conversation.</h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-graphite/68">
                Drop the document, let the index form, then ask the question you actually need answered.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {["Private session", "Page-aware answers", "Live response stream"].map((item) => (
                <p key={item} className="flex items-center gap-2 rounded-[1.25rem] border border-deep-void/10 bg-deep-void/[0.03] px-4 py-3 text-sm font-semibold">
                  <CheckCircle2 size={16} className="text-plasma" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div ref={uploadRef}>
            <UploadZone uploadState={uploadState} onUpload={uploadFile} onReset={reset} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="rounded-t-[4rem] bg-deep-void px-4 py-12 text-ghost sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
        <div>
          <p className="text-2xl font-extrabold">AskMyPDF</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ghost/58">Conversational PDF intelligence for documents that deserve precise answers.</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-ghost/42">Navigate</p>
          <div className="mt-4 grid gap-2 text-sm text-ghost/68">
            <a href="#signal" className="transition hover:-translate-y-px hover:text-plasma">Signal</a>
            <a href="#artifacts" className="transition hover:-translate-y-px hover:text-plasma">Artifacts</a>
            <a href="#protocol" className="transition hover:-translate-y-px hover:text-plasma">Protocol</a>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-ghost/42">Legal</p>
          <div className="mt-4 grid gap-2 text-sm text-ghost/68">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
        <div className="self-start rounded-[2rem] border border-ghost/10 bg-graphite p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase text-ghost/70">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)] animate-pulse" />
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
  const isChat = uploadState.status === "ready"

  function handleReset() {
    reset()
    clearChat()
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-deep-void text-ghost">
        {isChat ? <Header uploadState={uploadState} onReset={handleReset} /> : null}

        <main>
          {!isChat ? (
            <Landing uploadState={uploadState} uploadFile={uploadFile} reset={reset} systemStatus={systemStatus} />
          ) : (
            <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
              <ChatInterface
                uploadState={uploadState}
                messages={messages}
                isLoading={isLoading}
                error={error}
                onSend={sendMessage}
              />
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
