'use client'

import React from 'react'
import { Button } from './ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className="max-w-md w-full bg-white dark:bg-black rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-[#F1592A] mb-4">Oops! Something went wrong</h2>
            <p className="text-[#232120] dark:text-[#E7E7E8] mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#F1592A] text-white hover:bg-[#E7E7E8] hover:text-[#F1592A] w-full"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 