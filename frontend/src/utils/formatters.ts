/**
 * Utility functions for formatting and validation
 */

/**
 * Check if a URL has expired
 * @param expiresAt - The expiration date string or null
 * @returns true if expired, false otherwise
 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/**
 * Format expiration date as a human-readable string
 * @param expiresAt - The expiration date string or null
 * @returns Formatted string like "in 2 days" or "Never"
 */
export function formatExpiration(expiresAt: string | null): string {
  if (!expiresAt) return 'Never'
  
  const expDate = new Date(expiresAt)
  const now = new Date()
  
  if (expDate < now) return 'Expired'
  
  const diffMs = expDate.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `in ${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''}`
  }
}

/**
 * Format hour number as 12-hour time string
 * @param hour - Hour number (0-23)
 * @returns Formatted string like "12AM" or "3PM"
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12AM'
  if (hour === 12) return '12PM'
  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`
}

/**
 * Format date string as short date with time
 * @param dateString - ISO date string
 * @returns Formatted string like "Jan 10, 2:30 PM"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date string as short date only
 * @param dateString - ISO date string
 * @returns Formatted string like "Jan 10"
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Truncate a URL to a maximum length with ellipsis
 * @param url - The URL to truncate
 * @param maxLength - Maximum length (default 40)
 * @returns Truncated URL string
 */
export function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}
