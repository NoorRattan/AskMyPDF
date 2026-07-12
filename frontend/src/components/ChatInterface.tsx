import { motion, useReducedMotion } from "framer-motion"
import { BookOpen, FileSearch, ListTree, Send, Sparkles, TrendingUp } from "lucide-react"
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"

import { saveCitedAnswer } from "../lib/api"
import { cn } from "../lib/utils"
import type { Message, ModelOption, ModelPreference, UploadState } from "../types"
import { ChatMessage } from "./ChatMessage"
import { ModelSelector, normalizeModels } from "./ModelSelector"
import { StreamingMessage } from "./StreamingMessage"
import { ThinkingIndicator } from "./ThinkingIndicator"

interface ChatInterfaceProps {
  uploadState: UploadState
  messages: Message[]
  isLoading: boolean
  error: string | null
  modelPreference: ModelPreference
  onModelPreferenceChange: (modelPreference: ModelPreference) => void
  availableModels?: ModelOption[] | null
  onSend: (question: string, modelPreference: ModelPreference) => Promise<void>
}

const SUGGESTED_QUESTIONS = [
  { icon: Sparkles, text: "Summarize this document." },
  { icon: FileSearch, text: "What are the key findings?" },
  { icon: ListTree, text: "List the main topics covered." },
  { icon: TrendingUp, text: "Are there any numbers or statistics I should know?" },
] as const

