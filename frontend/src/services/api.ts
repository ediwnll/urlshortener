import { API_BASE } from '../constants'
import type { ShortenedURL, URLAnalytics, BulkURLResponse } from '../types'

/**
 * Standardized API error response from backend
 */
export interface APIErrorResponse {
  error: {
    code: string
    message: string
    status: number
    details?: Record<string, unknown>
  }
}

/**
 * Custom API error class with additional context
 */
export class APIError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(response: APIErrorResponse) {
    super(response.error.message)
    this.name = 'APIError'
    this.code = response.error.code
    this.status = response.error.status
    this.details = response.error.details
  }

  /**
   * Check if error is a specific type
   */
  is(code: string): boolean {
    return this.code === code
  }

  /**
   * Check if error is a not found error
   */
  isNotFound(): boolean {
    return this.code === 'URL_NOT_FOUND' || this.status === 404
  }

  /**
   * Check if error is an expired URL error
   */
  isExpired(): boolean {
    return this.code === 'URL_EXPIRED' || this.status === 410
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimited(): boolean {
    return this.code === 'RATE_LIMIT_EXCEEDED' || this.status === 429
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' || this.status === 400
  }
}

/**
 * Parse error response from API
 * @param response - The fetch response object
 * @returns APIError with parsed error details
 */
async function parseErrorResponse(response: Response): Promise<APIError> {
  try {
    const data = await response.json()
    
    // Handle standardized error format
    if (data.error && typeof data.error === 'object') {
      return new APIError(data as APIErrorResponse)
    }
    
    // Handle legacy error format (detail field)
    if (data.detail) {
      return new APIError({
        error: {
          code: 'ERROR',
          message: typeof data.detail === 'string' ? data.detail : 'An error occurred',
          status: response.status
        }
      })
    }
    
    // Fallback for unknown error format
    return new APIError({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        status: response.status
      }
    })
  } catch {
    // Failed to parse JSON response
    return new APIError({
      error: {
        code: 'PARSE_ERROR',
        message: `Request failed with status ${response.status}`,
        status: response.status
      }
    })
  }
}

/**
 * Fetch analytics data for a shortened URL
 * @param shortCode - The short code of the URL
 * @returns Analytics data including clicks, referrers, and time distributions
 */
export async function getAnalytics(shortCode: string): Promise<URLAnalytics> {
  const response = await fetch(`${API_BASE}/api/urls/${shortCode}/analytics`)
  if (!response.ok) {
    throw await parseErrorResponse(response)
  }
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
    throw await parseErrorResponse(response)
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
    throw await parseErrorResponse(response)
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
    throw await parseErrorResponse(response)
  }
  return response.json()
}
