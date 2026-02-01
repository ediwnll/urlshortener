import { useState } from 'react'

// Types
import type { ShortenedURL, URLAnalytics, BulkURLResponse } from './types'

// Hooks
import { useToast, useHistory, useApi } from './hooks'

// Services
import { shortenUrl, deleteUrl, getAnalytics, bulkShortenUrls, APIError } from './services/api'

// Components
import {
  Header,
  Footer,
  HeroSection,
  URLForm,
  URLResult,
  RecentUrls,
  Toast,
  AnalyticsModal,
  QRCodeModal,
  BulkURLForm
} from './components'

/**
 * Error state with additional context
 */
interface ErrorState {
  message: string
  code?: string
  canRetry?: boolean
}

/**
 * Root application component
 * Composes all features and manages application-level state
 */
function App() {
  // Mode state (single vs bulk)
  const [isBulkMode, setIsBulkMode] = useState(false)

  // Form state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [result, setResult] = useState<ShortenedURL | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk mode state
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkURLResponse | null>(null)

  // Analytics modal state
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null)
  const [analytics, setAnalytics] = useState<URLAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // QR code modal state
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<ShortenedURL | null>(null)

  // Custom hooks
  const { toasts, addToast, removeToast } = useToast()
  const { history, saveToHistory, removeFromHistory } = useHistory()
  const { apiStatus } = useApi()

  // Filter history based on search query
  const filteredHistory = history.filter(url =>
    url.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    url.original_url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /** Handle URL shortening form submission */
  const handleSubmit = async (url: string, customAlias?: string, expiresInHours?: number | null) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setCopied(false)

    try {
      const data = await shortenUrl(url, customAlias, expiresInHours)
      setResult(data)
      saveToHistory(data)
      addToast('URL shortened successfully!', 'success')
    } catch (err) {
      if (err instanceof APIError) {
        setError({
          message: err.message,
          code: err.code,
          canRetry: !err.isValidationError()
        })
        addToast(err.message, 'error')
      } else {
        const message = err instanceof Error ? err.message : 'Failed to shorten URL'
        setError({ message, canRetry: true })
        addToast(message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  /** Handle bulk URL shortening submission */
  const handleBulkSubmit = async (urls: string[], expiresInHours?: number | null) => {
    setBulkLoading(true)
    setBulkResult(null)

    try {
      const data = await bulkShortenUrls(urls, expiresInHours)
      setBulkResult(data)
      
      // Save successful URLs to history
      data.results.forEach(item => {
        if (item.url) {
          saveToHistory(item.url)
        }
      })
      
      if (data.error_count === 0) {
        addToast(`All ${data.success_count} URLs shortened successfully!`, 'success')
      } else if (data.success_count > 0) {
        addToast(`${data.success_count} URLs shortened, ${data.error_count} failed`, 'info')
      } else {
        addToast('All URLs failed to shorten', 'error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to shorten URLs'
      addToast(message, 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  /** Copy result URL to clipboard */
  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.short_url)
      setCopied(true)
      addToast('Copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /** Copy URL from history to clipboard */
  const handleCopyFromHistory = async (shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl)
    addToast('Copied to clipboard!', 'success')
  }

  /** Delete URL from history and backend */
  const handleDeleteFromHistory = async (id: number, shortCode: string) => {
    try {
      await deleteUrl(shortCode)
      removeFromHistory(id)
      addToast('URL deleted successfully', 'success')
    } catch (err) {
      console.error('Failed to delete URL:', err)
      // Still remove from local history even if backend fails
      removeFromHistory(id)
      addToast('Removed from history (backend deletion may have failed)', 'info')
    }
  }

  /** Open analytics modal for a URL */
  const handleViewStats = async (url: ShortenedURL) => {
    setSelectedUrl(url)
    setAnalyticsModalOpen(true)
    setAnalyticsLoading(true)
    setAnalytics(null)

    try {
      const data = await getAnalytics(url.short_code)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      addToast('Failed to load analytics', 'error')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  /** Close analytics modal */
  const handleCloseAnalytics = () => {
    setAnalyticsModalOpen(false)
    setSelectedUrl(null)
    setAnalytics(null)
  }

  /** Open QR code modal for a URL */
  const handleViewQR = (url: ShortenedURL) => {
    setQrUrl(url)
    setQrModalOpen(true)
  }

  /** Close QR code modal */
  const handleCloseQR = () => {
    setQrModalOpen(false)
    setQrUrl(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <HeroSection />
        
        {/* Mode Toggle */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex border-[3px] border-[#2a2a2a]" style={{ borderRadius: 0 }}>
            <button
              type="button"
              onClick={() => {
                setIsBulkMode(false)
                setBulkResult(null)
              }}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                !isBulkMode
                  ? 'bg-[#d4ff00] text-[#0a0a0a] font-bold'
                  : 'bg-[#1a1a1a] text-[#f5f5f0]/60 hover:text-[#f5f5f0]'
              }`}
              style={{ borderRadius: 0 }}
            >
              SINGLE SNIP
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBulkMode(true)
                setResult(null)
                setError(null)
              }}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-colors border-l-[3px] border-[#2a2a2a] ${
                isBulkMode
                  ? 'bg-[#d4ff00] text-[#0a0a0a] font-bold'
                  : 'bg-[#1a1a1a] text-[#f5f5f0]/60 hover:text-[#f5f5f0]'
              }`}
              style={{ borderRadius: 0 }}
            >
              BULK SNIP
            </button>
          </div>
        </div>

        {/* Single URL Form */}
        {!isBulkMode && (
          <>
            <URLForm onSubmit={handleSubmit} loading={loading} error={error} />
            
            {result && (
              <URLResult
                shortUrl={result.short_url}
                originalUrl={result.original_url}
                clicks={result.click_count}
                expiresAt={result.expires_at}
                onCopy={handleCopy}
                copied={copied}
              />
            )}
          </>
        )}

        {/* Bulk URL Form */}
        {isBulkMode && (
          <BulkURLForm
            onSubmit={handleBulkSubmit}
            loading={bulkLoading}
            result={bulkResult}
            onCopyUrl={handleCopyFromHistory}
          />
        )}

        <RecentUrls
          history={history}
          filteredHistory={filteredHistory}
          onCopy={handleCopyFromHistory}
          onDelete={handleDeleteFromHistory}
          onViewStats={handleViewStats}
          onViewQR={handleViewQR}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>
      
      <Footer apiStatus={apiStatus} />
      
      <Toast toasts={toasts} onClose={removeToast} />
      
      <AnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={handleCloseAnalytics}
        url={selectedUrl}
        analytics={analytics}
        loading={analyticsLoading}
      />
      
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={handleCloseQR}
        url={qrUrl}
      />
    </div>
  )
}

export default App
