import { useState, useCallback } from 'react'
import type { Toast, ToastType } from '../types'

/**
 * Custom hook for managing toast notifications
 * @returns Toast state and functions to add/remove toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  return {
    toasts,
    addToast,
    removeToast
  }
}
