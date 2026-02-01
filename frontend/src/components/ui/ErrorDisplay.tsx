import { useState } from 'react'

/**
 * Error types supported by the ErrorDisplay component
 */
export type ErrorType = 'error' | 'warning' | 'info'

/**
 * Props for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /** The error type determines the color scheme */
  type?: ErrorType
  /** Main error title/heading */
  title?: string
  /** Detailed error message */
  message: string
  /** Error code from backend (e.g., "URL_NOT_FOUND") */
  code?: string
  /** Whether to show a retry button */
  showRetry?: boolean
  /** Callback when retry button is clicked */
  onRetry?: () => void
  /** Whether to show a dismiss button */
  showDismiss?: boolean
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Get styles based on error type following Digital Brutalist design
 */
const getTypeStyles = (type: ErrorType) => {
  const styles = {
    error: {
      border: 'border-[#ff3333]',
      bg: 'bg-[#1a1a1a]',
      accent: 'text-[#ff3333]',
      icon: '✕',
      iconBg: 'bg-[#ff3333]/10'
    },
    warning: {
      border: 'border-[#ffaa00]',
      bg: 'bg-[#1a1a1a]',
      accent: 'text-[#ffaa00]',
      icon: '⚠',
      iconBg: 'bg-[#ffaa00]/10'
    },
    info: {
      border: 'border-[#d4ff00]',
      bg: 'bg-[#1a1a1a]',
      accent: 'text-[#d4ff00]',
      icon: 'ℹ',
      iconBg: 'bg-[#d4ff00]/10'
    }
  }
  return styles[type]
}

/**
 * ErrorDisplay Component
 * 
 * A reusable error display component with Digital Brutalist styling.
 * Supports different error types, retry functionality, and dismissal.
 */
export function ErrorDisplay({
  type = 'error',
  title,
  message,
  code,
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  className = ''
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const styles = getTypeStyles(type)

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div
      className={`
        ${styles.bg} ${styles.border}
        border-3 p-4
        font-mono
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className={`
          ${styles.iconBg} ${styles.accent}
          w-8 h-8 flex items-center justify-center
          border-3 ${styles.border}
          text-lg font-bold shrink-0
        `}>
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <h3 className={`${styles.accent} text-base font-bold uppercase tracking-wider mb-1`}>
              {title}
            </h3>
          )}

          {/* Error Code Badge */}
          {code && (
            <span className={`
              inline-block px-2 py-0.5 mb-2
              text-xs ${styles.accent} ${styles.border}
              border bg-[#0a0a0a]
              font-mono tracking-wider
            `}>
              {code}
            </span>
          )}

          {/* Message */}
          <p className="text-[#f5f5f0] text-sm leading-relaxed break-words">
            {message}
          </p>

          {/* Action Buttons */}
          {(showRetry || showDismiss) && (
            <div className="flex gap-2 mt-4">
              {showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={`
                    px-4 py-2 text-sm font-bold uppercase tracking-wider
                    bg-[#0a0a0a] ${styles.accent} ${styles.border}
                    border-3 cursor-pointer
                    transition-all duration-100
                    hover:bg-[#2a2a2a] hover:translate-x-0.5 hover:-translate-y-0.5
                    active:translate-x-0 active:translate-y-0
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:hover:translate-x-0 disabled:hover:translate-y-0
                  `}
                >
                  {isRetrying ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">↻</span>
                      Retrying...
                    </span>
                  ) : (
                    '↻ Retry'
                  )}
                </button>
              )}

              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`
                    px-4 py-2 text-sm font-bold uppercase tracking-wider
                    bg-[#0a0a0a] text-[#888] border-[#444]
                    border-3 cursor-pointer
                    transition-all duration-100
                    hover:bg-[#2a2a2a] hover:text-[#f5f5f0]
                    hover:translate-x-0.5 hover:-translate-y-0.5
                    active:translate-x-0 active:translate-y-0
                  `}
                >
                  ✕ Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {/* Close button (top right) */}
        {showDismiss && onDismiss && !showRetry && (
          <button
            onClick={onDismiss}
            className={`
              w-8 h-8 flex items-center justify-center
              text-[#666] hover:text-[#ff3333]
              transition-colors cursor-pointer shrink-0
            `}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact inline error message for form fields
 */
export interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <p className={`
      text-[#ff3333] text-xs font-mono mt-1
      flex items-center gap-1
      ${className}
    `}>
      <span className="text-[10px]">✕</span>
      {message}
    </p>
  )
}

/**
 * Error boundary fallback component
 */
export interface ErrorFallbackProps {
  error: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8">
      <ErrorDisplay
        type="error"
        title="Something went wrong"
        message={error.message || 'An unexpected error occurred'}
        showRetry={!!resetError}
        onRetry={resetError}
      />
    </div>
  )
}
