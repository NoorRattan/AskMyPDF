import { motion, useReducedMotion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, FileText, Layers3, ShieldCheck, Sparkles } from "lucide-react"
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

const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>A</span>
    </span>
  )
}

function LandingHeader({ onStart }: { onStart: () => void }) {
  const shouldReduce = useReducedMotion()

  return (
    <header className="site-header">
      <a className="brand-lockup" href="#top" aria-label="AskMyPDF home">
        <BrandMark />
        <span>askmypdf</span>
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <motion.button
        type="button"
        onClick={onStart}
        whileHover={shouldReduce ? undefined : { y: -2 }}
        whileTap={shouldReduce ? undefined : { scale: 0.98 }}
        className="header-cta"
      >
        Start with a PDF <ArrowDownRight size={16} aria-hidden="true" />
      </motion.button>
    </header>
  )
}

function DocumentSculpture() {
  return (
    <div className="document-sculpture" aria-hidden="true">
      <span className="sculpture-halo sculpture-halo-one" />
      <span className="sculpture-halo sculpture-halo-two" />
      <span className="sculpture-grid" />
      <div className="sculpture-page sculpture-page-back" />
      <div className="sculpture-page sculpture-page-mid" />
      <div className="sculpture-page sculpture-page-front">
        <span className="sculpture-eyebrow">DOCUMENT / 01</span>
        <span className="sculpture-title">Your research,<br />in conversation.</span>
        <span className="sculpture-lines"><i /><i /><i /></span>
        <span className="sculpture-orb" />
      </div>
      <span className="sculpture-caption">Context, resolved</span>
    </div>
  )
}

function Landing({
  uploadState,
  uploadFile,
  reset,
  selectedModel,
  onModelChange,
}: {
  uploadState: ReturnType<typeof useUpload>["state"]
  uploadFile: ReturnType<typeof useUpload>["uploadFile"]
  reset: ReturnType<typeof useUpload>["reset"]
  selectedModel: ModelPreference
  onModelChange: (model: ModelPreference) => void
}) {
  const uploadRef = useRef<HTMLElement>(null)
  const uploadZoneRef = useRef<UploadZoneHandle>(null)
  const systemStatus = useSystemStatus()
  const shouldReduce = useReducedMotion()

  function start() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    window.setTimeout(() => uploadZoneRef.current?.openPicker(), 550)
  }

  return (
    <div id="top" className="landing-shell">
      <div className="ambient-field" aria-hidden="true"><span /><span /><span /></div>
      <LandingHeader onStart={start} />

      <main>
        <section className="hero-section">
          <motion.div
            initial={shouldReduce ? false : "hidden"}
            animate="visible"
            transition={{ staggerChildren: 0.1, delayChildren: 0.08 }}
            className="hero-copy"
          >
            <motion.p variants={rise} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="eyebrow">
              <span /> Your private reading room
            </motion.p>
            <motion.h1 variants={rise} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              Let your documents<br />
              <em>answer back.</em>
            </motion.h1>
            <motion.p variants={rise} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="hero-intro">
              AskMyPDF turns long, dense PDFs into a calm, cited conversation—so you can move from searching to understanding.
            </motion.p>
            <motion.div variants={rise} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="hero-actions">
              <button type="button" className="primary-button" onClick={start}>
                Begin with a document <ArrowDownRight size={18} aria-hidden="true" />
              </button>
              <a className="text-button" href="#how-it-works">See the method <ArrowUpRight size={15} aria-hidden="true" /></a>
            </motion.div>
          </motion.div>
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, scale: 0.92, rotate: -3 }}
            animate={shouldReduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            className="hero-art"
          >
            <DocumentSculpture />
          </motion.div>
        </section>

        <section ref={uploadRef} id="workspace" className="workspace-section">
          <div className="workspace-heading">
            <p className="eyebrow"><span /> Start a reading session</p>
            <h2>A clear place<br /><em>to begin.</em></h2>
            <p>Choose how you want to think, then bring in the document. Your chat opens when its context is ready.</p>
          </div>
          <div className="workspace-console">
            <div className="console-topline"><span>New session</span><span>PDF intelligence</span></div>
            <UploadZone ref={uploadZoneRef} uploadState={uploadState} onUpload={uploadFile} onReset={reset} />
            <div className="console-divider" />
            <ModelSelector
              compact
              value={selectedModel}
              onChange={onModelChange}
              models={systemStatus.details?.available_models}
              disabled={uploadState.status === "uploading" || uploadState.status === "processing"}
            />
            <p className="session-note"><ShieldCheck size={14} aria-hidden="true" /> Your document is processed for this session. Online modes use retrieved excerpts only.</p>
          </div>
        </section>

        <section id="how-it-works" className="method-section">
          <div className="method-intro">
            <p className="eyebrow"><span /> Designed for close reading</p>
            <h2>Less hunting.<br /><em>More knowing.</em></h2>
          </div>
          <ol className="method-list">
            <li><span>01</span><div><FileText size={21} aria-hidden="true" /><h3>Bring the source</h3><p>Upload a PDF you have permission to use. Each conversation stays anchored to that single document.</p></div></li>
            <li><span>02</span><div><Layers3 size={21} aria-hidden="true" /><h3>Build the context</h3><p>Pages are indexed into retrievable passages, so details do not disappear into a vague summary.</p></div></li>
            <li><span>03</span><div><Sparkles size={21} aria-hidden="true" /><h3>Follow the thread</h3><p>Ask naturally, inspect the cited source trail, and keep the important answer when it matters.</p></div></li>
          </ol>
        </section>

        <section id="privacy" className="assurance-section">
          <div><p className="eyebrow"><span /> Built with intention</p><h2>Your questions deserve <em>a source.</em></h2></div>
          <p>AskMyPDF is designed around bounded document context, visible citations, and explicit model routing—not opaque answers without a trail.</p>
          <ProductionStatusPanel {...systemStatus} />
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand-lockup" href="#top"><BrandMark /><span>askmypdf</span></a>
        <p>Conversational document intelligence, with the source in view.</p>
        <span>© {new Date().getFullYear()}</span>
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
    if (models?.length) setSelectedModel((current) => selectPreferredModel(current, models))
  }, [systemStatus.details?.available_models])

  function handleReset() {
    reset()
    clearChat()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <ErrorBoundary>
      {isChat ? (
        <div className="app-shell"><Header uploadState={uploadState} onReset={handleReset} onHome={handleReset} /><ChatInterface uploadState={uploadState} messages={messages} isLoading={isLoading} error={error} modelPreference={selectedModel} onModelPreferenceChange={setSelectedModel} availableModels={systemStatus.details?.available_models} onSend={sendMessage} /></div>
      ) : (
        <Landing uploadState={uploadState} uploadFile={uploadFile} reset={reset} selectedModel={selectedModel} onModelChange={setSelectedModel} />
      )}
    </ErrorBoundary>
  )
}
