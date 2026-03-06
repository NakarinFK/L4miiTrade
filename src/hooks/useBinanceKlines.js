import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchKlines } from '../lib/binanceApi'

export function useBinanceKlines(symbol, interval) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const load = useCallback(() => {
    // Cancel any in-flight request before starting a new one (BUG-2: race condition)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    fetchKlines(symbol, interval, 200, controller.signal)
      .then((klines) => {
        if (!controller.signal.aborted) setData(klines)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
  }, [symbol, interval])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  return { data, loading, error, refetch: load }
}
