interface SkeletonProps {
  /** Width of skeleton - can be Tailwind class, CSS value, or percentage */
  width?: string
  /** Height of skeleton - can be Tailwind class or CSS value */
  height?: string
  /** Additional CSS classes */
  className?: string
}

/** 
 * Base skeleton component for loading states
 * Digital Brutalist style - sharp transitions, no smooth animations 
 */
export function Skeleton({ width = 'w-full', height = 'h-4', className = '' }: SkeletonProps) {
  // Check if width/height are Tailwind classes or CSS values
  const widthStyle = width.startsWith('w-') ? undefined : width
  const heightStyle = height.startsWith('h-') ? undefined : height
  const widthClass = width.startsWith('w-') ? width : ''
  const heightClass = height.startsWith('h-') ? height : ''

  return (
    <div
      className={`bg-[#2a2a2a] skeleton-pulse ${widthClass} ${heightClass} ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  )
}

interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number
  /** Additional CSS classes */
  className?: string
}

/** Multi-line text skeleton */
export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="h-4" 
          width={i === lines - 1 ? 'w-3/4' : 'w-full'} 
        />
      ))}
    </div>
  )
}

interface SkeletonBoxProps {
  /** Width of the box */
  width?: string
  /** Height of the box */
  height?: string
  /** Show border like real cards */
  bordered?: boolean
  /** Additional CSS classes */
  className?: string
  children?: React.ReactNode
}

/** Box skeleton with optional border */
export function SkeletonBox({ 
  width = 'w-full', 
  height = 'h-32', 
  bordered = false,
  className = '',
  children 
}: SkeletonBoxProps) {
  const widthStyle = width.startsWith('w-') ? undefined : width
  const heightStyle = height.startsWith('h-') ? undefined : height
  const widthClass = width.startsWith('w-') ? width : ''
  const heightClass = height.startsWith('h-') ? height : ''

  return (
    <div
      className={`
        bg-[#1a1a1a] 
        ${bordered ? 'border-[3px] border-[#2a2a2a]' : ''} 
        ${widthClass} ${heightClass} ${className}
      `}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    >
      {children}
    </div>
  )
}
