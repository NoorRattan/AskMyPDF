import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, FileSearch, FileText, MessageSquareQuote, Sparkles, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { ChatInterface } from "./components/ChatInterface"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header"
import { ModelSelector, selectPreferredModel } from "./components/ModelSelector"
import { ProductionStatusPanel } from "./components/ProductionStatusPanel"
import { UploadZone, type UploadZoneHandle } from "./components/UploadZone"
import { useChat } from "./hooks/useChat"
import { useSystemStatus } from "./hooks/useSystemStatus"
import { useUpload } from "./hooks/useUpload"
import type { ModelPreference } from "./types"

const features = [
  {
    icon: FileText,
    title: "Document-aware retrieval",
    description: "Your PDF is indexed into searchable chunks before the first question is asked.",
  },
  {
    icon: MessageSquareQuote,
    title: "Cited, grounded answers",
    description: "Every answer references the page and passage it came from. No hallucinated sources.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    description: "Answers arrive token by token via Server-Sent Events for real-time feedback.",
  },
] as const

const steps = [
  { number: "01", title: "Upload your PDF", description: "Drop a file in. The backend extracts, chunks, and embeds it in the background." },
  { number: "02", title: "Pick a model route", description: "Choose Fast Online for quick lookups or Deep Online for synthesis and summaries." },
  { number: "03", title: "Ask and cite", description: "Ask in natural language. Answers stream back with page citations attached." },
] as const

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
  const uploadRef = useRef<HTMLElement>(null)
  const uploadZoneRef = useRef<UploadZoneHandle>(null)
  const shouldReduce = useReducedMotion()

  function scrollToUpload() {
    uploadZoneRef.current?.openPicker()
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="glow-blue pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full" aria-hidden="true" />
      <div className="glow-cyan pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full" aria-hidden="true" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
            <FileSearch size={18} className="text-brand-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-ink-100">AskMyPDF</span>
        </div>
        <button
          type="button"
          onClick={scrollToUpload}
          className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800/60 px-4 py-2 text-sm font-medium text-ink-200 transition hover:border-brand-500/50 hover:bg-ink-800"
        >
          Get started
          <ArrowRight size={15} />
        </button>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-10 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 20 }}
            animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800/60 px-3.5 py-1.5 font-mono text-xs font-medium text-ink-400">
              <Sparkles size={13} className="text-accent-400" />
              RAG-powered PDF intelligence
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink-50 sm:text-5xl lg:text-6xl">
              Chat with your PDFs.
              <br />
              <span className="gradient-text">Get cited answers.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-400">
              Upload a document, ask questions in plain language, and receive streamed answers grounded in the text — with page citations for every claim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToUpload}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Upload a PDF
                <ArrowRight size={16} />
              </button>
              <a
                href="https://github.com/NoorRattan/AskMyPDF"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-6 py-3 text-sm font-semibold text-ink-200 transition hover:border-ink-600 hover:bg-ink-800"
              >
                View source
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 20 }}
            animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-2xl border border-ink-700 p-6"
          >
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-500">How it works</p>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 font-mono text-xs font-bold text-brand-400">
                    {step.number}
                  </div>
                  <div>
                    <p className="font-semibold text-ink-100">{step.title}</p>
                    <p className="mt-0.5 text-sm text-ink-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={shouldReduce ? false : { opacity: 0, y: 16 }}
              whileInView={shouldReduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-ink-700 bg-ink-800/40 p-5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10">
                <feature.icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-ink-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="upload" ref={uploadRef} className="relative z-10 mx-auto max-w-3xl scroll-mt-8 px-6 py-12 sm:px-10">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">Upload your document</h2>
            <p className="mt-2 text-ink-400">Choose a model route, then drop your PDF to start asking questions.</p>
          </div>

          <UploadZone ref={uploadZoneRef} uploadState={uploadState} onUpload={uploadFile} onReset={reset} />

          <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-4">
            <ModelSelector
              compact
              value={selectedModel}
              onChange={onModelChange}
              models={systemStatus.details?.available_models}
              disabled={uploadState.status === "uploading" || uploadState.status === "processing"}
            />
          </div>

          <p className="rounded-lg border border-ink-700 bg-ink-800/30 px-4 py-3 text-xs leading-5 text-ink-500">
            PDFs are processed temporarily for this session. Online routes send retrieved PDF excerpts to Groq or Anthropic. Completed answers report the provider used.
          </p>

          <ProductionStatusPanel {...systemStatus} />
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-ink-800 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
              <FileSearch size={14} className="text-brand-400" />
            </div>
            <span className="text-sm font-medium text-ink-400">AskMyPDF</span>
          </div>
          <p className="text-sm text-ink-500">Conversational PDF intelligence with cited answers.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const { state: uploadState, uploadFile, reset } = useUpload()
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(uploadState.sessionId)
  const systemStatus = useSystemStatus()
  const [selectedModel, setSelectedModel] = useState<ModelPreference>("fast")
  const isChat = uploadState.status === "ready"

  useEffect(() => {
    const models = systemStatus.details?.available_models
    if (!models?.length) {
      return
    }

    const preferredModel = selectPreferredModel(selectedModel, models)
    if (preferredModel !== selectedModel) {
      setSelectedModel(preferredModel)
    }
  }, [selectedModel, systemStatus.details?.available_models])

  function handleReset() {
    reset()
    clearChat()
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-ink-950 text-ink-100">
        {isChat ? <Header uploadState={uploadState} onReset={handleReset} onHome={handleReset} /> : null}

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
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
