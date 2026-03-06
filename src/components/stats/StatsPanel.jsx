import { useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, BarChart3, Percent, DollarSign } from 'lucide-react'
import { useJournalStore } from '../../stores/journalStore'
import { calculateTradeStats } from '../../lib/calculations'

export default function StatsPanel() {
  const { trades, fetchTrades, loading } = useJournalStore()

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const stats = calculateTradeStats(trades)

  const cards = [
    {
      label: 'Total Trades',
      value: stats.totalTrades,
      icon: BarChart3,
      color: 'text-indigo-400',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Percent,
      color: stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Total PnL',
      value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`,
      icon: DollarSign,
      color: stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Avg R:R',
      value: stats.avgRR.toFixed(2),
      icon: Target,
      color: 'text-indigo-400',
    },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2),
      icon: Award,
      color: stats.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Max Drawdown',
      value: `-${stats.maxDrawdown.toFixed(1)}%`,
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      label: 'Best Trade',
      value: `+${stats.bestTrade.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Worst Trade',
      value: `${stats.worstTrade.toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Trading Statistics</h2>
        <p className="text-xs text-gray-500 mt-1">Aggregated from all closed trades</p>
      </div>

      {loading && trades.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats.totalTrades === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <BarChart3 size={48} className="mb-4 opacity-30" />
          <p className="text-sm">No closed trades yet</p>
          <p className="text-xs mt-1">Statistics will appear once you close your first trade</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 bg-gray-900 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={color} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
