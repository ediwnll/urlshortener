import { useState, useEffect, useCallback } from 'react'
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ITEMS } from '../constants'
import type { ShortenedURL } from '../types'

/**
 * Custom hook for managing URL history in localStorage
 * @returns History state and functions to save/remove URLs
 */
export function useHistory() {
  const [history, setHistory] = useState<ShortenedURL[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch (err) {
      console.error('Failed to load history from localStorage:', err)
    }
  }, [])

  /** Save a URL to history (prepends and limits to MAX_HISTORY_ITEMS) */
  const saveToHistory = useCallback((url: ShortenedURL) => {
    setHistory((prev) => {
      // Check if URL already exists (by short_code)
      const filtered = prev.filter((item) => item.short_code !== url.short_code)
      // Prepend new URL and limit to MAX_HISTORY_ITEMS
      const updated = [url, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      // Persist to localStorage
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save history to localStorage:', err)
      }
      return updated
    })
  }, [])

  /** Remove a URL from history by ID */
  const removeFromHistory = useCallback((id: number) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to update history in localStorage:', err)
      }
      return updated
    })
  }, [])

  return {
    history,
    saveToHistory,
    removeFromHistory
  }
}
