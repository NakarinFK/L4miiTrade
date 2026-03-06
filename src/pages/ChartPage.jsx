import { useRef } from 'react'
import { Calculator } from 'lucide-react'
import CandlestickChart from '../components/chart/CandlestickChart'
import TimeframeBar from '../components/chart/TimeframeBar'
import DrawingToolbar from '../components/chart/DrawingToolbar'
import DrawingCanvas from '../components/chart/DrawingCanvas'
import PositionCalculator from '../components/chart/PositionCalculator'
import { useUiStore } from '../stores/uiStore'

export default function ChartPage() {
  const { togglePositionCalculator } = useUiStore()
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
          <TimeframeBar />
          <div className="w-px h-6 bg-gray-700 shrink-0" />
          <DrawingToolbar />
        </div>
        <button
          onClick={togglePositionCalculator}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:text-indigo-400 hover:border-indigo-400 transition-colors shrink-0"
        >
          <Calculator size={14} />
          <span className="hidden sm:inline">Position Calculator</span>
          <span className="sm:hidden">Calc</span>
        </button>
      </div>

      {/* Chart area */}
      <div className="relative flex-1">
        <div className="absolute inset-0 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
          <CandlestickChart chartRef={chartRef} seriesRef={seriesRef} />
          <DrawingCanvas chartRef={chartRef} seriesRef={seriesRef} />
        </div>
        <PositionCalculator />
      </div>
    </div>
  )
}
