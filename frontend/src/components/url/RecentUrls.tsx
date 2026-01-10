import type { ShortenedURL } from '../../types'
import { isExpired, formatExpiration, formatDate, truncateUrl } from '../../utils/formatters'

interface RecentUrlsProps {
  history: ShortenedURL[]
  filteredHistory: ShortenedURL[]
  onCopy: (shortUrl: string) => void
  onDelete: (id: number, shortCode: string) => void
  onViewStats: (url: ShortenedURL) => void
  onViewQR: (url: ShortenedURL) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

/** Recent URLs list with search functionality */
export function RecentUrls({ 
  history, 
  filteredHistory, 
  onCopy, 
  onDelete, 
  onViewStats,
  onViewQR,
  searchQuery, 
  setSearchQuery 
}: RecentUrlsProps) {
  if (history.length === 0) return null

  return (
    <section className="max-w-3xl mx-auto mt-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold tracking-wider">
          <span className="text-[#d4ff00]">RECENT</span>
          <span className="text-white"> SNIPS_</span>
        </h2>
        <div className="flex-1 h-[3px] bg-[#2a2a2a]"></div>
        <span className="text-[#f5f5f0]/50 text-sm font-mono">{history.length}/10</span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5f5f0]/50 font-mono text-sm pointer-events-none">{'>'}</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search snips..."
          className="w-full bg-[#0a0a0a] border-[3px] border-[#2a2a2a] text-[#f5f5f0] pl-8 pr-10 py-3 font-mono text-sm focus:outline-none focus:border-[#d4ff00] transition-colors placeholder:text-[#f5f5f0]/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f5f0]/50 hover:text-[#d4ff00] transition-colors border-none bg-transparent cursor-pointer text-lg leading-none p-1"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* No Results State */}
      {filteredHistory.length === 0 && searchQuery && (
        <div className="border-[3px] border-dashed border-[#2a2a2a] p-8 text-center">
          <p className="text-[#f5f5f0]/50 font-mono">// NO RESULTS FOUND</p>
          <p className="text-[#f5f5f0]/30 text-sm mt-2">
            No snips matching "{searchQuery}"
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-4 hover:border-[#d4ff00] transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <code className="text-[#d4ff00] text-sm font-bold">
                    {item.short_code}
                  </code>
                  {isExpired(item.expires_at) && (
                    <span className="bg-[#ff3333] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      EXPIRED
                    </span>
                  )}
                  <span className="text-[#f5f5f0]/30">|</span>
                  <span className="text-[#f5f5f0]/40 text-xs font-mono">
                    {formatDate(item.created_at)}
                  </span>
                  {item.expires_at && !isExpired(item.expires_at) && (
                    <>
                      <span className="text-[#f5f5f0]/30">|</span>
                      <span className="text-[#f5f5f0]/40 text-xs font-mono">
                        Expires {formatExpiration(item.expires_at)}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[#f5f5f0]/60 text-sm truncate" title={item.original_url}>
                  {truncateUrl(item.original_url, 50)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onViewStats(item)}
                  className="border-[2px] border-[#2a2a2a] bg-transparent text-[#f5f5f0]/70 hover:border-[#d4ff00] hover:text-[#d4ff00] px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  STATS
                </button>
                <button
                  onClick={() => onViewQR(item)}
                  className="border-[2px] border-[#2a2a2a] bg-transparent text-[#f5f5f0]/70 hover:border-[#d4ff00] hover:text-[#d4ff00] px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  QR
                </button>
                <button
                  onClick={() => onCopy(item.short_url)}
                  className="border-[2px] border-[#2a2a2a] bg-transparent text-[#f5f5f0]/70 hover:border-[#d4ff00] hover:text-[#d4ff00] px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  COPY
                </button>
                <button
                  onClick={() => onDelete(item.id, item.short_code)}
                  className="border-[2px] border-[#2a2a2a] bg-transparent text-[#f5f5f0]/40 hover:border-[#ff3333] hover:text-[#ff3333] px-2 py-1 text-xs transition-colors"
                  title="Remove from history"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
