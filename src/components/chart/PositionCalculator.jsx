import { useState } from 'react'
import { X, Calculator } from 'lucide-react'
import { useChartStore } from '../../stores/chartStore'
import { useUiStore } from '../../stores/uiStore'
import { calculatePositionMetrics } from '../../lib/calculations'

const defaultForm = {
  direction: 'long',
  entry: '',
  sl: '',
  tp: '',
  leverage: '10',
  sizeUsd: '100',
}

export default function PositionCalculator() {
  const { showPositionCalculator, togglePositionCalculator } = useUiStore()
  const { setPosition, clearPosition } = useChartStore()
  const [form, setForm] = useState(defaultForm)

  if (!showPositionCalculator) return null

  const metrics = calculatePositionMetrics(form)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleApply = () => {
    setPosition(form)
  }

  const handleClear = () => {
    setForm(defaultForm)
    clearPosition()
  }

  return (
    <div
      className="absolute top-2 right-2 z-20 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calculator size={14} className="text-indigo-400" />
          Position Calculator
        </div>
        <button
          onClick={togglePositionCalculator}
          className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Direction Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            onClick={() => handleChange('direction', 'long')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              form.direction === 'long'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-500 hover:text-gray-400'
            }`}
          >
            LONG
          </button>
          <button
            onClick={() => handleChange('direction', 'short')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              form.direction === 'short'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-500 hover:text-gray-400'
            }`}
          >
            SHORT
          </button>
        </div>

        {/* Input Fields */}
        {[
          { key: 'entry', label: 'Entry Price' },
          { key: 'sl', label: 'Stop Loss' },
          { key: 'tp', label: 'Take Profit' },
          { key: 'leverage', label: 'Leverage (x)' },
          { key: 'sizeUsd', label: 'Size (USD)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</label>
            <input
              type="text"
              inputMode="decimal"
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full mt-0.5 px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-indigo-400 text-gray-200"
            />
          </div>
        ))}

        {/* Results */}
        {metrics && (
          <div className="p-2 rounded bg-gray-950 border border-gray-700 space-y-1">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Results</div>
            <Row label="Risk Amount" value={`$${metrics.riskAmount.toFixed(2)}`} color="text-red-400" />
            <Row label="Reward Amount" value={`$${metrics.rewardAmount.toFixed(2)}`} color="text-emerald-400" />
            <Row label="R:R Ratio" value={`1:${metrics.rrRatio.toFixed(2)}`} />
            <Row label="PnL if TP" value={`+${metrics.pnlIfTp.toFixed(2)}%`} color="text-emerald-400" />
            <Row label="PnL if SL" value={`${metrics.pnlIfSl.toFixed(2)}%`} color="text-red-400" />
            <Row label="Liquidation" value={`$${metrics.liquidationPrice.toFixed(2)}`} color="text-gray-500" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
          >
            Apply to Chart
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-200 bg-gray-800 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, color = 'text-gray-200' }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}
