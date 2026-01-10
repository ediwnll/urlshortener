import { isExpired, formatExpiration } from '../../utils/formatters'

interface URLResultProps {
  shortUrl: string
  originalUrl: string
  clicks: number
  expiresAt: string | null
  onCopy: () => void
  copied: boolean
}

/** Display component for shortened URL result */
export function URLResult({ shortUrl, originalUrl, clicks, expiresAt, onCopy, copied }: URLResultProps) {
  return (
    <section className="max-w-3xl mx-auto animate-fade-in">
      <div className="card-brutal-accent">
        <div className="flex items-center gap-2 mb-4">
          <span className="tag-accent">SUCCESS</span>
          <span className="text-[#f5f5f0]/50 text-sm">// Your link is ready</span>
        </div>
        
        <div className="mb-4">
          <label className="text-[#f5f5f0]/50 text-xs uppercase tracking-wider block mb-1">
            Shortened URL
          </label>
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <code className="text-[#d4ff00] text-lg md:text-xl break-all flex-1">
              {shortUrl}
            </code>
            <button
              onClick={onCopy}
              className="btn-brutal text-sm py-2 px-4 shrink-0"
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        <div className="divider-brutal !my-4 opacity-30"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
          <div className="truncate-brutal flex-1">
            <span className="text-[#f5f5f0]/50">Original: </span>
            <span className="text-[#f5f5f0]/70">{originalUrl}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#f5f5f0]/50">Expires:</span>
              {isExpired(expiresAt) ? (
                <span className="tag-accent bg-[#ff3333] text-white border-[#ff3333] text-xs">EXPIRED</span>
              ) : (
                <span className="text-[#f5f5f0]/70">{formatExpiration(expiresAt)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d4ff00] font-bold">{clicks}</span>
              <span className="text-[#f5f5f0]/50">clicks</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
