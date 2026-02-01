import { Skeleton } from '../ui/Skeleton'

interface URLCardSkeletonProps {
  /** Number of skeleton cards to display */
  count?: number
}

/** 
 * Skeleton loader for URL cards in RecentUrls
 * Matches the exact layout of URL list items 
 */
export function URLCardSkeleton({ count = 3 }: URLCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border-[3px] border-[#2a2a2a] bg-[#1a1a1a] p-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side - URL info */}
            <div className="flex-1 min-w-0">
              {/* Short code, badges, date row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Short code */}
                <Skeleton width="w-24" height="h-5" />
                {/* Separator */}
                <div className="w-px h-4 bg-[#2a2a2a]" />
                {/* Date */}
                <Skeleton width="w-20" height="h-3" />
              </div>
              {/* Original URL */}
              <Skeleton width="w-3/4" height="h-4" className="opacity-60" />
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton width="w-14" height="h-7" className="border-[2px] border-[#2a2a2a]" />
              <Skeleton width="w-10" height="h-7" className="border-[2px] border-[#2a2a2a]" />
              <Skeleton width="w-14" height="h-7" className="border-[2px] border-[#2a2a2a]" />
              <Skeleton width="w-8" height="h-7" className="border-[2px] border-[#2a2a2a]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** 
 * Full skeleton for the RecentUrls section including header and search 
 */
export function RecentUrlsSkeleton() {
  return (
    <section className="max-w-3xl mx-auto mt-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton width="w-40" height="h-7" />
        <div className="flex-1 h-[3px] bg-[#2a2a2a]" />
        <Skeleton width="w-10" height="h-4" />
      </div>

      {/* Search Input Skeleton */}
      <div className="relative mb-4">
        <div className="w-full bg-[#0a0a0a] border-[3px] border-[#2a2a2a] py-3 px-4">
          <Skeleton width="w-32" height="h-5" />
        </div>
      </div>

      {/* URL Cards */}
      <URLCardSkeleton count={3} />
    </section>
  )
}
