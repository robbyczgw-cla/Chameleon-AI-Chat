'use client'

import React, { Component, ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Native Error Boundary
 * Catches React errors and provides recovery options
 * Includes native-specific error handling and reporting
 */
export class NativeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Log error details
    console.error('[NativeErrorBoundary] Error caught:', error)
    console.error('[NativeErrorBoundary] Component stack:', errorInfo.componentStack)

    // Report to native layer if available
    this.reportErrorToNative(error, errorInfo)
  }

  private async reportErrorToNative(error: Error, errorInfo: React.ErrorInfo) {
    if (!Capacitor.isNativePlatform()) return

    try {
      // Store error for crash reporting
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        platform: Capacitor.getPlatform(),
      }

      // Store in preferences for later analysis
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: 'crash_logs' })
      const logs = value ? JSON.parse(value) : []
      logs.push(errorData)

      // Keep only last 10 errors
      const recentLogs = logs.slice(-10)
      await Preferences.set({
        key: 'crash_logs',
        value: JSON.stringify(recentLogs),
      })
    } catch (e) {
      console.error('[NativeErrorBoundary] Failed to report error:', e)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleClearAndReload = async () => {
    try {
      // Clear potentially corrupted data
      localStorage.removeItem('chameleon-chats')
      sessionStorage.clear()

      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.remove({ key: 'chameleon-chats' })
      }

      window.location.reload()
    } catch {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            backgroundColor: '#0a0a0a',
            color: '#fafafa',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}
          >
            :(
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#a1a1aa',
              marginBottom: '24px',
              maxWidth: '400px',
            }}
          >
            The app encountered an unexpected error. This has been logged for investigation.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '300px',
            }}
          >
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#22c55e',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                padding: '12px 24px',
                backgroundColor: '#262626',
                color: '#fafafa',
                border: '1px solid #404040',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>

            <button
              onClick={this.handleClearAndReload}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#a1a1aa',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear Cache & Reload
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#1f1f1f',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '600px',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#ef4444',
                  marginBottom: '8px',
                }}
              >
                Error Details (Dev Only)
              </summary>
              <pre
                style={{
                  fontSize: '12px',
                  color: '#a1a1aa',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default NativeErrorBoundary
