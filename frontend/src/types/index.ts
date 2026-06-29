export interface SourceChunk {
  text: string
  page_number: number
  chunk_index: number
}

export interface UploadResponse {
  session_id: string
  filename: string
  page_count: number
  chunk_count: number
  message: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: SourceChunk[]
  isStreaming: boolean
  timestamp: Date
}

export type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error"

export interface UploadState {
  status: UploadStatus
  sessionId: string | null
  filename: string | null
  pageCount: number | null
  chunkCount: number | null
  error: string | null
}

export interface SSETokenMessage {
  token: string
}

export interface SSEDoneMessage {
  done: true
  sources: SourceChunk[]
}

export type SSEMessage = SSETokenMessage | SSEDoneMessage
