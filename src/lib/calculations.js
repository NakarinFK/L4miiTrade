export function calculatePositionMetrics({ direction, entry, sl, tp, leverage, sizeUsd }) {
  const isLong = direction === 'long'
  const entryPrice = parseFloat(entry)
  const slPrice = parseFloat(sl)
  const tpPrice = parseFloat(tp)
  const lev = parseFloat(leverage) || 1
  const size = parseFloat(sizeUsd)

  if (!entryPrice || !size) return null

  const qty = size / entryPrice

  // Risk calculation
  let riskPct = 0
  let riskAmount = 0
  if (slPrice) {
    riskPct = isLong
      ? ((entryPrice - slPrice) / entryPrice) * lev * 100
      : ((slPrice - entryPrice) / entryPrice) * lev * 100
    riskAmount = (riskPct / 100) * size
  }

  // Reward calculation
  let rewardPct = 0
  let rewardAmount = 0
  if (tpPrice) {
    rewardPct = isLong
      ? ((tpPrice - entryPrice) / entryPrice) * lev * 100
      : ((entryPrice - tpPrice) / entryPrice) * lev * 100
    rewardAmount = (rewardPct / 100) * size
  }

  // R:R ratio
  const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0

  // Liquidation price (accounts for Binance tier-1 maintenance margin ~0.4%)
  const MMR = 0.004
  const liquidationPrice = isLong
    ? entryPrice * (1 - 1 / lev + MMR)
    : entryPrice * (1 + 1 / lev - MMR)

  return {
    riskAmount: Math.abs(riskAmount),
    rewardAmount: Math.abs(rewardAmount),
    riskPct: Math.abs(riskPct),
    rewardPct: Math.abs(rewardPct),
    rrRatio: Math.abs(rrRatio),
    liquidationPrice,
    pnlIfTp: rewardPct,
    pnlIfSl: -Math.abs(riskPct),
  }
}

export function calculateTradePnl({ direction, entryPrice, exitPrice, leverage, sizeUsd }) {
  if (!exitPrice || !entryPrice) return { pnlUsd: null, pnlPct: null }
  const isLong = direction === 'long'
  const entry = parseFloat(entryPrice)
  const exit = parseFloat(exitPrice)
  const lev = parseFloat(leverage) || 1
  const size = parseFloat(sizeUsd)

  const pnlPct = isLong
    ? ((exit - entry) / entry) * lev * 100
    : ((entry - exit) / entry) * lev * 100

  const pnlUsd = (pnlPct / 100) * size

  return { pnlUsd, pnlPct }
}

export function calculateTradeStats(trades) {
  const closed = trades.filter((t) => t.status === 'closed' && t.pnl_usd !== null)
  if (closed.length === 0) {
    return {
      totalTrades: 0, winRate: 0, totalPnl: 0, avgRR: 0,
      profitFactor: 0, maxDrawdown: 0, bestTrade: 0, worstTrade: 0,
    }
  }

  const wins = closed.filter((t) => t.pnl_usd > 0)
  const losses = closed.filter((t) => t.pnl_usd <= 0)
  const totalPnl = closed.reduce((s, t) => s + (t.pnl_usd || 0), 0)
  // CALC-3: only average over trades that actually have an R:R (exclude trades with no SL)
  const rrTrades = closed.filter((t) => t.rr_ratio != null)
  const avgRR = rrTrades.length > 0
    ? rrTrades.reduce((s, t) => s + t.rr_ratio, 0) / rrTrades.length
    : 0

  const grossProfit = wins.reduce((s, t) => s + t.pnl_usd, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl_usd, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  // Max drawdown calculation
  let peak = 0
  let maxDD = 0
  let cumPnl = 0
  for (const t of closed.sort((a, b) => new Date(a.close_at) - new Date(b.close_at))) {
    cumPnl += t.pnl_usd || 0
    if (cumPnl > peak) peak = cumPnl
    const dd = peak - cumPnl
    if (dd > maxDD) maxDD = dd
  }

  const pnlPcts = closed.map((t) => t.pnl_pct || 0)

  return {
    totalTrades: closed.length,
    winRate: (wins.length / closed.length) * 100,
    totalPnl,
    avgRR,
    profitFactor,
    maxDrawdown: peak > 0 ? (maxDD / peak) * 100 : 0,
    // BUG-3: use reduce instead of spread to avoid call-stack overflow with large datasets
    bestTrade: pnlPcts.reduce((a, b) => Math.max(a, b), -Infinity),
    worstTrade: pnlPcts.reduce((a, b) => Math.min(a, b), Infinity),
  }
}
