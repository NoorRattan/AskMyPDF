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
        <div className="flex min-h-screen items-center justify-center bg-bg p-8">
          <div className="max-w-md text-center">
            <p className="mb-2 font-medium text-error">Something went wrong</p>
            <p className="mb-4 text-sm text-secondary">{this.state.error?.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded text-sm text-primary-light hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
