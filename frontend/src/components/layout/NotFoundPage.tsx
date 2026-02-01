import { useEffect, useState } from 'react'

/**
 * Props for the NotFoundPage component
 */
export interface NotFoundPageProps {
  /** Custom message to display */
  message?: string
  /** Whether this is for an expired URL */
  isExpired?: boolean
  /** The short code that was not found (if applicable) */
  shortCode?: string
}

/**
 * Glitch text effect component
 */
function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span 
      className={`relative inline-block ${className}`}
      data-text={text}
      style={{
        animation: 'glitch 2s infinite'
      }}
    >
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-[#ff3333] z-0"
        style={{
          animation: 'glitch-1 0.3s infinite linear alternate-reverse',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)'
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-[#d4ff00] z-0"
        style={{
          animation: 'glitch-2 0.3s infinite linear alternate-reverse',
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)'
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  )
}

/**
 * NotFoundPage Component
 * 
 * A 404 error page with Digital Brutalist styling and glitch effects.
 * Can also be used for expired URLs (410 status).
 */
export function NotFoundPage({ 
  message, 
  isExpired = false,
  shortCode 
}: NotFoundPageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const errorCode = isExpired ? '410' : '404'
  const defaultMessage = isExpired 
    ? 'This link has expired and is no longer accessible'
    : 'The page you\'re looking for doesn\'t exist or has been moved'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-mono">
      {/* Inject glitch animation styles */}
      <style>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes glitch-1 {
          0% { transform: translate(0); }
          100% { transform: translate(-3px, 1px); }
        }
        
        @keyframes glitch-2 {
          0% { transform: translate(0); }
          100% { transform: translate(3px, -1px); }
        }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
          75% { opacity: 0.9; }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Scanline overlay effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        style={{ mixBlendMode: 'overlay' }}
      >
        <div 
          className="w-full h-1 bg-[#d4ff00]/5"
          style={{ animation: 'scanline 4s linear infinite' }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div 
          className={`
            max-w-2xl w-full text-center
            transform transition-all duration-500
            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          {/* Error code display */}
          <div className="mb-8">
            <h1 
              className="text-[8rem] sm:text-[12rem] md:text-[16rem] font-bold leading-none select-none"
              style={{ 
                animation: 'flicker 3s infinite',
                textShadow: `
                  0 0 10px ${isExpired ? '#ff3333' : '#d4ff00'},
                  0 0 20px ${isExpired ? '#ff3333' : '#d4ff00'},
                  0 0 40px ${isExpired ? '#ff333366' : '#d4ff0066'}
                `
              }}
            >
              <GlitchText 
                text={errorCode} 
                className={isExpired ? 'text-[#ff3333]' : 'text-[#d4ff00]'}
              />
            </h1>
          </div>

          {/* Error message card */}
          <div className={`
            bg-[#1a1a1a] border-3 p-6 sm:p-8 mb-8
            ${isExpired ? 'border-[#ff3333]' : 'border-[#d4ff00]'}
          `}>
            {/* Status badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`
                inline-block w-2 h-2 
                ${isExpired ? 'bg-[#ff3333]' : 'bg-[#d4ff00]'}
              `}
                style={{ animation: 'blink 1s infinite' }}
              />
              <span className={`
                text-xs uppercase tracking-[0.3em] font-bold
                ${isExpired ? 'text-[#ff3333]' : 'text-[#d4ff00]'}
              `}>
                {isExpired ? 'Link Expired' : 'Not Found'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-[#f5f5f0] text-xl sm:text-2xl font-bold uppercase tracking-wider mb-4">
              {isExpired ? 'This Link Has Expired' : 'Page Not Found'}
            </h2>

            {/* Message */}
            <p className="text-[#888] text-sm sm:text-base mb-6 leading-relaxed">
              {message || defaultMessage}
            </p>

            {/* Short code display (if provided) */}
            {shortCode && (
              <div className="mb-6 p-3 bg-[#0a0a0a] border-3 border-[#333]">
                <span className="text-[#666] text-xs uppercase tracking-wider">
                  Requested URL:
                </span>
                <code className={`
                  block mt-1 text-sm
                  ${isExpired ? 'text-[#ff3333]' : 'text-[#d4ff00]'}
                `}>
                  /{shortCode}
                </code>
              </div>
            )}

            {/* Decorative terminal-style text */}
            <div className="text-left p-3 bg-[#0a0a0a] border border-[#333] mb-6">
              <code className="text-xs text-[#666] block">
                <span className="text-[#d4ff00]">$</span> curl -I /{shortCode || 'unknown'}
              </code>
              <code className="text-xs text-[#666] block mt-1">
                HTTP/1.1 {errorCode} {isExpired ? 'Gone' : 'Not Found'}
              </code>
              <code className="text-xs text-[#ff3333] block mt-1">
                Error: {isExpired ? 'URL_EXPIRED' : 'URL_NOT_FOUND'}
              </code>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className={`
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 text-sm font-bold uppercase tracking-wider
                  bg-[#d4ff00] text-[#0a0a0a]
                  border-3 border-[#d4ff00]
                  cursor-pointer no-underline
                  transition-all duration-100
                  hover:bg-[#e5ff4d] hover:translate-x-0.5 hover:-translate-y-0.5
                  hover:shadow-[4px_4px_0_0_#d4ff0066]
                  active:translate-x-0 active:translate-y-0 active:shadow-none
                `}
              >
                <span>←</span>
                <span>Back to Home</span>
              </a>

              <button
                onClick={() => window.history.back()}
                className={`
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 text-sm font-bold uppercase tracking-wider
                  bg-[#0a0a0a] text-[#f5f5f0]
                  border-3 border-[#444]
                  cursor-pointer
                  transition-all duration-100
                  hover:bg-[#1a1a1a] hover:border-[#666] hover:translate-x-0.5 hover:-translate-y-0.5
                  active:translate-x-0 active:translate-y-0
                `}
              >
                <span>↩</span>
                <span>Go Back</span>
              </button>
            </div>
          </div>

          {/* ASCII art decoration */}
          <pre className="text-[#333] text-[6px] sm:text-[8px] leading-tight select-none hidden sm:block">
{`
    ██████╗ ██╗  ██╗██╗  ██╗
    ██╔═══██╗██║  ██║██║  ██║
    ██║   ██║███████║███████║
    ██║   ██║╚════██║╚════██║
    ╚██████╔╝     ██║     ██║
     ╚═════╝      ╚═╝     ╚═╝
`}
          </pre>

          {/* Help text */}
          <p className="text-[#444] text-xs mt-4">
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@example.com" 
              className="text-[#d4ff00] hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center border-t-3 border-[#1a1a1a]">
        <p className="text-[#444] text-xs uppercase tracking-wider">
          URL Shortener • Error {errorCode}
        </p>
      </footer>
    </div>
  )
}

/**
 * ExpiredPage - Convenience wrapper for expired URLs
 */
export function ExpiredPage({ shortCode, message }: { shortCode?: string; message?: string }) {
  return (
    <NotFoundPage 
      isExpired 
      shortCode={shortCode} 
      message={message}
    />
  )
}
