import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowDown,
  Brain,
  CheckCircle2,
  FileText,
  Lock,
  MessageSquareText,
  ScanText,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react"
import { useRef } from "react"

import { ChatInterface } from "./components/ChatInterface"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header"
import { UploadZone } from "./components/UploadZone"
import { useChat } from "./hooks/useChat"
import { useUpload } from "./hooks/useUpload"

const metrics = [
  { label: "Context window", value: "RAG" },
  { label: "Citation mode", value: "page aware" },
  { label: "Response path", value: "SSE live" },
] as const

const engineCards = [
  {
    icon: ScanText,
    title: "Chunked with intent",
    detail: "Pages become searchable slices so answers stay anchored to the original document.",
  },
  {
    icon: Brain,
    title: "Retrieval before response",
    detail: "The assistant reads relevant passages first, then answers from document context.",
  },
  {
    icon: Lock,
    title: "Session scoped",
    detail: "Each PDF lives in its own isolated session collection for cleaner retrieval boundaries.",
  },
] as const

const signalRows = ["extract_text()", "embed_chunks()", "query_context()", "stream_answer()"] as const

export default function App() {
  const { state: uploadState, uploadFile, reset } = useUpload()
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(uploadState.sessionId)
  const uploadRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()
  const isChat = uploadState.status === "ready"

  function handleReset() {
    reset()
    clearChat()
  }

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg text-text">
        <Header uploadState={uploadState} onReset={handleReset} onStart={scrollToUpload} />

        <main>
          <AnimatePresence mode="wait">
            {!isChat ? (
              <motion.div
                key="landing"
                initial={shouldReduce ? false : { opacity: 0, y: 20, scale: 0.99 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduce ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden"
              >
                <div className="control-room pointer-events-none absolute inset-0" aria-hidden="true" />
                <section className="relative min-h-[calc(100vh-56px)] px-4 py-14 sm:px-6 lg:px-8">
                  <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div className="max-w-3xl">
                      <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.45 }}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase text-primary-light"
                      >
                        <Zap size={14} aria-hidden="true" />
                        RAG document intelligence
                      </motion.p>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.5 }}
                        className="max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-normal text-text sm:text-6xl lg:text-7xl"
                      >
                        Your PDF just got a voice.
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-6 max-w-2xl text-lg leading-8 text-secondary"
                      >
                        Drop a dense document into AskMyPDF and ask questions like you are talking to the author.
                        The answer streams back with context, citations, and the calm precision of a focused terminal.
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28, duration: 0.45 }}
                        className="mt-8 flex flex-col gap-3 sm:flex-row"
                      >
                        <motion.button
                          type="button"
                          onClick={scrollToUpload}
                          whileHover={
                            shouldReduce
                              ? undefined
                              : {
                                  y: -2,
                                  scale: 1.02,
                                  boxShadow: "0 0 0 4px #7C3AED33, 0 8px 24px rgba(124,58,237,0.4)",
                                }
                          }
                          whileTap={shouldReduce ? undefined : { scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          style={{
                            background: "linear-gradient(135deg, #6D28D9, #7C3AED, #8B5CF6)",
                            boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
                          }}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        >
                          Upload a PDF
                          <ArrowDown size={18} aria-hidden="true" />
                        </motion.button>
                        <motion.a
                          href="#demo"
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
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-5 py-3 font-semibold text-primary-light outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Watch the flow
                        </motion.a>
                      </motion.div>

                      <div className="mt-10 grid gap-3 sm:grid-cols-3">
                        {metrics.map((metric) => (
                          <div key={metric.label} className="border-l border-primary/40 pl-4">
                            <p className="font-mono text-xs uppercase text-secondary">{metric.label}</p>
                            <p className="mt-1 text-sm font-semibold text-text">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 26, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.18, duration: 0.55, ease: "easeOut" }}
                      className="relative"
                    >
                      <div className="absolute -inset-5 rounded-[2rem] border border-primary/15 bg-primary/5 blur-2xl" aria-hidden="true" />
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 shadow-[0_35px_120px_#00000080] backdrop-blur">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-error" />
                            <span className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                            <span className="h-2.5 w-2.5 rounded-full bg-success" />
                          </div>
                          <p className="font-mono text-xs text-secondary">askmypdf.session/live</p>
                        </div>

                        <div className="space-y-5 p-5">
                          <div className="rounded-xl border border-border bg-bg/70 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText size={17} className="text-primary-light" aria-hidden="true" />
                                <span className="font-mono text-xs text-secondary">annual-report.pdf</span>
                              </div>
                              <span className="rounded-full bg-success/10 px-2 py-1 font-mono text-[11px] text-success">
                                indexed
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-raised">
                              <motion.div
                                animate={shouldReduce ? undefined : { x: ["-18%", "0%", "-18%"] }}
                                transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
                                className="h-full w-5/6 rounded-full bg-gradient-to-r from-primary via-primary-light to-success"
                              />
                            </div>
                          </div>

                          <div className="grid gap-3">
                            {signalRows.map((row, idx) => (
                              <motion.div
                                key={row}
                                animate={shouldReduce ? undefined : { opacity: [0.45, 1, 0.45] }}
                                transition={{ repeat: Infinity, delay: idx * 0.28, duration: 2.6 }}
                                className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-raised/55 px-3 py-2 font-mono text-xs"
                              >
                                <span className="text-secondary">{row}</span>
                                <CheckCircle2 size={14} className="text-success" aria-hidden="true" />
                              </motion.div>
                            ))}
                          </div>

                          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                              <MessageSquareText size={16} className="text-primary-light" aria-hidden="true" />
                              What changed in revenue this quarter?
                            </p>
                            <p className="text-sm leading-6 text-secondary">
                              Revenue increased because enterprise renewals accelerated in Q3, with expansion strongest
                              in platform subscriptions.
                            </p>
                            <p className="mt-3 font-mono text-xs text-primary-light">[Page 12] [Page 18]</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </section>

                <section id="demo" className="relative border-y border-border/70 bg-surface/45 px-4 py-20 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                      <div>
                        <p className="font-mono text-xs uppercase text-primary-light">live-feeling workflow</p>
                        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-text sm:text-5xl">
                          Upload, ask, inspect the source. One continuous motion.
                        </h2>
                      </div>
                      <p className="max-w-xl text-sm leading-6 text-secondary">
                        The interface is built around the moment a static document becomes searchable, conversational,
                        and accountable.
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-2xl border border-border bg-bg/70 p-5 shadow-[0_22px_80px_#00000045]">
                        <div className="mb-5 flex items-center justify-between">
                          <p className="font-mono text-xs uppercase text-secondary">document intake</p>
                          <Sparkles size={16} className="text-primary-light" aria-hidden="true" />
                        </div>
                        <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-primary/45 bg-surface/70">
                          <motion.div
                            animate={shouldReduce ? undefined : { y: [0, -8, 0], rotate: [0, -1.2, 0] }}
                            transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                            className="text-center"
                          >
                            <div className="mx-auto grid h-20 w-16 place-items-center rounded-lg border border-primary/50 bg-primary/10 shadow-[0_0_44px_#7C3AED35]">
                              <FileText size={32} className="text-primary-light" aria-hidden="true" />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-text">PDF accepted</p>
                            <p className="mt-1 font-mono text-xs text-secondary">187 chunks indexed</p>
                          </motion.div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-bg/70 p-5 shadow-[0_22px_80px_#00000045]">
                        <div className="mb-5 flex items-center justify-between">
                          <p className="font-mono text-xs uppercase text-secondary">conversation stream</p>
                          <TerminalSquare size={16} className="text-primary-light" aria-hidden="true" />
                        </div>
                        <div className="space-y-4">
                          <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-[#1E1B4B] px-4 py-3 text-sm text-primary-light">
                            Summarize the contract risks in plain English.
                          </div>
                          <div className="max-w-[86%] rounded-2xl rounded-tl-sm border-l-2 border-primary bg-surface-raised px-4 py-3">
                            <p className="text-sm leading-6 text-text">
                              The main risk is automatic renewal language tied to a narrow cancellation window, followed
                              by a liability cap that excludes data-processing claims.
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <p className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-secondary">
                                PAGE 4 / renewal clause
                              </p>
                              <p className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-secondary">
                                PAGE 9 / liability cap
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs text-success">
                            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_16px_#10B981]" />
                            sources attached
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="trust" className="relative px-4 py-20 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-7xl">
                    <div className="mb-10 max-w-3xl">
                      <p className="font-mono text-xs uppercase text-primary-light">engine room</p>
                      <h2 className="mt-3 text-3xl font-bold leading-tight text-text sm:text-5xl">
                        Precision underneath. Quiet on the surface.
                      </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {engineCards.map((card) => {
                        const Icon = card.icon

                        return (
                          <motion.div
                            key={card.title}
                            whileHover={shouldReduce ? undefined : { y: -6 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_18px_70px_#00000035]"
                          >
                            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-primary/35 bg-primary/10 text-primary-light">
                              <Icon size={21} aria-hidden="true" />
                            </div>
                            <h3 className="text-xl font-bold text-text">{card.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-secondary">{card.detail}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
                  <div className="mx-auto grid max-w-7xl gap-8 rounded-[1.5rem] border border-primary/25 bg-surface/70 p-6 shadow-[0_30px_110px_#00000070] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
                    <div className="flex flex-col justify-center">
                      <p className="font-mono text-xs uppercase text-success">ready when you are</p>
                      <h2 className="mt-3 text-3xl font-bold leading-tight text-text sm:text-5xl">
                        Turn the next long PDF into a conversation.
                      </h2>
                      <p className="mt-5 max-w-xl text-sm leading-6 text-secondary">
                        This is the handoff from promise to product: one document in, one focused workspace out.
                      </p>
                    </div>
                    <div ref={uploadRef}>
                      <UploadZone uploadState={uploadState} onUpload={uploadFile} onReset={reset} />
                    </div>
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={shouldReduce ? false : { opacity: 0, y: 20, scale: 0.99 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduce ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-[calc(100vh-56px)] flex-col overflow-hidden"
              >
                <ChatInterface
                  uploadState={uploadState}
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                  onSend={sendMessage}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  )
}
