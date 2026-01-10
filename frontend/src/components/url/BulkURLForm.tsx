import { useState } from 'react'
import { EXPIRATION_OPTIONS } from '../../constants'
import type { BulkURLResponse } from '../../types'

interface BulkURLFormProps {
  onSubmit: (urls: string[], expiresInHours?: number | null) => Promise<void>
  loading: boolean
  result: BulkURLResponse | null
  onCopyUrl: (shortUrl: string) => void
}

/** Bulk URL shortening form component */
export function BulkURLForm({ onSubmit, loading, result, onCopyUrl }: BulkURLFormProps) {
  const [urlsText, setUrlsText] = useState('')
  const [expiresIn, setExpiresIn] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const parseUrls = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  const validateUrls = (urls: string[]): boolean => {
    if (urls.length === 0) {
      setValidationError('Enter at least one URL')
      return false
    }
    if (urls.length > 10) {
      setValidationError('Maximum 10 URLs allowed')
      return false
    }
    
    const urlPattern = /^https?:\/\/.+/i
    for (let i = 0; i < urls.length; i++) {
      if (!urlPattern.test(urls[i])) {
        setValidationError(`Line ${i + 1}: Invalid URL format (must start with http:// or https://)`)
        return false
      }
    }
    
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const urls = parseUrls(urlsText)
    
    if (!validateUrls(urls)) return
    
    await onSubmit(urls, expiresIn)
  }

  const urlCount = parseUrls(urlsText).length

  return (
    <section className="max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Textarea for bulk URLs */}
        <div>
          <textarea
            value={urlsText}
            onChange={(e) => {
              setUrlsText(e.target.value)
              setValidationError(null)
            }}
            placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
            className={`w-full h-40 bg-[#0a0a0a] border-[3px] ${validationError ? 'border-[#ff3333]' : 'border-[#2a2a2a]'} text-[#f5f5f0] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#d4ff00] transition-colors resize-none`}
            style={{ borderRadius: 0 }}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-[#f5f5f0]/40 text-xs font-mono">
              {'>'} One URL per line • Max 10 URLs
            </p>
            <span className={`text-xs font-mono ${urlCount > 10 ? 'text-[#ff3333]' : 'text-[#f5f5f0]/40'}`}>
              {urlCount}/10 URLs
            </span>
          </div>
        </div>

        {/* Expiration setting */}
        <div className="border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <label className="block mb-2">
            <span className="text-[#f5f5f0]/70 text-sm font-mono uppercase tracking-wider">
              Expires After (applies to all)
            </span>
          </label>
          <select
            value={expiresIn === null ? '' : expiresIn}
            onChange={(e) => setExpiresIn(e.target.value === '' ? null : Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border-[3px] border-[#2a2a2a] text-[#f5f5f0] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#d4ff00] transition-colors cursor-pointer appearance-none"
            style={{ borderRadius: 0 }}
            disabled={loading}
          >
            {EXPIRATION_OPTIONS.map((option) => (
              <option key={option.label} value={option.value === null ? '' : option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn-accent whitespace-nowrap"
          disabled={loading || urlCount === 0 || urlCount > 10}
        >
          {loading ? '// PROCESSING...' : `BULK SNIP (${urlCount})`}
        </button>
      </form>

      {/* Validation error */}
      {validationError && (
        <p className="text-[#ff3333] text-sm mt-3 animate-shake font-mono">
          {'>'} ERROR: {validationError}
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-4">
          {/* Summary */}
          <div className="flex gap-4 mb-4 pb-4 border-b-2 border-[#2a2a2a]">
            <span className="text-[#d4ff00] font-mono text-sm">
              ✓ {result.success_count} SUCCESS
            </span>
            {result.error_count > 0 && (
              <span className="text-[#ff3333] font-mono text-sm">
                ✗ {result.error_count} FAILED
              </span>
            )}
          </div>

          {/* Individual results */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {result.results.map((item, index) => (
              <div
                key={index}
                className={`p-3 border-2 ${item.error ? 'border-[#ff3333]/50 bg-[#ff3333]/5' : 'border-[#d4ff00]/50 bg-[#d4ff00]/5'}`}
                style={{ borderRadius: 0 }}
              >
                <p className="text-[#f5f5f0]/60 text-xs font-mono truncate mb-1" title={item.original_url}>
                  {item.original_url}
                </p>
                {item.url ? (
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={item.url.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d4ff00] font-mono text-sm hover:underline truncate"
                    >
                      {item.url.short_url}
                    </a>
                    <button
                      type="button"
                      onClick={() => onCopyUrl(item.url!.short_url)}
                      className="text-[#f5f5f0]/60 hover:text-[#d4ff00] text-xs font-mono uppercase px-2 py-1 border-2 border-[#2a2a2a] hover:border-[#d4ff00] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      COPY
                    </button>
                  </div>
                ) : (
                  <p className="text-[#ff3333] text-xs font-mono">
                    {'>'} {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
