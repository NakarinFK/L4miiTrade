import { useEffect, useRef, useCallback } from 'react'
import { useUiStore } from '../stores/uiStore'

const WS_BASE = 'wss://stream.binance.com:9443/ws'
const MAX_RETRIES = 20
const BASE_DELAY = 1000

export function useBinanceWs(symbol, interval, onCandle) {
  const addToast = useUiStore((s) => s.addToast)
  const shownRef = useRef({ connected: false })

  const handleStatus = useCallback((status, retryCount) => {
    if (status === 'connected') {
      if (shownRef.current.connected) {
        addToast({ type: 'success', title: 'WebSocket reconnected', message: `${symbol} ${interval}` })
      }
      shownRef.current.connected = true
    } else if (status === 'reconnecting' && retryCount === 1) {
      addToast({ type: 'warning', title: 'Connection lost', message: `Reconnecting to ${symbol}...`, duration: 3000 })
    } else if (status === 'failed') {
      addToast({ type: 'error', title: 'Connection failed', message: 'Could not reconnect. Refresh the page.', duration: 8000 })
    }
  }, [symbol, interval, addToast])

  useEffect(() => {
    // All reconnection state lives inside the effect closure so React's cleanup
    // guarantee — "cleanup always runs before the next effect" — is the sole
    // mechanism that stops old connections.  No external ref or factory needed.
    let disposed = false
    let ws = null
    let retryCount = 0
    let retryTimer = null

    shownRef.current.connected = false

    function connect() {
      if (disposed) return

      ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`)

      ws.onopen = () => {
        if (disposed) return
        retryCount = 0
        handleStatus('connected')
      }

      ws.onmessage = (event) => {
        // Guard: a message can arrive in the same tick as close() is called.
        // Without this, onCandle would update a series that is being torn down.
        if (disposed) return
        const k = JSON.parse(event.data).k
        if (k) {
          onCandle({
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            isClosed: k.x,
          })
        }
      }

      ws.onerror = () => {
        if (!disposed) handleStatus('error')
      }

      ws.onclose = () => {
        if (disposed) return
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000)
          retryCount++
          handleStatus('reconnecting', retryCount)
          retryTimer = setTimeout(connect, delay)
        } else {
          handleStatus('failed')
        }
      }
    }

    connect()

    return () => {
      disposed = true        // stops all pending callbacks immediately
      clearTimeout(retryTimer) // cancels any scheduled reconnect
      if (ws) { ws.close(); ws = null }
    }
  }, [symbol, interval, onCandle, handleStatus])
}
