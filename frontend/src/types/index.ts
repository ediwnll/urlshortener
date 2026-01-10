/**
 * TypeScript interfaces for the URL Shortener application
 */

/** Toast notification types */
export type ToastType = 'success' | 'error' | 'info'

/** Toast notification object */
export interface Toast {
  id: string
  message: string
  type: ToastType
}

/** Shortened URL response from API */
export interface ShortenedURL {
  id: number
  short_code: string
  original_url: string
  short_url: string
  created_at: string
  expires_at: string | null
  click_count: number
  is_active: boolean
}

/** URL analytics data from API */
export interface URLAnalytics {
  total_clicks: number
  clicks_by_day: { date: string; count: number }[]
  top_referrers: { referrer: string; count: number }[]
  clicks_by_hour: { hour: number; count: number }[]
}

/** Expiration option for URL creation */
export interface ExpirationOption {
  label: string
  value: number | null
}

/** Individual result item in bulk URL response */
export interface BulkURLResultItem {
  url: ShortenedURL | null
  error: string | null
  original_url: string
}

/** Bulk URL creation response from API */
export interface BulkURLResponse {
  results: BulkURLResultItem[]
  success_count: number
  error_count: number
}