export function ChatInterface({
  uploadState,
  messages,
  isLoading,
  error,
  modelPreference,
  onModelPreferenceChange,
  availableModels,
  onSend,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [savingMessageIds, setSavingMessageIds] = useState<Set<string>>(() => new Set())
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(() => new Set())
  const [saveError, setSaveError] = useState<string | null>(null)
  const shouldReduce = useReducedMotion()

  const hasStreamingMessage = messages.some((message) => message.isStreaming && message.content.length > 0)
  const hasEmptyStreamingMessage = messages.some((message) => message.isStreaming && message.content.length === 0)
  const showThinking = isLoading && !hasStreamingMessage
  const activeModel = useMemo(
    () => normalizeModels(availableModels).find((model) => model.id === modelPreference),
    [availableModels, modelPreference],
  )
  const selectedModelAvailable = activeModel?.available ?? true

  const welcomeMessage = useMemo<Message>(
    () => ({
      id: "welcome-message",
      role: "assistant",
      content: `I've read your PDF (${uploadState.pageCount ?? 0} pages, ${uploadState.chunkCount ?? 0} chunks indexed).\nSelected model: ${activeModel?.label ?? "Fast Online"}. Ask me anything — I'll answer from the document.`,
      isStreaming: false,
      timestamp: new Date(),
    }),
    [activeModel?.label, uploadState.chunkCount, uploadState.pageCount],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showThinking])

  useEffect(() => {
    setSavingMessageIds(new Set())
    setSavedMessageIds(new Set())
    setSaveError(null)
  }, [uploadState.sessionId])

  function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
    const el = event.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 5 * 24)}px`
    setValue(el.value)
  }

  async function handleSend(nextValue = value) {
    const question = nextValue.trim()
    if (!question || isLoading || !selectedModelAvailable) {
      return
    }

    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await onSend(question, modelPreference)
  }

  function handleSuggestion(question: string) {
    setValue(question)
    void handleSend(question)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  function questionForAssistant(index: number): string {
    for (let idx = index - 1; idx >= 0; idx -= 1) {
      if (messages[idx]?.role === "user") {
        return messages[idx].content
      }
    }

    return "Saved cited answer"
  }

  async function handleSaveMessage(message: Message, index: number) {
    if (!uploadState.sessionId || !message.sources?.length || savedMessageIds.has(message.id)) {
      return
    }

    setSavingMessageIds((current) => new Set(current).add(message.id))
    setSaveError(null)

    try {
      await saveCitedAnswer({
        session_id: uploadState.sessionId,
        question: questionForAssistant(index),
        answer: message.content,
        sources: message.sources,
        model_used: message.modelUsed,
        provider_used: message.providerUsed,
        mode_used: message.modeUsed,
      })
      setSavedMessageIds((current) => new Set(current).add(message.id))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save cited answer.")
    } finally {
      setSavingMessageIds((current) => {
        const next = new Set(current)
        next.delete(message.id)
        return next
      })
    }
  }

  const isEmpty = messages.length === 0
  const charPct = (value.length / 1000) * 100

  return (
    <section className="relative flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-ink-950">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-center gap-3 border-b border-ink-800 bg-ink-900/60 px-4 py-2.5 backdrop-blur-sm">
        <BookOpen size={13} className="shrink-0 text-accent-400" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-ink-400">
          <span className="text-ink-200">{uploadState.filename}</span>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-accent-400">{uploadState.pageCount ?? 0} pages</span>
          <span className="mx-2 opacity-40">/</span>
          <span>{uploadState.chunkCount ?? 0} chunks</span>
        </span>
        <span className={`h-2 w-2 shrink-0 rounded-full bg-success ${!shouldReduce ? "animate-pulse-soft" : ""}`} />
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="relative z-10 flex-1 overflow-y-auto scroll-smooth px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {isEmpty ? (
            <>
              <ChatMessage message={welcomeMessage} />

              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 16 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-5 py-6"
              >
                <p className="rounded-full border border-ink-700 bg-ink-800/60 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-400">
                  Quick prompts
                </p>
                <div className="perspective-near grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }, idx) => (
                    <motion.button
                      key={text}
                      type="button"
                      onClick={() => handleSuggestion(text)}
                      disabled={isLoading || !selectedModelAvailable}
                      initial={shouldReduce ? false : { opacity: 0, y: 12, rotateX: -8 }}
                      animate={shouldReduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.2 + idx * 0.06, duration: 0.25, ease: "easeOut" }}
                      whileHover={shouldReduce || isLoading || !selectedModelAvailable ? undefined : { y: -4, rotateX: -4, scale: 1.02 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="group flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/40 px-4 py-3.5 text-left text-sm font-medium text-ink-200 transition hover:border-brand-500/40 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div style={{ transform: "translateZ(20px)" }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-brand-400 transition group-hover:border-brand-500/30 group-hover:bg-brand-500/10">
                        <Icon size={17} />
                      </div>
                      <span style={{ transform: "translateZ(10px)" }} className="leading-5">{text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          ) : null}

          {messages.map((message, index) => {
            if (message.isStreaming && message.content.length > 0) {
              return <StreamingMessage key={message.id} content={message.content} isStreaming={message.isStreaming} />
            }

            if (message.isStreaming && message.content.length === 0) {
              return null
            }

            return (
              <ChatMessage
                key={message.id}
                message={message}
                onSave={message.role === "assistant" ? () => void handleSaveMessage(message, index) : undefined}
                isSaving={savingMessageIds.has(message.id)}
                isSaved={savedMessageIds.has(message.id)}
              />
            )
          })}

          {showThinking || hasEmptyStreamingMessage ? (
            <ThinkingIndicator
              label={
                modelPreference === "offline"
                  ? "Composing through the backend-only route..."
                  : modelPreference === "thinking"
                    ? "Thinking more carefully..."
                    : "Finding cited answer..."
              }
            />
          ) : null}

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger"
            >
              {error}
            </motion.p>
          ) : null}

          {saveError ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger"
            >
              {saveError}
            </motion.p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 px-4 py-4 sm:px-6">
        <div
          className={cn(
            "mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-ink-900/80 backdrop-blur-xl transition-all duration-300",
            isInputFocused ? "border-brand-500/50 shadow-[0_8px_30px_rgba(59,130,246,0.12)]" : "border-ink-700",
          )}
        >
          <div className="border-b border-ink-800 px-3 py-3">
            <ModelSelector
              compact
              value={modelPreference}
              onChange={onModelPreferenceChange}
              models={availableModels}
              disabled={isLoading}
            />
          </div>

          <label htmlFor="chat-question" className="sr-only">
            Ask a question about your PDF
          </label>

          <textarea
            ref={textareaRef}
            id="chat-question"
            rows={1}
            placeholder="Ask a question about your PDF..."
            maxLength={1000}
            disabled={isLoading}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className={cn(
              "w-full resize-none bg-transparent px-5 pb-3 pt-4 text-[15px] font-medium leading-6 text-ink-100",
              "placeholder:text-ink-500 outline-none",
              isLoading && "cursor-not-allowed opacity-50",
            )}
          />

          <div className="flex items-center justify-between border-t border-ink-800 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${charPct}%`,
                    background: charPct > 90 ? "#EF4444" : "linear-gradient(90deg, #3B82F6, #22D3EE)",
                  }}
                />
              </div>
              <span className={cn("font-mono text-[11px] tabular-nums", value.length >= 950 ? "text-danger" : "text-ink-500")}>
                {value.length}/1000
              </span>
            </div>

            <motion.button
              type="button"
              aria-label="Send message"
              disabled={isLoading || !value.trim() || !selectedModelAvailable}
              onClick={() => void handleSend()}
              whileHover={shouldReduce ? undefined : { scale: 1.08, z: 20 }}
              whileTap={shouldReduce ? undefined : { scale: 0.92 }}
              style={{ transformStyle: "preserve-3d" }}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
                "disabled:cursor-not-allowed disabled:opacity-30",
                value.trim() && !isLoading && selectedModelAvailable
                  ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
                  : "border-ink-700 bg-ink-800 text-ink-500",
              )}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
