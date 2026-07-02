import { motion, useReducedMotion } from "framer-motion"
import { BarChart3, BookOpen, FileSearch, ListTree, Send, Sparkles } from "lucide-react"
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"

import { accentAt } from "../lib/designSystem"
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
  { icon: Sparkles, text: "Summarize this document.", color: "#FF3AF2" },
  { icon: FileSearch, text: "What are the key findings?", color: "#00F5D4" },
  { icon: ListTree, text: "List the main topics covered.", color: "#FFE600" },
  { icon: BarChart3, text: "Are there any numbers or statistics I should know?", color: "#FF6B35" },
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
      content: `I've read your PDF (${uploadState.pageCount ?? 0} pages, ${uploadState.chunkCount ?? 0} chunks indexed).\nSelected model: ${activeModel?.label ?? "Private Extractive"}. Ask me anything - I'll answer from the document.`,
      isStreaming: false,
      timestamp: new Date(),
    }),
    [activeModel?.label, uploadState.chunkCount, uploadState.pageCount],
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
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-center gap-3 border-b-4 border-[#FF3AF2] bg-[#0D0D1A]/70 px-4 py-2 backdrop-blur-sm"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <BookOpen size={13} className="shrink-0 text-[#FFE600]" aria-hidden="true" />
          <span className="min-w-0 truncate font-mono text-[11px] font-bold text-[#DCD7FF]">
            <span className="text-white">{uploadState.filename}</span>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-[#00F5D4]">{uploadState.pageCount ?? 0} pages</span>
            <span className="mx-2 opacity-40">/</span>
            <span>{uploadState.chunkCount ?? 0} chunks</span>
          </span>
        </span>
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#00F5D4]"
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
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
          {isEmpty ? (
            <>
              <ChatMessage message={welcomeMessage} />

              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 22 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col items-center justify-center gap-5 py-6"
              >
                <p className="rounded-full border-4 border-[#FFE600] bg-[#0D0D1A] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-widest text-white shadow-[5px_5px_0_#FF3AF2]">Quick prompts</p>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map(({ icon: Icon, text, color }, idx) => (
                    <motion.button
                      key={text}
                      type="button"
                      onClick={() => handleSuggestion(text)}
                      disabled={isLoading || !selectedModelAvailable}
                      initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
                      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.28 + idx * 0.08, duration: 0.3, ease: "easeOut" }}
                      whileHover={
                        shouldReduce || isLoading || !selectedModelAvailable
                          ? undefined
                          : {
                              y: -5,
                              scale: 1.02,
                              boxShadow: `0 0 34px ${color}66, 7px 7px 0 ${accentAt(idx + 1)}`,
                            }
                      }
                      whileTap={shouldReduce ? undefined : { scale: 0.97 }}
                      className="suggestion-card group relative flex min-h-[86px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-4 bg-[#0D0D1A]/88 px-4 py-3.5 text-left text-sm font-black text-white outline-none backdrop-blur-sm transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-[#FFE600] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: color, boxShadow: `5px 5px 0 ${accentAt(idx + 1)}` }}
                    >
                      <span
                        className="pointer-events-none absolute -left-3 -top-3 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span
                        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border-4 border-white bg-[#2D1B4E] transition-colors duration-200 group-hover:bg-[#0D0D1A]"
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
              className="self-start rounded-xl border-4 border-[#EF4444] bg-[#0D0D1A] px-4 py-2.5 text-sm font-bold text-[#FCA5A5] shadow-[5px_5px_0_#FF3AF2] backdrop-blur"
            >
              {error}
            </motion.p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 px-4 py-4 sm:px-6">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl border-4 border-[#00F5D4] bg-[#0D0D1A]/88 shadow-[0_0_34px_rgba(0,245,212,0.34),8px_8px_0_#FF3AF2] backdrop-blur-xl transition-all duration-300"
          style={
            isInputFocused
              ? { borderColor: "#FFE600", boxShadow: "0 0 0 4px rgba(255,58,242,0.34), 10px 10px 0 #00F5D4, 0 -4px 64px rgba(255,230,0,0.2)" }
              : undefined
          }
        >
          <div className="border-b-4 border-[#FF3AF2] px-3 py-3">
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
              "w-full resize-none bg-transparent px-5 pb-3 pt-4 text-[15px] font-semibold leading-6 text-white",
              "placeholder:text-[#DCD7FF]/52 outline-none",
              isLoading && "cursor-not-allowed opacity-50",
            )}
          />

          <div className="flex items-center justify-between border-t-4 border-[#2D1B4E] px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-2 w-20 overflow-hidden rounded-full border border-white/20 bg-[#2D1B4E]">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${charPct}%`,
                    background: charPct > 90 ? "#EF4444" : "linear-gradient(90deg, #FF3AF2, #FFE600, #00F5D4)",
                  }}
                />
              </div>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  value.length >= 950 ? "text-[#FCA5A5]" : "text-[#DCD7FF]/64",
                )}
              >
                {value.length}/1000
              </span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                aria-label="Send message"
                disabled={isLoading || !value.trim() || !selectedModelAvailable}
                onClick={() => void handleSend()}
                whileHover={
                  shouldReduce
                    ? undefined
                    : {
                        y: -2,
                        scale: 1.08,
                        boxShadow: "0 0 0 4px rgba(255,230,0,0.36), 5px 5px 0 #00F5D4",
                      }
                }
                whileTap={shouldReduce ? undefined : { scale: 0.92 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-4 outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#FFE600] disabled:cursor-not-allowed disabled:opacity-35",
                  value.trim() && !isLoading && selectedModelAvailable
                    ? "border-[#FFE600] bg-[#FF3AF2] text-white shadow-[4px_4px_0_#00F5D4]"
                    : "border-white/16 bg-[#2D1B4E] text-[#DCD7FF]",
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
