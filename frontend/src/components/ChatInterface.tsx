import { motion, useReducedMotion } from "framer-motion"
import { Send } from "lucide-react"
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

export function ChatInterface({ uploadState, messages, isLoading, error, onSend }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
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

  async function handleSend() {
    const question = value.trim()

    if (!question || isLoading) {
      return
    }

    setValue("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await onSend(question)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <section className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        {messages.length === 0 ? <ChatMessage message={welcomeMessage} /> : null}

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

      <div className="border-t border-border p-4">
        <label htmlFor="chat-question" className="sr-only">
          Ask a question about your PDF
        </label>
        <div className="flex items-end gap-3">
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
            className={cn(
              "min-h-12 flex-1 resize-none rounded-xl bg-surface-raised px-4 py-3 text-sm text-text",
              "placeholder:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isLoading && "cursor-not-allowed opacity-50",
            )}
          />
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
