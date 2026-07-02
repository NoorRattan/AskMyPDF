import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Network,
  ScanLine,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { type ReactNode, useEffect, useMemo, useState } from "react"

import { ChatInterface } from "./components/ChatInterface"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header"
import { ModelSelector } from "./components/ModelSelector"
import { ProductionStatusPanel } from "./components/ProductionStatusPanel"
import { UploadZone } from "./components/UploadZone"
import { useChat } from "./hooks/useChat"
import { useSystemStatus } from "./hooks/useSystemStatus"
import { useUpload } from "./hooks/useUpload"
import type { ModelPreference } from "./types"

type AppView = "workspace" | "insights" | "workflow"

const views: Array<{ id: AppView; label: string }> = [
  { id: "workspace", label: "Workspace" },
  { id: "insights", label: "System" },
  { id: "workflow", label: "Workflow" },
]

const workflowSteps = [
  {
    label: "Step 01",
    title: "Ingest the PDF",
    body: "The backend validates the file, extracts pages, chunks content, and creates a private session.",
    icon: FileText,
  },
  {
    label: "Step 02",
    title: "Retrieve context",
    body: "The question is matched against indexed passages so answers stay grounded in the uploaded document.",
    icon: ScanLine,
  },
  {
    label: "Step 03",
    title: "Answer with citations",
    body: "The selected model route streams a response and returns page-level sources for inspection.",
    icon: MessageSquareText,
  },
] as const

const implementedCapabilities = [
  "PDF upload and status polling",
  "Offline local extractive mode",
  "Online model routing",
  "Streaming cited answers",
  "Saved answer endpoint",
  "Private in-memory sessions",
] as const

function viewFromHash(): AppView {
  const next = window.location.hash.replace("#", "")
  return views.some((view) => view.id === next) ? (next as AppView) : "workspace"
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="section-badge">
      <span className="section-badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="primary-action group">
      {children}
      <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  )
}

function ShellNav({
  activeView,
  onNavigate,
}: {
  activeView: AppView
  onNavigate: (view: AppView) => void
}) {
  return (
    <header className="site-nav">
      <button type="button" onClick={() => onNavigate("workspace")} className="brand-lockup" aria-label="Open workspace">
        <span className="brand-mark">
          <FileText size={18} aria-hidden="true" />
        </span>
        <span className="brand-copy">
          <span className="brand-name">AskMyPDF</span>
          <span className="brand-subtitle">Document AI workspace</span>
        </span>
      </button>

      <nav className="view-switcher" aria-label="Application views">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onNavigate(view.id)}
            aria-current={activeView === view.id ? "page" : undefined}
            className={activeView === view.id ? "view-tab view-tab-active" : "view-tab"}
          >
            {view.label}
          </button>
        ))}
      </nav>

      <PrimaryButton onClick={() => onNavigate("workspace")}>Upload PDF</PrimaryButton>
    </header>
  )
}

