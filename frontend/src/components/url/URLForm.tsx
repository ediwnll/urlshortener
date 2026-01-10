import { useState } from 'react'
import { EXPIRATION_OPTIONS, ALIAS_PATTERN } from '../../constants'

interface URLFormProps {
  onSubmit: (url: string, customAlias?: string, expiresInHours?: number | null) => void
  loading: boolean
  error: string | null
}

/** URL shortening form with advanced options */
export function URLForm({ onSubmit, loading, error }: URLFormProps) {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [expiresIn, setExpiresIn] = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aliasError, setAliasError] = useState<string | null>(null)

  const validateAlias = (alias: string): boolean => {
    if (!alias) return true // Empty is valid (will use random code)
    if (!ALIAS_PATTERN.test(alias)) {
      setAliasError('Alias must be 3-20 characters: letters, numbers, hyphens, underscores only')
      return false
    }
    setAliasError(null)
    return true
  }

  const handleAliasChange = (value: string) => {
    setCustomAlias(value)
    if (value) validateAlias(value)
    else setAliasError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    const trimmedAlias = customAlias.trim()
    if (trimmedAlias && !validateAlias(trimmedAlias)) return
    
    onSubmit(url.trim(), trimmedAlias || undefined, expiresIn)
    setCustomAlias('')
    setExpiresIn(null)
    setShowAdvanced(false)
  }

  return (
    <section className="max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-long-url.com/..."
            className={`input-brutal flex-1 ${error ? 'border-[#ff3333]' : ''}`}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-accent whitespace-nowrap"
            disabled={loading || !url.trim() || !!aliasError}
          >
            {loading ? '// PROCESSING...' : 'SNIP IT'}
          </button>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[#f5f5f0]/50 hover:text-[#d4ff00] text-sm font-mono text-left transition-colors flex items-center gap-2 w-fit"
        >
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          <span>ADVANCED {showAdvanced ? '−' : '+'}</span>
        </button>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-4 animate-fade-in">
            <div className="space-y-4">
              {/* Custom Alias */}
              <div>
                <label className="block mb-2">
                  <span className="text-[#f5f5f0]/70 text-sm font-mono uppercase tracking-wider">
                    Custom Alias
                  </span>
                </label>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  placeholder="my-custom-link"
                  className={`input-brutal w-full ${aliasError ? 'border-[#ff3333]' : ''}`}
                  disabled={loading}
                  maxLength={20}
                />
                <p className="text-[#f5f5f0]/40 text-xs font-mono mt-2">
                  {'>'} Leave empty for random code. Use 3-20 chars: a-z, 0-9, -, _
                </p>
                {aliasError && (
                  <p className="text-[#ff3333] text-xs font-mono mt-2 animate-shake">
                    {'>'} {aliasError}
                  </p>
                )}
              </div>

              {/* Expiration */}
              <div className="relative">
                <label className="block mb-2">
                  <span className="text-[#f5f5f0]/70 text-sm font-mono uppercase tracking-wider">
                    Expires After
                  </span>
                </label>
                <select
                  value={expiresIn === null ? '' : expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border-[3px] border-[#2a2a2a] text-[#f5f5f0] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#d4ff00] transition-colors cursor-pointer appearance-none relative z-10"
                  disabled={loading}
                  style={{ borderRadius: 0 }}
                >
                  {EXPIRATION_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value === null ? '' : option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[#f5f5f0]/40 text-xs font-mono">
                {'>'} Set when this link should stop working
              </p>
            </div>
          </div>
        )}
      </form>
      {error && (
        <p className="text-error text-sm mt-3 animate-shake">
          {'>'} ERROR: {error}
        </p>
      )}
    </section>
  )
}
