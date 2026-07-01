import { useCallback, useRef, useState } from "react"

import { APIError, getUploadStatus, uploadPDF } from "../lib/api"
import type { UploadState, UploadStatusResponse } from "../types"

const idleState: UploadState = {
  status: "idle",
  jobId: null,
  sessionId: null,
  filename: null,
  pageCount: null,
  chunkCount: null,
  stage: null,
  progress: null,
  message: null,
  error: null,
}

function errorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Upload failed."
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function processingState(status: UploadStatusResponse): UploadState {
  return {
    status: "processing",
    jobId: status.job_id,
    sessionId: null,
    filename: status.filename,
    pageCount: status.page_count,
    chunkCount: status.chunk_count,
    stage: status.status,
    progress: status.progress,
    message: status.message,
    error: null,
  }
}

export function useUpload(): {
  state: UploadState
  uploadFile: (file: File) => Promise<void>
  reset: () => void
} {
  const [state, setState] = useState<UploadState>(idleState)
  const activeJobRef = useRef<string | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    activeJobRef.current = null
    setState({
      ...idleState,
      status: "uploading",
      filename: file.name,
      stage: "queued",
      progress: 0,
      message: "Uploading PDF...",
    })

    try {
      const response = await uploadPDF(file)
      activeJobRef.current = response.job_id
      setState((current) => ({
        ...current,
        status: "processing",
        jobId: response.job_id,
        stage: response.status,
        progress: Math.max(current.progress ?? 0, 3),
        message: response.message,
        error: null,
      }))

      while (activeJobRef.current === response.job_id) {
        const status = await getUploadStatus(response.job_id)

        if (activeJobRef.current !== response.job_id) {
          return
        }

        if (status.status === "ready" && status.session_id) {
          setState({
            status: "ready",
            jobId: status.job_id,
            sessionId: status.session_id,
            filename: status.filename,
            pageCount: status.page_count,
            chunkCount: status.chunk_count,
            stage: status.status,
            progress: 100,
            message: status.message,
            error: null,
          })
          activeJobRef.current = null
          return
        }

        if (status.status === "error") {
          setState({
            ...processingState(status),
            status: "error",
            error: status.error ?? status.message,
          })
          activeJobRef.current = null
          return
        }

        setState(processingState(status))
        await wait(1500)
      }
    } catch (error) {
      activeJobRef.current = null
      setState({
        ...idleState,
        status: "error",
        filename: file.name,
        error: errorMessage(error),
      })
    }
  }, [])

  const reset = useCallback(() => {
    activeJobRef.current = null
    setState(idleState)
  }, [])

  return { state, uploadFile, reset }
}
