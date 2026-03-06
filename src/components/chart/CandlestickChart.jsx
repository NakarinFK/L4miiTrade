import { useEffect, useRef, useCallback } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { useChartStore } from '../../stores/chartStore'
import { useBinanceKlines } from '../../hooks/useBinanceKlines'
import { useBinanceWs } from '../../hooks/useBinanceWs'

export default function CandlestickChart({ chartRef, seriesRef }) {
  const chartContainerRef = useRef(null)
  const resizeObserverRef = useRef(null)

  const { symbol, interval, position } = useChartStore()
  const { data, loading, error } = useBinanceKlines(symbol, interval)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#2a2a4a33' },
        horzLines: { color: '#2a2a4a33' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#6366f180', width: 1, style: 2 },
        horzLine: { color: '#6366f180', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#2a2a4a',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#2a2a4a',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    chartRef.current = chart
    seriesRef.current = series

    // Resize observer
    resizeObserverRef.current = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width, height })
    })
    resizeObserverRef.current.observe(chartContainerRef.current)

    return () => {
      resizeObserverRef.current?.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [symbol, interval])

  // Set data when klines load
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data)
      chartRef.current?.timeScale().fitContent()
    }
  }, [data])

  useEffect(() => {
    if (!seriesRef.current || !position) return

    const lines = []

    // Entry line
    if (position.entry) {
      lines.push(
        seriesRef.current.createPriceLine({
          price: parseFloat(position.entry),
          color: '#6366f1',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Entry',
        })
      )
    }

    // Stop loss line
    if (position.sl) {
      lines.push(
        seriesRef.current.createPriceLine({
          price: parseFloat(position.sl),
          color: '#ef5350',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'SL',
        })
      )
    }

    // Take profit line
    if (position.tp) {
      lines.push(
        seriesRef.current.createPriceLine({
          price: parseFloat(position.tp),
          color: '#26a69a',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'TP',
        })
      )
    }

    return () => {
      lines.forEach((line) => {
        try {
          seriesRef.current?.removePriceLine(line)
        } catch (e) {
          // Line may already be removed
        }
      })
    }
  }, [position])

  // WebSocket real-time updates
  const handleCandle = useCallback(
    (candle) => {
      if (seriesRef.current) {
        seriesRef.current.update({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })
      }
    },
    []
  )

  useBinanceWs(symbol, interval, handleCandle)

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading chart...</span>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="text-center">
            <p className="text-red-400 text-sm font-medium">Failed to load chart data</p>
            <p className="text-gray-500 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  )
}
