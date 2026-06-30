import { motion, useReducedMotion } from "framer-motion"
import { BarChart3, FileSearch, ListTree, Send, Sparkles } from "lucide-react"
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "../lib/utils"
import type { Message, UploadState } from "../types"
import { ChatMessage } from "./ChatMessage"
import { StreamingMessage } from "./StreamingMessage"
import { ThinkingIndicator } from "./ThinkingIndicator"

interface ChatInterfaceProps {
  uploadState: UploadState
  messages: Message[]
  isLoading: boolean
  error: string | null
  onSend: (question: string) => Promise<void>
}

const SUGGESTED_QUESTIONS = [
  { icon: Sparkles, text: "Summarize this document." },
  { icon: FileSearch, text: "What are the key findings?" },
  { icon: ListTree, text: "List the main topics covered." },
  { icon: BarChart3, text: "Are there any numbers or statistics I should know?" },
] as const

export function ChatInterface({ uploadState, messages, isLoading, error, onSend }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const shouldReduce = useReducedMotion()
  const hasStreamingMessage = messages.some((msg) => msg.isStreaming && msg.content.length > 0)
  const hasEmptyStreamingMessage = messages.some((msg) => msg.isStreaming && msg.content.length === 0)
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

    await onSend(question)
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

  return (
    <section className="chat-workspace relative flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      <div className="chat-live-bg pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="chat-grid" />
        <div className="chat-scanline" />
        <div className="chat-energy chat-energy-a" />
        <div className="chat-energy chat-energy-b" />
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="relative z-10 flex flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
          {messages.length === 0 ? (
            <>
              <ChatMessage message={welcomeMessage} />
              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 18 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 items-center justify-center py-8"
              >
                <div className="w-full max-w-2xl">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }, idx) => (
                      <motion.button
                        key={text}
                        type="button"
                        onClick={() => handleSuggestion(text)}
                        disabled={isLoading}
                        initial={shouldReduce ? false : { opacity: 0, y: 12 }}
                        animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                        transition={{ delay: 0.24 + idx * 0.08, duration: 0.26, ease: "easeOut" }}
                        whileHover={
                          shouldReduce || isLoading
                            ? undefined
                            : {
                                y: -4,
                                borderColor: "#7C3AED",
                                boxShadow: "0 18px 44px rgba(124,58,237,0.22)",
                              }
                        }
                        whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                        className="group flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-surface-raised/90 px-4 py-3 text-left text-sm font-medium text-secondary outline-none backdrop-blur transition-colors duration-200 hover:text-text focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary-light transition-colors duration-200 group-hover:border-primary/60 group-hover:bg-primary/15">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <span className="leading-5">{text}</span>
                      </motion.button>
                    ))}
                  </div>
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

          {showThinking || hasEmptyStreamingMessage ? <ThinkingIndicator /> : null}
          {error ? <p className="self-start rounded-lg border border-error/50 px-3 py-2 text-sm text-error">{error}</p> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 border-t border-border/80 bg-bg/72 px-4 py-4 shadow-[0_-18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6">
        <label htmlFor="chat-question" className="sr-only">
          Ask a question about your PDF
        </label>
        <div className="mx-auto flex max-w-5xl items-end gap-3">
          <div className="relative flex-1">
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
              style={{
                borderColor: isInputFocused ? "#7C3AED" : undefined,
                boxShadow: isInputFocused ? "0 0 0 3px rgba(124,58,237,0.2), 0 12px 36px rgba(124,58,237,0.12)" : undefined,
              }}
              className={cn(
                "min-h-14 w-full resize-none rounded-2xl border border-border bg-surface-raised/95 px-5 py-4 pr-24 text-[15px] leading-6 text-text shadow-[0_12px_40px_rgba(0,0,0,0.22)]",
                "placeholder:text-secondary outline-none transition-all duration-200",
                isLoading && "cursor-not-allowed opacity-50",
              )}
            />
            <span
              className={cn(
                "pointer-events-none absolute bottom-3 right-4 font-mono text-xs text-secondary",
                value.length >= 950 && "text-error",
              )}
            >
              {value.length}/1000
            </span>
          </div>
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
                    rotate: 5,
                    boxShadow: "0 0 0 3px #7C3AED33, 0 6px 16px rgba(124,58,237,0.35)",
                    background: "#7C3AED",
                    color: "#fff",
                  }
            }
            whileTap={shouldReduce ? undefined : { scale: 0.94, rotate: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            style={{
              backgroundColor: value.trim() && !isLoading ? "#7C3AED" : undefined,
              color: value.trim() && !isLoading ? "#FFFFFF" : undefined,
            }}
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40",
              value.trim() && !isLoading
                ? "bg-primary text-white shadow-[0_14px_40px_rgba(124,58,237,0.35)]"
                : "bg-surface-raised text-secondary shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
            )}
          >
            <Send size={18} aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
