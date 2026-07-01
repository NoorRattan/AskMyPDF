export interface SourceChunk {
  text: string
  page_number: number
  chunk_index: number
}

export type UploadJobStatus = "queued" | "extracting" | "chunking" | "embedding" | "ready" | "error"
export type ModelPreference = "fast" | "thinking"

export interface UploadJobResponse {
  job_id: string
  status: UploadJobStatus
  message: string
}

export interface UploadStatusResponse {
  job_id: string
  status: UploadJobStatus
  stage: string
  message: string
  progress: number
  filename: string
  page_count: number | null
  chunk_count: number | null
  session_id: string | null
  error: string | null
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: SourceChunk[]
  modelUsed?: string
  providerUsed?: string
  isStreaming: boolean
  timestamp: Date
}

export type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error"

export interface UploadState {
  status: UploadStatus
  jobId: string | null
  sessionId: string | null
  filename: string | null
  pageCount: number | null
  chunkCount: number | null
  stage: UploadJobStatus | null
  progress: number | null
  message: string | null
  error: string | null
}

export interface SSETokenMessage {
  token: string
}

export interface SSEDoneMessage {
  done: true
  sources: SourceChunk[]
  model_used: string
  provider_used: string
}

export type SSEMessage = SSETokenMessage | SSEDoneMessage
