import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { useChartStore } from '../../stores/chartStore'

export default function DrawingCanvas({ chartRef, seriesRef }) {
  const canvasRef = useRef(null)
  const [clickPoints, setClickPoints] = useState([])
  const [dragging, setDragging] = useState(null)
  // Ref instead of state: preview position updates don't need re-renders (PERF-2)
  const mousePosRef = useRef(null)

  const {
    symbol, interval, // used to re-subscribe when chart is replaced
    activeTool, drawings, selectedDrawingId,
    addDrawing, updateDrawing, selectDrawing, removeDrawing,
  } = useChartStore()

  const getCoords = useCallback(
    (e) => {
      if (!canvasRef.current) return null
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let time = null
      let price = null
      if (chartRef.current && seriesRef.current) {
        time = chartRef.current.timeScale().coordinateToTime(x)
        price = seriesRef.current.coordinateToPrice(y)
      }
      return { x, y, time, price }
    },
    [chartRef, seriesRef]
  )

  const hitTest = useCallback(
    (px, py) => {
      if (!chartRef.current || !seriesRef.current) return null
      const timeScale = chartRef.current.timeScale()
      const series = seriesRef.current

      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i]
        if (d.type === 'horizontal') {
          const lineY = series.priceToCoordinate(d.price)
          if (lineY !== null && Math.abs(py - lineY) < 6) return d.id
        } else if (d.type === 'trendline') {
          const x1 = timeScale.timeToCoordinate(d.p1.time)
          const y1 = series.priceToCoordinate(d.p1.price)
          const x2 = timeScale.timeToCoordinate(d.p2.time)
          const y2 = series.priceToCoordinate(d.p2.price)
          if (x1 === null || y1 === null || x2 === null || y2 === null) continue
          if (distToSegment(px, py, x1, y1, x2, y2) < 8) return d.id
        } else if (d.type === 'rectangle') {
          const x1 = timeScale.timeToCoordinate(d.p1.time)
          const y1 = series.priceToCoordinate(d.p1.price)
          const x2 = timeScale.timeToCoordinate(d.p2.time)
          const y2 = series.priceToCoordinate(d.p2.price)
          if (x1 === null || y1 === null || x2 === null || y2 === null) continue
          const minX = Math.min(x1, x2), maxX = Math.max(x1, x2)
          const minY = Math.min(y1, y2), maxY = Math.max(y1, y2)
          const nearLeft = Math.abs(px - minX) < 6 && py >= minY - 6 && py <= maxY + 6
          const nearRight = Math.abs(px - maxX) < 6 && py >= minY - 6 && py <= maxY + 6
          const nearTop = Math.abs(py - minY) < 6 && px >= minX - 6 && px <= maxX + 6
          const nearBottom = Math.abs(py - maxY) < 6 && px >= minX - 6 && px <= maxX + 6
          const inside = px >= minX && px <= maxX && py >= minY && py <= maxY
          if (nearLeft || nearRight || nearTop || nearBottom || inside) return d.id
        }
      }
      return null
    },
    [drawings, chartRef, seriesRef]
  )

  // renderDrawings does NOT include mousePosRef in deps — reads the ref directly (PERF-2)
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !chartRef.current || !seriesRef.current) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    const newW = Math.round(rect.width)
    const newH = Math.round(rect.height)

    // PERF-1: only reset canvas dimensions when the container actually resized.
    // Setting canvas.width/height always clears the canvas AND resets all context state,
    // so we avoid it on every render when dimensions haven't changed.
    if (canvas.width !== newW || canvas.height !== newH) {
      canvas.width = newW
      canvas.height = newH
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const timeScale = chartRef.current.timeScale()
    const series = seriesRef.current

    for (const d of drawings) {
      const isSelected = d.id === selectedDrawingId
      const baseColor = d.color || '#6366f1'
      const selColor = lightenHex(baseColor, 40)

      if (d.type === 'horizontal') {
        const y = series.priceToCoordinate(d.price)
        if (y === null) continue
        ctx.beginPath()
        ctx.strokeStyle = isSelected ? selColor : baseColor
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.setLineDash([5, 5])
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = isSelected ? selColor : baseColor
        ctx.font = '11px Inter, sans-serif'
        ctx.fillText(d.price.toFixed(2), 8, y - 4)

        if (isSelected) {
          drawHandle(ctx, 30, y, selColor)
          drawHandle(ctx, canvas.width - 30, y, selColor)
        }
      } else if (d.type === 'trendline') {
        const x1 = timeScale.timeToCoordinate(d.p1.time)
        const y1 = series.priceToCoordinate(d.p1.price)
        const x2 = timeScale.timeToCoordinate(d.p2.time)
        const y2 = series.priceToCoordinate(d.p2.price)
        if (x1 === null || y1 === null || x2 === null || y2 === null) continue

        ctx.beginPath()
        ctx.strokeStyle = isSelected ? selColor : baseColor
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        if (isSelected) {
          drawHandle(ctx, x1, y1, selColor)
          drawHandle(ctx, x2, y2, selColor)
        }
      } else if (d.type === 'rectangle') {
        const x1 = timeScale.timeToCoordinate(d.p1.time)
        const y1 = series.priceToCoordinate(d.p1.price)
        const x2 = timeScale.timeToCoordinate(d.p2.time)
        const y2 = series.priceToCoordinate(d.p2.price)
        if (x1 === null || y1 === null || x2 === null || y2 === null) continue

        ctx.fillStyle = isSelected ? baseColor + '25' : baseColor + '15'
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
        ctx.strokeStyle = isSelected ? selColor : baseColor
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))

        if (isSelected) {
          drawHandle(ctx, x1, y1, selColor)
          drawHandle(ctx, x2, y2, selColor)
          drawHandle(ctx, x1, y2, selColor)
          drawHandle(ctx, x2, y1, selColor)
        }
      }
    }

    // Preview line while drawing — reads from ref so mousePos is NOT a dep (PERF-2)
    const mousePos = mousePosRef.current
    if (activeTool && clickPoints.length > 0 && mousePos) {
      const p1 = clickPoints[0]
      const x1 = timeScale.timeToCoordinate(p1.time)
      const y1 = series.priceToCoordinate(p1.price)
      if (x1 !== null && y1 !== null) {
        ctx.beginPath()
        ctx.strokeStyle = '#ffffff60'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])

        if (activeTool === 'trendline') {
          ctx.moveTo(x1, y1)
          ctx.lineTo(mousePos.x, mousePos.y)
          ctx.stroke()
        } else if (activeTool === 'rectangle') {
          ctx.strokeRect(
            Math.min(x1, mousePos.x),
            Math.min(y1, mousePos.y),
            Math.abs(mousePos.x - x1),
            Math.abs(mousePos.y - y1)
          )
        }
        ctx.setLineDash([])
      }
    }
  }, [drawings, selectedDrawingId, activeTool, clickPoints, chartRef, seriesRef])

  // LEAK-1: keep a stable ref to the latest renderDrawings so the subscription
  // handler never needs to be replaced (avoids re-subscribing on every mousemove).
  const renderRef = useRef(renderDrawings)
  useLayoutEffect(() => { renderRef.current = renderDrawings }, [renderDrawings])

  // Redraw whenever drawing state changes
  useEffect(() => {
    renderDrawings()
  }, [renderDrawings])

  // LEAK-1 + LEAK-2: subscribe to chart pan/zoom for canvas redraws.
  // - Capture `chart` at subscription time so cleanup unsubscribes the correct instance.
  // - Use `renderRef.current` (stable) so the handler is never replaced.
  // - Depend on [symbol, interval] so we re-subscribe after CandlestickChart recreates
  //   the chart (which happens on symbol/interval change). CandlestickChart's effects
  //   run before DrawingCanvas's (tree order), so chartRef.current is already the new
  //   chart by the time this effect runs.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const handler = () => renderRef.current()
    chart.timeScale().subscribeVisibleTimeRangeChange(handler)
    return () => {
      try { chart.timeScale().unsubscribeVisibleTimeRangeChange(handler) } catch (e) {}
    }
  }, [symbol, interval]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = useCallback(
    (e) => {
      const coords = getCoords(e)
      if (!coords) return

      if (activeTool) {
        if (activeTool === 'horizontal') {
          if (coords.price !== null) {
            addDrawing({ type: 'horizontal', price: coords.price })
          }
          mousePosRef.current = null
          setClickPoints([])
        } else {
          // Trendline / Rectangle: 2-click
          if (clickPoints.length === 0) {
            if (coords.time !== null && coords.price !== null) {
              setClickPoints([coords])
            }
          } else {
            if (coords.time !== null && coords.price !== null) {
              addDrawing({
                type: activeTool,
                p1: { time: clickPoints[0].time, price: clickPoints[0].price },
                p2: { time: coords.time, price: coords.price },
              })
            }
            mousePosRef.current = null
            setClickPoints([])
          }
        }
        return
      }

      // Select mode
      const hitId = hitTest(coords.x, coords.y)
      if (!hitId) {
        selectDrawing(null)
        return
      }

      e.stopPropagation()
      e.preventDefault()
      selectDrawing(hitId)

      if (coords.price !== null) {
        setDragging({
          drawingId: hitId,
          startPx: coords.x,
          startPy: coords.y,
          startPrice: coords.price,
          startTime: coords.time,
        })
      }
    },
    [activeTool, clickPoints, getCoords, hitTest, addDrawing, selectDrawing]
  )

  const handleMouseMove = useCallback(
    (e) => {
      const coords = getCoords(e)
      if (!coords) return

      if (dragging && !activeTool) {
        const d = drawings.find((dr) => dr.id === dragging.drawingId)
        if (!d || coords.price === null) return

        const dp = coords.price - dragging.startPrice

        if (d.type === 'horizontal') {
          updateDrawing(d.id, { price: d.price + dp })
        } else if (d.type === 'trendline' || d.type === 'rectangle') {
          const timeScale = chartRef.current?.timeScale()
          if (!timeScale) return
          const newT1 = timeScale.coordinateToTime(
            timeScale.timeToCoordinate(d.p1.time) + (coords.x - dragging.startPx)
          )
          const newT2 = timeScale.coordinateToTime(
            timeScale.timeToCoordinate(d.p2.time) + (coords.x - dragging.startPx)
          )
          if (newT1 !== null && newT2 !== null) {
            updateDrawing(d.id, {
              p1: { time: newT1, price: d.p1.price + dp },
              p2: { time: newT2, price: d.p2.price + dp },
            })
          }
        }

        setDragging({
          ...dragging,
          startPx: coords.x,
          startPy: coords.y,
          startPrice: coords.price,
          startTime: coords.time,
        })
        return
      }

      // Preview while drawing (2-click tools): update ref and paint directly.
      // No setState here, so no re-render — only a canvas repaint (PERF-2).
      if (activeTool && clickPoints.length > 0) {
        mousePosRef.current = { x: coords.x, y: coords.y }
        renderDrawings()
      }
    },
    [activeTool, clickPoints, dragging, drawings, getCoords, updateDrawing, chartRef, renderDrawings]
  )

  const handleMouseUp = useCallback(() => setDragging(null), [])

  // Keyboard: Delete selected drawing, Escape cancel current tool
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        e.preventDefault()
        removeDrawing(selectedDrawingId)
      }
      if (e.key === 'Escape') {
        mousePosRef.current = null
        setClickPoints([]) // triggers renderDrawings via deps → clears preview
        selectDrawing(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedDrawingId, removeDrawing, selectDrawing])

  const needsPointer = !!activeTool || !!dragging || drawings.length > 0

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-10 ${activeTool ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{ pointerEvents: needsPointer ? 'auto' : 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}

// -- Helpers --

function drawHandle(ctx, x, y, color) {
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 1
  ctx.stroke()
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

function lightenHex(hex, amount) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}
