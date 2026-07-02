import { motion, useReducedMotion } from "framer-motion"
import { BarChart3, BookOpen, FileSearch, ListTree, Send, Sparkles } from "lucide-react"
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
  { icon: BarChart3, text: "Are there any numbers or statistics I should know?" },
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
      content: `I've read your PDF (${uploadState.pageCount ?? 0} pages, ${uploadState.chunkCount ?? 0} chunks indexed).\nSelected model: ${activeModel?.label ?? "Private Extractive"}. Ask me anything and I will answer from the document with citations when sources are available.`,
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
    <section className="chat-workspace relative flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      <div className="chat-live-bg pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="chat-grid" />
        <div className="chat-scanline" />
        <div className="chat-energy chat-energy-a" />
        <div className="chat-energy chat-energy-b" />
      </div>

      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: -8 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-center gap-3 border-b border-border bg-white/76 px-4 py-2 backdrop-blur-sm"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <BookOpen size={13} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
            <span className="font-bold text-foreground">{uploadState.filename}</span>
            <span className="mx-2 opacity-40">/</span>
            <span>{uploadState.pageCount ?? 0} pages</span>
            <span className="mx-2 opacity-40">/</span>
            <span>{uploadState.chunkCount ?? 0} chunks</span>
          </span>
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-success motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]" aria-hidden="true" />
      </motion.div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="relative z-10 flex flex-1 overflow-y-auto scroll-smooth px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
          {isEmpty ? (
            <>
              <ChatMessage message={welcomeMessage} />

              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 22 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col items-center justify-center gap-5 py-6"
              >
                <p className="rounded-full border border-border bg-white px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">Quick prompts</p>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }, idx) => (
                    <motion.button
                      key={text}
                      type="button"
                      onClick={() => handleSuggestion(text)}
                      disabled={isLoading || !selectedModelAvailable}
                      initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
                      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.06, duration: 0.28, ease: "easeOut" }}
                      whileHover={shouldReduce || isLoading || !selectedModelAvailable ? undefined : { y: -3 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                      className="group relative flex min-h-[86px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-border bg-white px-4 py-3.5 text-left text-sm font-semibold text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.07)] outline-none transition hover:border-primary/30 hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary transition group-hover:bg-white">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="leading-5">{text}</span>
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
                  ? "Composing cited answer without external AI..."
                  : modelPreference === "thinking"
                    ? "Thinking more carefully..."
                    : "Finding cited answer..."
              }
            />
          ) : null}

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
            >
              {error}
            </motion.p>
          ) : null}

          {saveError ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
            >
              {saveError}
            </motion.p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 px-4 py-4 sm:px-6">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-white/88 shadow-[0_18px_48px_rgba(15,23,42,0.1)] backdrop-blur-xl transition duration-300"
          style={isInputFocused ? { borderColor: "rgba(0,82,255,0.38)", boxShadow: "0 0 0 4px rgba(0,82,255,0.08), 0 20px 58px rgba(0,82,255,0.12)" } : undefined}
        >
          <div className="border-b border-border px-3 py-3">
            <ModelSelector compact value={modelPreference} onChange={onModelPreferenceChange} models={availableModels} disabled={isLoading} />
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
              "w-full resize-none bg-transparent px-5 pb-3 pt-4 text-[15px] leading-6 text-foreground",
              "placeholder:text-muted-foreground/65 outline-none",
              isLoading && "cursor-not-allowed opacity-50",
            )}
          />

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${charPct}%`,
                    background: charPct > 90 ? "#EF4444" : "linear-gradient(90deg, #0052FF, #4D7CFF)",
                  }}
                />
              </div>
              <span className={cn("font-mono text-[11px] tabular-nums", value.length >= 950 ? "text-red-600" : "text-muted-foreground")}>
                {value.length}/1000
              </span>
            </div>

            <motion.button
              type="button"
              aria-label="Send message"
              disabled={isLoading || !value.trim() || !selectedModelAvailable}
              onClick={() => void handleSend()}
              whileHover={shouldReduce ? undefined : { y: -1, scale: 1.04 }}
              whileTap={shouldReduce ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-35",
                value.trim() && !isLoading && selectedModelAvailable
                  ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_10px_24px_rgba(0,82,255,0.24)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Send size={15} aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
