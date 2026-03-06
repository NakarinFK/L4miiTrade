import { useChartStore } from '../../stores/chartStore'
import { TIMEFRAMES } from '../../lib/binanceApi'

export default function TimeframeBar() {
  const { interval, setInterval } = useChartStore()

  return (
    <div className="flex items-center gap-1">
      {TIMEFRAMES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setInterval(value)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            interval === value
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
