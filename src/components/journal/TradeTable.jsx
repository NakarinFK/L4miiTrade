import { useEffect, useState } from 'react'
import { ArrowUpDown, Filter, X } from 'lucide-react'
import { useJournalStore } from '../../stores/journalStore'
import { useUiStore } from '../../stores/uiStore'
import { SYMBOLS } from '../../lib/binanceApi'

const COLUMNS = [
  { key: 'open_at', label: 'Date' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'direction', label: 'Dir' },
  { key: 'entry_price', label: 'Entry' },
  { key: 'exit_price', label: 'Exit' },
  { key: 'leverage', label: 'Lev' },
  { key: 'size_usd', label: 'Size' },
  { key: 'pnl_usd', label: 'PnL ($)' },
  { key: 'pnl_pct', label: 'PnL (%)' },
  { key: 'rr_ratio', label: 'R:R' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
]

export default function TradeTable() {
  const { trades, loading, fetchTrades, filters, setFilters, resetFilters } = useJournalStore()
  const { setSelectedTradeId } = useUiStore()
  const [sortKey, setSortKey] = useState('open_at')
  const [sortDir, setSortDir] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades, filters])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...trades].sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (sortDir === 'asc') return aVal > bVal ? 1 : -1
    return aVal < bVal ? 1 : -1
  })

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-indigo-400 text-indigo-400 bg-indigo-500/20'
              : 'border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          <Filter size={12} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-4 h-4 flex items-center justify-center text-[9px] bg-indigo-500 text-white rounded-full">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
          >
            <X size={10} />
            Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
          <select
            value={filters.symbol}
            onChange={(e) => setFilters({ symbol: e.target.value })}
            className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Symbols</option>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.direction}
            onChange={(e) => setFilters({ direction: e.target.value })}
            className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Directions</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-400"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-400"
            placeholder="To"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500 font-medium cursor-pointer hover:text-gray-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <ArrowUpDown size={10} className="text-indigo-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && trades.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-gray-500">
                  Loading trades...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-gray-500">
                  No trades found. Add your first trade!
                </td>
              </tr>
            ) : (
              sorted.map((trade) => {
                const isPnlPositive = trade.pnl_usd > 0
                const isPnlNegative = trade.pnl_usd < 0
                const rowBg = isPnlPositive
                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  : isPnlNegative
                  ? 'bg-red-500/5 hover:bg-red-500/10'
                  : 'hover:bg-gray-800'

                return (
                  <tr
                    key={trade.id}
                    onClick={() => setSelectedTradeId(trade.id)}
                    className={`border-b border-gray-700/50 cursor-pointer transition-colors ${rowBg}`}
                  >
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                      {trade.open_at ? new Date(trade.open_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{trade.symbol}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                          trade.direction === 'long'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono">{trade.entry_price}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-400">{trade.exit_price || '-'}</td>
                    <td className="px-3 py-2.5">{trade.leverage}x</td>
                    <td className="px-3 py-2.5 font-mono">${trade.size_usd}</td>
                    <td className={`px-3 py-2.5 font-mono font-medium ${isPnlPositive ? 'text-emerald-400' : isPnlNegative ? 'text-red-400' : 'text-gray-500'}`}>
                      {trade.pnl_usd !== null ? `${trade.pnl_usd >= 0 ? '+' : ''}$${Number(trade.pnl_usd).toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-3 py-2.5 font-mono font-medium ${isPnlPositive ? 'text-emerald-400' : isPnlNegative ? 'text-red-400' : 'text-gray-500'}`}>
                      {trade.pnl_pct !== null ? `${trade.pnl_pct >= 0 ? '+' : ''}${Number(trade.pnl_pct).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-400">
                      {trade.rr_ratio ? `1:${Number(trade.rr_ratio).toFixed(1)}` : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          trade.status === 'open'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : trade.status === 'closed'
                            ? 'bg-gray-500/20 text-gray-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(trade.tags || []).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-800 text-gray-500 border border-gray-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
