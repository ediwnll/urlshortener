import type { ExpirationOption } from '../types'

/** Base URL for API requests */
export const API_BASE = ''

/** LocalStorage key for URL history */
export const HISTORY_STORAGE_KEY = 'snip_url_history'

/** Maximum number of URLs to store in history */
export const MAX_HISTORY_ITEMS = 10

/** Expiration options for URL creation */
export const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: 'Never', value: null },
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
]

/** Custom alias validation pattern: alphanumeric, hyphens, underscores, 3-20 chars */
export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/
