import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useJournalStore } from '../../stores/journalStore'
import { useUiStore } from '../../stores/uiStore'
import { calculateTradePnl, calculatePositionMetrics } from '../../lib/calculations'
import { SYMBOLS } from '../../lib/binanceApi'

const TAG_OPTIONS = ['breakout', 'reversal', 'scalp', 'swing', 'revenge-trade', 'trend-follow', 'range', 'news']

const defaultForm = {
  symbol: 'BTCUSDT',
  direction: 'long',
  entry_price: '',
  exit_price: '',
  leverage: '1',
  size_usd: '',
  tp: '',
  sl: '',
  open_at: new Date().toISOString().slice(0, 16),
  close_at: '',
  tags: [],
  note: '',
}

export default function AddTradeForm() {
  const { showAddTradeForm, toggleAddTradeForm } = useUiStore()
  const { addTrade } = useJournalStore()
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  if (!showAddTradeForm) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  // Auto-calculated preview
  const { pnlUsd, pnlPct } = calculateTradePnl({
    direction: form.direction,
    entryPrice: form.entry_price,
    exitPrice: form.exit_price,
    leverage: form.leverage,
    sizeUsd: form.size_usd,
  })

  const metrics = calculatePositionMetrics({
    direction: form.direction,
    entry: form.entry_price,
    sl: form.sl,
    tp: form.tp,
    leverage: form.leverage,
    sizeUsd: form.size_usd,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // CALC-2: exit_price alone determines closed status; close_at is optional metadata
    const status = form.exit_price ? 'closed' : 'open'
    const trade = {
      symbol: form.symbol,
      direction: form.direction,
      entry_price: parseFloat(form.entry_price),
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      leverage: parseInt(form.leverage),
      size_usd: parseFloat(form.size_usd),
      tp: form.tp ? parseFloat(form.tp) : null,
      sl: form.sl ? parseFloat(form.sl) : null,
      open_at: form.open_at,
      close_at: form.close_at || null,
      pnl_usd: pnlUsd,
      pnl_pct: pnlPct,
      rr_ratio: metrics?.rrRatio || null,
      tags: form.tags,
      note: form.note || null,
      status,
    }

    const result = await addTrade(trade)
    setSaving(false)
    if (result) {
      setForm(defaultForm)
      toggleAddTradeForm()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-sm font-bold">Add New Trade</h2>
          <button
            onClick={toggleAddTradeForm}
            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Symbol + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Symbol</label>
              <select
                value={form.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-200"
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Direction</label>
              <div className="flex mt-1 rounded-lg overflow-hidden border border-gray-700">
                <button
                  type="button"
                  onClick={() => handleChange('direction', 'long')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    form.direction === 'long'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('direction', 'short')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    form.direction === 'short'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Entry Price" value={form.entry_price} onChange={(v) => handleChange('entry_price', v)} required />
            <InputField label="Exit Price" value={form.exit_price} onChange={(v) => handleChange('exit_price', v)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <InputField label="Stop Loss" value={form.sl} onChange={(v) => handleChange('sl', v)} />
            <InputField label="Take Profit" value={form.tp} onChange={(v) => handleChange('tp', v)} />
            <InputField label="Leverage (x)" value={form.leverage} onChange={(v) => handleChange('leverage', v)} required />
          </div>

          <InputField label="Position Size (USD)" value={form.size_usd} onChange={(v) => handleChange('size_usd', v)} required />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Open Date/Time</label>
              <input
                type="datetime-local"
                value={form.open_at}
                onChange={(e) => handleChange('open_at', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-200"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Close Date/Time</label>
              <input
                type="datetime-local"
                value={form.close_at}
                onChange={(e) => handleChange('close_at', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-200"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400'
                      : 'border-gray-700 text-gray-500 hover:text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-200 resize-none"
              placeholder="Trade notes..."
            />
          </div>

          {/* Auto-calculated preview */}
          {(pnlUsd !== null || metrics) && (
            <div className="p-3 rounded-lg bg-gray-950 border border-gray-700 space-y-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Auto-calculated</div>
              {pnlUsd !== null && (
                <>
                  <PreviewRow label="PnL (USD)" value={`${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)}`} color={pnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                  <PreviewRow label="PnL (%)" value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`} color={pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                </>
              )}
              {metrics && (
                <PreviewRow label="R:R Ratio" value={`1:${metrics.rrRatio.toFixed(2)}`} />
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !form.entry_price || !form.size_usd}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : 'Add Trade'}
          </button>
        </form>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-200"
        required={required}
      />
    </div>
  )
}

function PreviewRow({ label, value, color = 'text-gray-200' }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}
