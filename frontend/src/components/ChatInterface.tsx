import { motion, useReducedMotion } from "framer-motion"
import { BarChart3, BookOpen, Brain, FileSearch, ListTree, Send, Sparkles, Zap } from "lucide-react"
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "../lib/utils"
import type { Message, ModelPreference, UploadState } from "../types"
import { ChatMessage } from "./ChatMessage"
import { StreamingMessage } from "./StreamingMessage"
import { ThinkingIndicator } from "./ThinkingIndicator"

interface ChatInterfaceProps {
  uploadState: UploadState
  messages: Message[]
  isLoading: boolean
  error: string | null
  onSend: (question: string, modelPreference: ModelPreference) => Promise<void>
}

const SUGGESTED_QUESTIONS = [
  { icon: Sparkles, text: "Summarize this document.", color: "#7C3AED" },
  { icon: FileSearch, text: "What are the key findings?", color: "#6366F1" },
  { icon: ListTree, text: "List the main topics covered.", color: "#8B5CF6" },
  { icon: BarChart3, text: "Are there any numbers or statistics I should know?", color: "#A78BFA" },
] as const

export function ChatInterface({ uploadState, messages, isLoading, error, onSend }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
  const [modelPreference, setModelPreference] = useState<ModelPreference>("fast")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const shouldReduce = useReducedMotion()

  const hasStreamingMessage = messages.some((message) => message.isStreaming && message.content.length > 0)
  const hasEmptyStreamingMessage = messages.some((message) => message.isStreaming && message.content.length === 0)
  const showThinking = isLoading && !hasStreamingMessage

  const welcomeMessage = useMemo<Message>(
    () => ({
      id: "welcome-message",
      role: "assistant",
      content: `I've read your PDF (${uploadState.pageCount ?? 0} pages, ${uploadState.chunkCount ?? 0} chunks indexed).\nAsk me anything - I'll answer from the document.`,
      isStreaming: false,
      timestamp: new Date(),
    }),
    [uploadState.chunkCount, uploadState.pageCount],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showThinking])

  function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
    const el = event.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 5 * 24)}px`
    setValue(el.value)
  }

  async function handleSend(nextValue = value) {
    const question = nextValue.trim()
    if (!question || isLoading) {
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

  const isEmpty = messages.length === 0
  const charPct = (value.length / 1000) * 100

  return (
    <section className="chat-workspace relative flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      <div className="chat-live-bg pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="chat-grid" />
        <div className="chat-scanline" />
        <div className="chat-energy chat-energy-a" />
        <div className="chat-energy chat-energy-b" />
      </div>

      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: -8 }}
        animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-center gap-3 border-b border-border/40 bg-surface/30 px-4 py-2 backdrop-blur-sm"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <BookOpen size={13} className="shrink-0 text-primary-light" aria-hidden="true" />
          <span className="min-w-0 truncate font-mono text-[11px] text-secondary">
            <span className="text-text">{uploadState.filename}</span>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-success">{uploadState.pageCount ?? 0} pages</span>
            <span className="mx-2 opacity-40">/</span>
            <span>{uploadState.chunkCount ?? 0} chunks</span>
          </span>
        </span>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
          style={{ animation: shouldReduce ? undefined : "success-ping 2s ease-out infinite" }}
          aria-hidden="true"
        />
      </motion.div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="relative z-10 flex flex-1 overflow-y-auto scroll-smooth px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
          {isEmpty ? (
            <>
              <ChatMessage message={welcomeMessage} />

              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 22 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col items-center justify-center gap-5 py-6"
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-secondary/60">Quick prompts</p>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map(({ icon: Icon, text, color }, idx) => (
                    <motion.button
                      key={text}
                      type="button"
                      onClick={() => handleSuggestion(text)}
                      disabled={isLoading}
                      initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
                      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.28 + idx * 0.08, duration: 0.3, ease: "easeOut" }}
                      whileHover={
                        shouldReduce || isLoading
                          ? undefined
                          : {
                              y: -5,
                              scale: 1.02,
                              boxShadow: `0 20px 48px ${color}33, 0 0 0 1px ${color}55`,
                            }
                      }
                      whileTap={shouldReduce ? undefined : { scale: 0.97 }}
                      className="suggestion-card group relative flex min-h-[80px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-border/80 bg-surface-raised/80 px-4 py-3.5 text-left text-sm font-medium text-secondary outline-none backdrop-blur-sm transition-colors duration-200 hover:text-text focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span
                        className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span
                        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-bg/80 transition-colors duration-200 group-hover:border-primary/50 group-hover:bg-primary/10"
                        style={{ color }}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="relative leading-5">{text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          ) : null}

          {messages.map((message) => {
            if (message.isStreaming && message.content.length > 0) {
              return <StreamingMessage key={message.id} content={message.content} isStreaming={message.isStreaming} />
            }

            if (message.isStreaming && message.content.length === 0) {
              return null
            }

            return <ChatMessage key={message.id} message={message} />
          })}

          {showThinking || hasEmptyStreamingMessage ? (
            <ThinkingIndicator
              label={modelPreference === "thinking" ? "Thinking more carefully..." : "Finding cited answer..."}
            />
          ) : null}

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start rounded-xl border border-error/40 bg-error/10 px-4 py-2.5 text-sm text-error backdrop-blur"
            >
              {error}
            </motion.p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 px-4 py-4 sm:px-6">
        <div
          className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/80 bg-bg/60 shadow-[0_-4px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300"
          style={
            isInputFocused
              ? { borderColor: "#7C3AED66", boxShadow: "0 0 0 1px #7C3AED44, 0 -4px 60px rgba(124,58,237,0.18)" }
              : undefined
          }
        >
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
              "w-full resize-none bg-transparent px-5 pb-3 pt-4 text-[15px] leading-6 text-text",
              "placeholder:text-secondary/50 outline-none",
              isLoading && "cursor-not-allowed opacity-50",
            )}
          />

          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="grid grid-cols-2 rounded-xl border border-border/70 bg-surface-raised/70 p-0.5"
                aria-label="Model preference"
              >
                {[
                  { value: "fast", label: "Fast", icon: Zap },
                  { value: "thinking", label: "Thinking", icon: Brain },
                ].map(({ value: option, label, icon: Icon }) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setModelPreference(option as ModelPreference)}
                    className={cn(
                      "inline-flex h-8 min-w-[82px] items-center justify-center gap-1.5 rounded-[0.65rem] px-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
                      modelPreference === option
                        ? "bg-primary text-white shadow-[0_0_18px_rgba(124,58,237,0.35)]"
                        : "text-secondary hover:text-text",
                    )}
                    aria-pressed={modelPreference === option}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${charPct}%`,
                    background: charPct > 90 ? "#EF4444" : "linear-gradient(90deg, #7C3AED, #A78BFA)",
                  }}
                />
              </div>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  value.length >= 950 ? "text-error" : "text-secondary/50",
                )}
              >
                {value.length}/1000
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[11px] text-secondary/40 sm:block">
                Enter send / Shift+Enter newline
              </span>
              <motion.button
                type="button"
                aria-label="Send message"
                disabled={isLoading || !value.trim()}
                onClick={() => void handleSend()}
                whileHover={
                  shouldReduce
                    ? undefined
                    : {
                        y: -2,
                        scale: 1.08,
                        boxShadow: "0 0 0 3px #7C3AED44, 0 8px 24px rgba(124,58,237,0.4)",
                      }
                }
                whileTap={shouldReduce ? undefined : { scale: 0.92 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-35",
                  value.trim() && !isLoading
                    ? "border-primary/30 bg-primary text-white shadow-[0_4px_20px_rgba(124,58,237,0.45)]"
                    : "border-border bg-surface-raised text-secondary",
                )}
              >
                <Send size={15} aria-hidden="true" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
