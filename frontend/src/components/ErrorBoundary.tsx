import React from "react"

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-danger/30 bg-danger/10">
              <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M5.25 18.75h13.5a2.25 2.25 0 001.928-3.395L13.428 4.5a2.25 2.25 0 00-3.856 0L3.322 15.355A2.25 2.25 0 005.25 18.75z" />
              </svg>
            </div>
            <p className="mb-2 text-lg font-semibold text-ink-100">Something went wrong</p>
            <p className="mb-6 text-sm text-ink-400">{this.state.error?.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-2 text-sm font-medium text-ink-200 transition hover:bg-ink-700"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
