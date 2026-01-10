import { useState, useEffect } from 'react'
import { checkApiHealth } from '../services/api'

/**
 * Custom hook for checking API connection status
 * @returns API status: null (checking), true (connected), false (offline)
 */
export function useApi() {
  const [apiStatus, setApiStatus] = useState<boolean | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkApiHealth()
      setApiStatus(isHealthy)
    }
    checkHealth()
  }, [])

  return { apiStatus }
}
