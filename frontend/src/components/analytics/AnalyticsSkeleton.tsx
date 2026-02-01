import { Skeleton } from '../ui/Skeleton'

/** 
 * Skeleton loader for Analytics Modal content
 * Matches the exact layout of AnalyticsModal 
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Total Clicks Box */}
      <div className="text-center py-6 border-[3px] border-[#2a2a2a] bg-[#0a0a0a]">
        <Skeleton width="w-24" height="h-4" className="mx-auto mb-3" />
        <Skeleton width="w-32" height="h-16" className="mx-auto" />
      </div>

      {/* Clicks by Day Chart */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#2a2a2a] skeleton-pulse" />
          <Skeleton width="w-32" height="h-4" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              {/* Date label */}
              <Skeleton width="w-16" height="h-4" className="shrink-0" />
              {/* Bar container */}
              <div className="flex-1 h-6 bg-[#0a0a0a] border border-[#2a2a2a] relative overflow-hidden">
                <Skeleton 
                  width={`${Math.random() * 60 + 20}%`} 
                  height="h-full" 
                  className="absolute left-0 top-0"
                />
              </div>
              {/* Count */}
              <Skeleton width="w-10" height="h-4" className="text-right" />
            </div>
          ))}
        </div>
      </div>

      {/* Clicks by Hour Chart */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#2a2a2a] skeleton-pulse" />
          <Skeleton width="w-36" height="h-4" />
        </div>
        <div className="flex items-end gap-1 h-32 border-b-[2px] border-[#2a2a2a]">
          {Array.from({ length: 24 }).map((_, index) => (
            <div key={index} className="flex-1 flex flex-col items-center justify-end">
              <Skeleton 
                width="w-full" 
                height={`${Math.random() * 80 + 10}%`}
                className="min-h-[2px]"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {['12AM', '6AM', '12PM', '6PM', '11PM'].map((label) => (
            <Skeleton key={label} width="w-8" height="h-3" />
          ))}
        </div>
      </div>

      {/* Top Referrers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#2a2a2a] skeleton-pulse" />
          <Skeleton width="w-32" height="h-4" />
        </div>
        <div className="border-[2px] border-[#2a2a2a] divide-y divide-[#2a2a2a]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Skeleton width="w-6" height="h-5" />
                <Skeleton width="w-32" height="h-4" />
              </div>
              <Skeleton width="w-8" height="h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
