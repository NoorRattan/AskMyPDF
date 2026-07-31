import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, BarChart3, BookOpen, FileSearch, ListTree, Send, Sparkles } from "lucide-react"
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"

import { saveCitedAnswer } from "../lib/api"
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

const prompts = [
  { icon: Sparkles, text: "Give me the executive summary." },
  { icon: FileSearch, text: "What are the key findings?" },
  { icon: ListTree, text: "Outline the main themes." },
  { icon: BarChart3, text: "Which numbers are worth noting?" },
] as const

export function ChatInterface({ uploadState, messages, isLoading, error, modelPreference, onModelPreferenceChange, availableModels, onSend }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
  const [saveError, setSaveError] = useState<string | null>(null)
  const shouldReduce = useReducedMotion()
  const activeModel = useMemo(() => normalizeModels(availableModels).find((model) => model.id === modelPreference), [availableModels, modelPreference])
  const canSend = !isLoading && Boolean(activeModel?.available ?? true)
  const streaming = messages.find((message) => message.isStreaming)
  const isEmpty = messages.length === 0

  const welcomeMessage = useMemo<Message>(() => ({
    id: "welcome-message",
    role: "assistant",
    content: `Your document is ready. I indexed ${uploadState.pageCount ?? 0} pages into ${uploadState.chunkCount ?? 0} retrievable passages. What would you like to understand?`,
    isStreaming: false,
    timestamp: new Date(),
  }), [uploadState.chunkCount, uploadState.pageCount])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])
  useEffect(() => { setSavingIds(new Set()); setSavedIds(new Set()); setSaveError(null) }, [uploadState.sessionId])

  function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
    const input = event.target
    input.style.height = "auto"
    input.style.height = `${Math.min(input.scrollHeight, 124)}px`
    setValue(input.value)
  }

  async function send(next = value) {
    const question = next.trim()
    if (!question || !canSend) return
    setValue("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    await onSend(question, modelPreference)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send() }
  }

  function previousQuestion(index: number) {
    for (let current = index - 1; current >= 0; current -= 1) if (messages[current]?.role === "user") return messages[current].content
    return "Saved cited answer"
  }

  async function saveMessage(message: Message, index: number) {
    if (!uploadState.sessionId || !message.sources?.length || savedIds.has(message.id)) return
    setSavingIds((current) => new Set(current).add(message.id))
    setSaveError(null)
    try {
      await saveCitedAnswer({ session_id: uploadState.sessionId, question: previousQuestion(index), answer: message.content, sources: message.sources, model_used: message.modelUsed, provider_used: message.providerUsed, mode_used: message.modeUsed })
      setSavedIds((current) => new Set(current).add(message.id))
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Could not save this cited answer.")
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(message.id); return next })
    }
  }

  return (
    <section className="chat-workspace">
      <div className="chat-live-bg" aria-hidden="true"><div className="chat-grid" /></div>
      <div className="chat-document-bar">
        <span className="document-bar-icon"><BookOpen size={14} aria-hidden="true" /></span>
        <p><strong>{uploadState.filename}</strong><span>·</span>{uploadState.pageCount ?? 0} pages<span>·</span>{uploadState.chunkCount ?? 0} passages</p>
        <span className="document-ready">Ready</span>
      </div>

      <div role="log" aria-live="polite" aria-label="Chat messages" className="chat-scroll">
        <div className="chat-column">
          {isEmpty ? (
            <>
              <ChatMessage message={welcomeMessage} />
              <motion.div initial={shouldReduce ? false : { opacity: 0, y: 14 }} animate={shouldReduce ? undefined : { opacity: 1, y: 0 }} transition={{ delay: .12, duration: .45 }} className="prompt-area">
                <p>Start somewhere specific</p>
                <div className="prompt-list">
                  {prompts.map(({ icon: Icon, text }, index) => (
                    <motion.button key={text} type="button" disabled={!canSend} onClick={() => void send(text)} whileHover={shouldReduce || !canSend ? undefined : { x: 4 }} whileTap={shouldReduce ? undefined : { scale: .99 }} transition={{ delay: index * .05 }}>
                      <Icon size={15} aria-hidden="true" /><span>{text}</span><ArrowUpRight size={14} aria-hidden="true" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          ) : messages.map((message, index) => message.isStreaming ? <StreamingMessage key={message.id} content={message.content} isStreaming /> : <ChatMessage key={message.id} message={message} onSave={() => void saveMessage(message, index)} isSaving={savingIds.has(message.id)} isSaved={savedIds.has(message.id)} />)}
          {isLoading && !streaming ? <ThinkingIndicator label={activeModel?.label ? `${activeModel.label} is reading` : "Reading the document"} /> : null}
          {error ? <p className="chat-error" role="alert">{error}</p> : null}
          {saveError ? <p className="chat-error" role="alert">{saveError}</p> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer-model"><ModelSelector compact value={modelPreference} onChange={onModelPreferenceChange} models={availableModels} disabled={isLoading} /></div>
        <div className="composer-shell">
          <textarea ref={textareaRef} value={value} onChange={handleInput} onKeyDown={onKeyDown} disabled={!canSend} rows={1} placeholder={canSend ? "Ask about this document…" : "This route is currently unavailable"} aria-label="Ask a question about this document" />
          <button type="button" onClick={() => void send()} disabled={!value.trim() || !canSend} aria-label="Send message"><Send size={17} aria-hidden="true" /></button>
        </div>
        <p className="composer-note">Enter to send <span>·</span> Shift + Enter for a new line <span>·</span> Answers cite the document context</p>
      </div>
    </section>
  )
}
