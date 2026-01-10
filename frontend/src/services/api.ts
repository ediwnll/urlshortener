import { API_BASE } from '../constants'
import type { ShortenedURL, URLAnalytics, BulkURLResponse } from '../types'

/**
 * Fetch analytics data for a shortened URL
 * @param shortCode - The short code of the URL
 * @returns Analytics data including clicks, referrers, and time distributions
 */
export async function getAnalytics(shortCode: string): Promise<URLAnalytics> {
  const response = await fetch(`${API_BASE}/api/urls/${shortCode}/analytics`)
  if (!response.ok) throw new Error('Failed to fetch analytics')
  return response.json()
}

/**
 * Create a new shortened URL
 * @param originalUrl - The original URL to shorten
 * @param customAlias - Optional custom alias for the short URL
 * @param expiresInHours - Optional expiration time in hours
 * @returns The created shortened URL object
 */
export async function shortenUrl(
  originalUrl: string,
  customAlias?: string,
  expiresInHours?: number | null
): Promise<ShortenedURL> {
  const response = await fetch(`${API_BASE}/api/urls/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_url: originalUrl,
      ...(customAlias && { custom_alias: customAlias }),
      ...(expiresInHours && { expires_in_hours: expiresInHours })
    })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to shorten URL')
  }
  return response.json()
}

/**
 * Delete a shortened URL
 * @param shortCode - The short code of the URL to delete
 */
export async function deleteUrl(shortCode: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/urls/${shortCode}`, {
    method: 'DELETE'
  })
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete URL')
  }
}

/**
 * Check API health/connectivity
 * @returns true if API is healthy, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Create multiple shortened URLs in bulk
 * @param urls - Array of original URLs to shorten
 * @param expiresInHours - Optional shared expiration time in hours for all URLs
 * @returns Bulk response with results for each URL
 */
export async function bulkShortenUrls(
  urls: string[],
  expiresInHours?: number | null
): Promise<BulkURLResponse> {
  const response = await fetch(`${API_BASE}/api/urls/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: urls.map(url => ({
        original_url: url,
        ...(expiresInHours && { expires_in_hours: expiresInHours })
      }))
    })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to shorten URLs')
  }
  return response.json()
}
