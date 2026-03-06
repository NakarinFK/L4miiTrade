import { useState, useRef, useEffect } from 'react'
import { Minus, TrendingUp, Square, MousePointer, Trash2, Palette } from 'lucide-react'
import { useChartStore } from '../../stores/chartStore'

const tools = [
  { id: null, label: 'Select', icon: MousePointer },
  { id: 'horizontal', label: 'H-Line', icon: Minus },
  { id: 'trendline', label: 'Trendline', icon: TrendingUp },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
]

const PRESET_COLORS = [
  '#6366f1', '#818cf8', '#3b82f6', '#06b6d4',
  '#10b981', '#22c55e', '#eab308', '#f59e0b',
  '#ef4444', '#f97316', '#ec4899', '#a855f7',
  '#ffffff', '#94a3b8', '#64748b', '#334155',
]

export default function DrawingToolbar() {
  const {
    activeTool, setActiveTool, selectedDrawingId, removeDrawing,
    clearDrawings, drawings, drawingColor, setDrawingColor, updateDrawing,
  } = useChartStore()
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  const handleColorSelect = (color) => {
    setDrawingColor(color)
    // Also update selected drawing's color if one is selected
    if (selectedDrawingId) {
      updateDrawing(selectedDrawingId, { color })
    }
    setShowPicker(false)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded-lg">
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => setActiveTool(id)}
          title={label}
          className={`p-2 rounded transition-colors ${
            activeTool === id
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="w-px h-6 bg-gray-700 mx-1" />

      {/* Color picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          title="Drawing color"
          className="p-2 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
        >
          <Palette size={16} />
          <span
            className="w-3 h-3 rounded-full border border-gray-600"
            style={{ backgroundColor: drawingColor }}
          />
        </button>

        {showPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 w-40">
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorSelect(c)}
                  className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                    drawingColor === c ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              value={drawingColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-full h-7 mt-2 cursor-pointer rounded border-0 bg-transparent"
              title="Custom color"
            />
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      {selectedDrawingId && (
        <button
          onClick={() => removeDrawing(selectedDrawingId)}
          title="Delete selected"
          className="p-2 rounded text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}

      {drawings.length > 0 && (
        <button
          onClick={clearDrawings}
          title="Clear all"
          className="px-2 py-1 rounded text-xs text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  )
}