function WorkspaceView({
  selectedModel,
  onModelChange,
  systemStatus,
  uploadState,
  uploadFile,
  reset,
  onNavigate,
}: {
  selectedModel: ModelPreference
  onModelChange: (model: ModelPreference) => void
  systemStatus: ReturnType<typeof useSystemStatus>
  uploadState: ReturnType<typeof useUpload>["state"]
  uploadFile: ReturnType<typeof useUpload>["uploadFile"]
  reset: ReturnType<typeof useUpload>["reset"]
  onNavigate: (view: AppView) => void
}) {
  return (
    <section className="page-view workspace-view">
      <div className="hero-grid">
        <div className="hero-copy reveal-up">
          <Badge>Workspace</Badge>
          <h1 className="display-title">
            Turn long PDFs into <span className="gradient-text">cited answers.</span>
          </h1>
          <p className="lead-copy">
            Choose the model route first, upload the document, then ask inside a focused workspace backed by the current API.
          </p>

          <div className="hero-actions">
            <PrimaryButton onClick={() => document.getElementById("upload-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              Choose a PDF
            </PrimaryButton>
            <button type="button" onClick={() => onNavigate("workflow")} className="secondary-action">
              View workflow
            </button>
          </div>

          <div className="proof-grid" aria-label="Implemented capabilities">
            {["Offline route", "Online route", "Citations", "Saved answers"].map((item) => (
              <span key={item} className="proof-pill">
                <CheckCircle2 size={14} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div id="upload-panel" className="upload-panel reveal-up reveal-delay-1">
          <ModelSelector
            compact
            value={selectedModel}
            onChange={onModelChange}
            models={systemStatus.details?.available_models}
            disabled={uploadState.status === "uploading" || uploadState.status === "processing"}
          />
          <UploadZone uploadState={uploadState} onUpload={uploadFile} onReset={reset} />
        </div>
      </div>

      <div className="status-row reveal-up reveal-delay-2">
        <ProductionStatusPanel {...systemStatus} />
      </div>
    </section>
  )
}

function InsightsView({
  systemStatus,
  onNavigate,
}: {
  systemStatus: ReturnType<typeof useSystemStatus>
  onNavigate: (view: AppView) => void
}) {
  const available = systemStatus.details?.available_models?.filter((model) => model.available).length ?? 0
  const total = systemStatus.details?.available_models?.length ?? 0

  return (
    <section className="page-view">
      <div className="split-page">
        <div className="reveal-up">
          <Badge>System</Badge>
          <h1 className="display-title display-title-small">
            Frontend claims now match <span className="gradient-text">backend capabilities.</span>
          </h1>
          <p className="lead-copy">
            These are not decorative badges. Each item shown here is backed by an implemented route, status payload, or local app behavior.
          </p>
          <div className="hero-actions">
            <PrimaryButton onClick={() => onNavigate("workspace")}>Open workspace</PrimaryButton>
            <button type="button" onClick={() => onNavigate("workflow")} className="secondary-action">
              See request flow
            </button>
          </div>
        </div>

        <div className="insight-card reveal-up reveal-delay-1">
          <div className="metric-grid">
            <div className="metric-tile">
              <span>Runtime</span>
              <strong>{systemStatus.status === "online" ? "Online" : systemStatus.status === "checking" ? "Checking" : "Degraded"}</strong>
            </div>
            <div className="metric-tile">
              <span>Models ready</span>
              <strong>{total ? `${available}/${total}` : "Checking"}</strong>
            </div>
            <div className="metric-tile">
              <span>Retrieval</span>
              <strong>{systemStatus.details?.embedding_model ?? "Checking"}</strong>
            </div>
            <div className="metric-tile">
              <span>Memory profile</span>
              <strong>{systemStatus.details?.memory_profile ?? "Checking"}</strong>
            </div>
          </div>

          <div className="capability-list">
            {implementedCapabilities.map((capability) => (
              <div key={capability} className="capability-row">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkflowGraphic() {
  return (
    <div className="workflow-graphic" aria-hidden="true">
      <span className="orbit-ring orbit-ring-one" />
      <span className="orbit-ring orbit-ring-two" />
      <span className="scan-card">
        <FileSearch size={34} />
      </span>
      <span className="flow-line flow-line-a" />
      <span className="flow-line flow-line-b" />
    </div>
  )
}

function WorkflowView({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <section className="page-view">
      <div className="workflow-header reveal-up">
        <Badge>Workflow</Badge>
        <h1 className="display-title display-title-small">
          A real app flow, not animated decoration.
        </h1>
        <p className="lead-copy">
          The UI moves between real views, upload state, model choice, chat state, citations, and saved-answer calls.
        </p>
      </div>

      <div className="workflow-grid">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <article key={step.label} className="workflow-card reveal-up" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="workflow-card-top">
                <span>{step.label}</span>
                <Icon size={20} aria-hidden="true" />
              </div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              <WorkflowGraphic />
            </article>
          )
        })}
      </div>

      <div className="workflow-cta reveal-up reveal-delay-2">
        <div>
          <h2>Ready to test the working path?</h2>
          <p>Go back to the workspace, choose a model, and upload the PDF before asking.</p>
        </div>
        <PrimaryButton onClick={() => onNavigate("workspace")}>Open workspace</PrimaryButton>
      </div>
    </section>
  )
}

function FeatureRail() {
  const items = useMemo(
    () => [
      { icon: LockKeyhole, label: "Private session", text: "Upload state and saved answers are scoped to the session." },
      { icon: Network, label: "Model choice", text: "Offline, fast online, and deeper online routes use the backend catalog." },
      { icon: BookOpenCheck, label: "Citations", text: "Responses preserve source chunks and page references." },
      { icon: Zap, label: "Streaming", text: "The chat view consumes server-sent answer events." },
    ],
    [],
  )

  return (
    <aside className="feature-rail" aria-label="Product capabilities">
      {items.map(({ icon: Icon, label, text }) => (
        <article key={label} className="feature-tile">
          <span>
            <Icon size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>{label}</h2>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </aside>
  )
}

function LandingShell({
  activeView,
  onNavigate,
  selectedModel,
  onModelChange,
  systemStatus,
  uploadState,
  uploadFile,
  reset,
}: {
  activeView: AppView
  onNavigate: (view: AppView) => void
  selectedModel: ModelPreference
  onModelChange: (model: ModelPreference) => void
  systemStatus: ReturnType<typeof useSystemStatus>
  uploadState: ReturnType<typeof useUpload>["state"]
  uploadFile: ReturnType<typeof useUpload>["uploadFile"]
  reset: ReturnType<typeof useUpload>["reset"]
}) {
  return (
    <div className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <ShellNav activeView={activeView} onNavigate={onNavigate} />
      <main>
        {activeView === "workspace" ? (
          <WorkspaceView
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            systemStatus={systemStatus}
            uploadState={uploadState}
            uploadFile={uploadFile}
            reset={reset}
            onNavigate={onNavigate}
          />
        ) : null}
        {activeView === "insights" ? <InsightsView systemStatus={systemStatus} onNavigate={onNavigate} /> : null}
        {activeView === "workflow" ? <WorkflowView onNavigate={onNavigate} /> : null}
      </main>
      <FeatureRail />
      <footer className="site-footer">
        <span>AskMyPDF</span>
        <span>Private PDF question answering with backend-backed routes.</span>
        <button type="button" onClick={() => onNavigate("workspace")}>
          Start again
        </button>
      </footer>
    </div>
  )
}

export default function App() {
  const { state: uploadState, uploadFile, reset } = useUpload()
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(uploadState.sessionId)
  const systemStatus = useSystemStatus()
  const [selectedModel, setSelectedModel] = useState<ModelPreference>("offline")
  const [activeView, setActiveView] = useState<AppView>(() => viewFromHash())
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

  useEffect(() => {
    function syncHash() {
      setActiveView(viewFromHash())
    }

    window.addEventListener("hashchange", syncHash)
    window.addEventListener("popstate", syncHash)
    return () => {
      window.removeEventListener("hashchange", syncHash)
      window.removeEventListener("popstate", syncHash)
    }
  }, [])

  function navigate(view: AppView) {
    setActiveView(view)
    window.history.pushState(null, "", `#${view}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleReset() {
    reset()
    clearChat()
    navigate("workspace")
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {isChat ? <Header uploadState={uploadState} onReset={handleReset} /> : null}

        {!isChat ? (
          <LandingShell
            activeView={activeView}
            onNavigate={navigate}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            systemStatus={systemStatus}
            uploadState={uploadState}
            uploadFile={uploadFile}
            reset={reset}
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
      </div>
    </ErrorBoundary>
  )
}
