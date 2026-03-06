import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useJournalStore } from '../../stores/journalStore'
import { useUiStore } from '../../stores/uiStore'

export default function TradeDetail() {
  const { selectedTradeId, setSelectedTradeId } = useUiStore()
  const { trades, deleteTrade } = useJournalStore()
  const [deleting, setDeleting] = useState(false)

  const trade = trades.find((t) => t.id === selectedTradeId)
  if (!trade) return null

  const isPnlPositive = trade.pnl_usd > 0
  const isPnlNegative = trade.pnl_usd < 0

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return
    setDeleting(true)
    await deleteTrade(trade.id)
    setSelectedTradeId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold">{trade.symbol}</h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                trade.direction === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trade.direction}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                trade.status === 'open'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {trade.status}
            </span>
          </div>
          <button
            onClick={() => setSelectedTradeId(null)}
            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Price Info */}
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Entry Price" value={`$${trade.entry_price}`} />
            <DetailRow label="Exit Price" value={trade.exit_price ? `$${trade.exit_price}` : '-'} />
            <DetailRow label="Stop Loss" value={trade.sl ? `$${trade.sl}` : '-'} />
            <DetailRow label="Take Profit" value={trade.tp ? `$${trade.tp}` : '-'} />
            <DetailRow label="Leverage" value={`${trade.leverage}x`} />
            <DetailRow label="Size" value={`$${trade.size_usd}`} />
          </div>

          {/* PnL */}
          {trade.pnl_usd !== null && (
            <div className={`p-3 rounded-lg border ${isPnlPositive ? 'border-emerald-500/30 bg-emerald-500/5' : isPnlNegative ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700 bg-gray-950'}`}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">PnL</div>
                  <div className={`text-sm font-bold ${isPnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.pnl_usd >= 0 ? '+' : ''}${Number(trade.pnl_usd).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">PnL %</div>
                  <div className={`text-sm font-bold ${isPnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.pnl_pct >= 0 ? '+' : ''}{Number(trade.pnl_pct).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">R:R</div>
                  <div className="text-sm font-bold text-gray-200">
                    {trade.rr_ratio ? `1:${Number(trade.rr_ratio).toFixed(1)}` : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <DetailRow
              label="Opened"
              value={trade.open_at ? new Date(trade.open_at).toLocaleString() : '-'}
            />
            <DetailRow
              label="Closed"
              value={trade.close_at ? new Date(trade.close_at).toLocaleString() : '-'}
            />
          </div>

          {/* Tags */}
          {trade.tags && trade.tags.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-400/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {trade.note && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Note</div>
              <p className="text-xs text-gray-400 leading-relaxed">{trade.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-700">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Trash2 size={12} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-gray-200 font-mono">{value}</div>
    </div>
  )
}
