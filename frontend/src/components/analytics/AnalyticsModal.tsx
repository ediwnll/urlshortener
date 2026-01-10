import type { ShortenedURL, URLAnalytics } from '../../types'
import { formatHour, formatShortDate } from '../../utils/formatters'

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  url: ShortenedURL | null
  analytics: URLAnalytics | null
  loading: boolean
}

/** Analytics popup modal for viewing URL statistics */
export function AnalyticsModal({ isOpen, onClose, url, analytics, loading }: AnalyticsModalProps) {
  if (!isOpen || !url) return null

  const maxDayClicks = analytics?.clicks_by_day?.length
    ? Math.max(...analytics.clicks_by_day.map((d) => d.count), 1)
    : 1

  const maxHourClicks = analytics?.clicks_by_hour?.length
    ? Math.max(...analytics.clicks_by_hour.map((h) => h.count), 1)
    : 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[3px] border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b-[3px] border-[#2a2a2a] p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wider">
            <span className="text-[#d4ff00]">ANALYTICS:</span>
            <span className="text-white"> {url.short_code}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#f5f5f0]/50 hover:text-[#ff3333] text-2xl leading-none transition-colors border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-[3px] border-[#d4ff00] border-t-transparent animate-spin"></div>
              <p className="text-[#f5f5f0]/50 font-mono mt-4">// LOADING DATA...</p>
            </div>
          ) : analytics ? (
            <div className="space-y-8">
              {/* Total Clicks */}
              <div className="text-center py-6 border-[3px] border-[#2a2a2a] bg-[#0a0a0a]">
                <p className="text-[#f5f5f0]/50 text-sm font-mono uppercase tracking-wider mb-2">
                  Total Clicks
                </p>
                <p className="text-6xl font-bold text-[#d4ff00]">
                  {analytics.total_clicks.toLocaleString()}
                </p>
              </div>

              {/* Clicks by Day Chart */}
              {analytics.clicks_by_day.length > 0 && (
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-[#f5f5f0]/70 mb-4 flex items-center gap-2">
                    <span className="text-[#d4ff00]">▶</span> CLICKS BY DAY
                  </h3>
                  <div className="space-y-2">
                    {analytics.clicks_by_day.slice(-7).map((day) => (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-[#f5f5f0]/50 text-xs font-mono w-16 shrink-0">
                          {formatShortDate(day.date)}
                        </span>
                        <div className="flex-1 h-6 bg-[#0a0a0a] border border-[#2a2a2a] relative overflow-hidden">
                          <div
                            className="h-full bg-[#d4ff00] transition-all duration-500"
                            style={{ width: `${(day.count / maxDayClicks) * 100}%` }}
                          />
                        </div>
                        <span className="text-[#d4ff00] text-sm font-bold w-12 text-right">
                          {day.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clicks by Hour Chart */}
              {analytics.clicks_by_hour.length > 0 && (
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-[#f5f5f0]/70 mb-4 flex items-center gap-2">
                    <span className="text-[#d4ff00]">▶</span> CLICKS BY HOUR
                  </h3>
                  <div className="flex items-end gap-1 h-32 border-b-[2px] border-[#2a2a2a]">
                    {analytics.clicks_by_hour.map((hour) => (
                      <div
                        key={hour.hour}
                        className="flex-1 flex flex-col items-center justify-end group"
                      >
                        <div
                          className="w-full bg-[#d4ff00]/80 hover:bg-[#d4ff00] transition-all duration-200 min-h-[2px]"
                          style={{ height: `${(hour.count / maxHourClicks) * 100}%` }}
                          title={`${formatHour(hour.hour)}: ${hour.count} clicks`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] font-mono text-[#f5f5f0]/30">
                    <span>12AM</span>
                    <span>6AM</span>
                    <span>12PM</span>
                    <span>6PM</span>
                    <span>11PM</span>
                  </div>
                </div>
              )}

              {/* Top Referrers */}
              {analytics.top_referrers.length > 0 && (
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-[#f5f5f0]/70 mb-4 flex items-center gap-2">
                    <span className="text-[#d4ff00]">▶</span> TOP REFERRERS
                  </h3>
                  <div className="border-[2px] border-[#2a2a2a] divide-y divide-[#2a2a2a]">
                    {analytics.top_referrers.slice(0, 5).map((ref, index) => (
                      <div
                        key={ref.referrer}
                        className="flex items-center justify-between p-3 hover:bg-[#0a0a0a] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#d4ff00] font-bold text-sm w-6">
                            #{index + 1}
                          </span>
                          <span className="text-[#f5f5f0]/80 font-mono text-sm">
                            {ref.referrer || 'Direct / Unknown'}
                          </span>
                        </div>
                        <span className="text-[#d4ff00] font-bold">{ref.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Data State */}
              {analytics.total_clicks === 0 && (
                <div className="text-center py-8 border-[2px] border-dashed border-[#2a2a2a]">
                  <p className="text-[#f5f5f0]/50 font-mono">// NO CLICKS YET</p>
                  <p className="text-[#f5f5f0]/30 text-sm mt-2">
                    Share your link to start tracking
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#ff3333]">
              <p className="font-mono">// ERROR LOADING ANALYTICS</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-[3px] border-[#2a2a2a] p-4 bg-[#0a0a0a]">
          <p className="text-[#f5f5f0]/40 text-xs font-mono text-center">
            {'>'} {url.original_url.length > 50 ? url.original_url.substring(0, 50) + '...' : url.original_url}
          </p>
        </div>
      </div>
    </div>
  )
}
