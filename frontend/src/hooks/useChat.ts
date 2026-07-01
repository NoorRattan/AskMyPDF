import { useCallback, useState } from "react"

import { APIError, streamChat } from "../lib/api"
import type { Message, ModelPreference, SSEMessage, SourceChunk } from "../types"

function newMessage(role: Message["role"], content: string, isStreaming: boolean): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    isStreaming,
    timestamp: new Date(),
  }
}

function appendToken(id: string, token: string) {
  return (msg: Message): Message => (msg.id === id ? { ...msg, content: msg.content + token } : msg)
}

function finishMessage(id: string, sources: SourceChunk[], modelUsed?: string, providerUsed?: string) {
  return (msg: Message): Message =>
    msg.id === id ? { ...msg, isStreaming: false, sources, modelUsed, providerUsed } : msg
}

function failMessage(id: string, content: string) {
  return (msg: Message): Message => (msg.id === id ? { ...msg, content, isStreaming: false } : msg)
}

function errorText(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Failed to stream response."
}

export function useChat(sessionId: string | null): {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (question: string, modelPreference?: ModelPreference) => Promise<void>
  clearChat: () => void
} {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (question: string, modelPreference: ModelPreference = "fast") => {
      if (!sessionId || isLoading) {
        return
      }

      const userMessage = newMessage("user", question, false)
      const assistantMessage = newMessage("assistant", "", true)

      setMessages((current) => [...current, userMessage, assistantMessage])
      setIsLoading(true)
      setError(null)

      try {
        const res = await streamChat(sessionId, question, modelPreference)
        const reader = res.body?.getReader()

        if (!reader) {
          throw new Error("Streaming response body is unavailable.")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            if (!part.startsWith("data: ")) {
              continue
            }

            const msg = JSON.parse(part.slice(6)) as SSEMessage

            if ("token" in msg) {
              setMessages((current) => current.map(appendToken(assistantMessage.id, msg.token)))
            } else if (msg.done) {
              setMessages((current) =>
                current.map(finishMessage(assistantMessage.id, msg.sources, msg.model_used, msg.provider_used)),
              )
            }
          }
        }
      } catch (err) {
        const msg = errorText(err)
        setError(msg)
        setMessages((current) => current.map(failMessage(assistantMessage.id, msg)))
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId],
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
