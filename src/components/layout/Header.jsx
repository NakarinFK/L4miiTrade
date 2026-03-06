import { useChartStore } from '../../stores/chartStore'
import { SYMBOLS } from '../../lib/binanceApi'
import { supabase } from '../../lib/supabaseClient'
import { Activity, LogOut } from 'lucide-react'

export default function Header() {
  const { symbol, setSymbol } = useChartStore()

  const handleSignOut = async () => {
    await supabase?.auth.signOut()
  }

  return (
    <header className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 border-b border-gray-700 bg-gray-900">
      <div className="flex items-center gap-2 md:gap-3">
        <Activity size={20} className="text-indigo-400 md:w-6 md:h-6" />
        <h1 className="text-sm md:text-lg font-bold tracking-wide">
          <span className="text-indigo-400">L4mii</span>
          <span className="text-gray-200">Trade</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1.5 md:gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider hidden sm:block">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {supabase && (
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  )
}
