# L4miiTrade — Code Audit & Fix Report

> Reviewed: 2026-03-07
> Stack: React + Vite, Lightweight Charts v5, Binance API, Supabase

---

## Summary

| Category | Found | Fixed |
|----------|-------|-------|
| Critical Bugs | 4 | 4 ✅ |
| Memory Leaks | 3 | 3 ✅ |
| Performance | 2 | 2 ✅ |
| Security | 2 | 2 ✅ |
| Calculation Accuracy | 3 | 3 ✅ |
| Missing UI States | 3 | 3 ✅ |
| **Total** | **17** | **17 ✅** |

---

## 1. Critical Bugs

### BUG-1 — Form resets on save failure
**File:** `src/components/journal/AddTradeForm.jsx:86`
**Severity:** High

**Problem:**
`addTrade()` returns `null` on error but does not throw. The three lines after it (`setSaving`, `setForm(defaultForm)`, `toggleAddTradeForm`) always ran unconditionally, silently losing the user's input on any Supabase error.

```js
// Before
await addTrade(trade)
setSaving(false)
setForm(defaultForm)    // always cleared
toggleAddTradeForm()    // always closed
```

**Fix:**
```js
// After
const result = await addTrade(trade)
setSaving(false)
if (result) {           // only reset on success
  setForm(defaultForm)
  toggleAddTradeForm()
}
```

---

### BUG-2 — Race condition on rapid symbol/interval change
**File:** `src/hooks/useBinanceKlines.js`
**Severity:** High

**Problem:**
No `AbortController` was used on the `fetch` call. If the user switched BTCUSDT → ETHUSDT quickly, the slower BTC response could arrive after the ETH response, painting stale data onto the chart with no way to cancel the in-flight request.

**Fix:**
Added `AbortController` to every fetch. Each new call aborts the previous one. `AbortError` is silently ignored. Also passed `signal` through `fetchKlines` in `binanceApi.js`.

```js
const load = useCallback(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  fetchKlines(symbol, interval, 200, controller.signal)
    .then(klines => { if (!controller.signal.aborted) setData(klines) })
    .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
    .finally(() => { if (!controller.signal.aborted) setLoading(false) })
}, [symbol, interval])
```

---

### BUG-3 — Stack overflow on large trade history
**File:** `src/lib/calculations.js:108`
**Severity:** Medium

**Problem:**
`Math.max(...pnlPcts)` and `Math.min(...pnlPcts)` spread an array into function arguments. V8's call stack limit (~10k items) causes a crash for users with large trade histories (common in prop-firm challenges or algorithmic journaling).

```js
// Before — crashes with ~10k+ trades
bestTrade: Math.max(...pnlPcts),
worstTrade: Math.min(...pnlPcts),
```

**Fix:**
```js
// After — O(n) with no stack growth
bestTrade: pnlPcts.reduce((a, b) => Math.max(a, b), -Infinity),
worstTrade: pnlPcts.reduce((a, b) => Math.min(a, b), Infinity),
```

---

### BUG-4 — API error silently discarded
**File:** `src/components/chart/CandlestickChart.jsx:12`
**Severity:** Medium

**Problem:**
`error` from `useBinanceKlines` was not destructured. On Binance 429/5xx or network failure, the loading spinner disappeared and the chart showed nothing — no feedback to the user.

**Fix:**
Destructure `error` and render a visible overlay:

```jsx
const { data, loading, error } = useBinanceKlines(symbol, interval)

{error && !loading && (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
    <p className="text-red-400 text-sm font-medium">Failed to load chart data</p>
    <p className="text-gray-500 text-xs mt-1">{error}</p>
  </div>
)}
```

---

## 2. Memory Leaks

### LEAK-1 — Re-subscribing `visibleTimeRangeChange` on every mousemove
**File:** `src/components/chart/DrawingCanvas.jsx:324`
**Severity:** High

**Problem:**
`renderDrawings` was a `useCallback` whose deps included `mousePos` (state). Every `mousemove` event triggered `setMousePos` → new `renderDrawings` reference → the subscription effect's cleanup ran (`unsubscribe`) → a new handler was immediately re-subscribed. On an active chart this happened dozens of times per second.

**Fix:**
Introduced a stable `renderRef` (updated via `useLayoutEffect`) so the subscription handler never needs to be replaced:

```js
const renderRef = useRef(renderDrawings)
useLayoutEffect(() => { renderRef.current = renderDrawings }, [renderDrawings])

useEffect(() => {
  const chart = chartRef.current
  if (!chart) return
  const handler = () => renderRef.current()   // stable — never replaced
  chart.timeScale().subscribeVisibleTimeRangeChange(handler)
  return () => { try { chart.timeScale().unsubscribeVisibleTimeRangeChange(handler) } catch(e){} }
}, [symbol, interval])
```

---

### LEAK-2 — Subscription cleanup reads wrong chart instance
**File:** `src/components/chart/DrawingCanvas.jsx:328`
**Severity:** Medium

**Problem:**
The cleanup function used `chartRef.current` at the time cleanup ran. When the chart was recreated (symbol change), `CandlestickChart` had already set `chartRef.current` to the **new** chart by the time `DrawingCanvas`'s cleanup executed — so the code tried to unsubscribe a handler from the wrong chart instance (or a null).

```js
// Before — chartRef.current is the NEW chart at cleanup time
return () => {
  chartRef.current?.timeScale().unsubscribeVisibleTimeRangeChange(handler)
}
```

**Fix:**
Capture the chart instance as a local variable at the start of the effect:

```js
useEffect(() => {
  const chart = chartRef.current   // captured here — stable through cleanup
  if (!chart) return
  const handler = () => renderRef.current()
  chart.timeScale().subscribeVisibleTimeRangeChange(handler)
  return () => { try { chart.timeScale().unsubscribeVisibleTimeRangeChange(handler) } catch(e){} }
}, [symbol, interval])
```

---

### LEAK-3 — WebSocket `disposed` flag outside React's effect closure
**File:** `src/hooks/useBinanceWs.js`, `src/lib/binanceApi.js`
**Severity:** Medium

**Problem:**
The `disposed` flag and all reconnection state lived inside a factory function (`createReconnectingKlineWs`) outside React's control. Two concrete risks:

1. **`onmessage` had no `disposed` guard.** A WebSocket message arriving in the same tick as `close()` (common during symbol switch) would call `onCandle` → `seriesRef.current.update()` on a chart series being torn down, causing a thrown error from Lightweight Charts.
2. The `wsRef` indirection meant lifecycle correctness depended on the ref being threaded properly, rather than on React's guaranteed cleanup ordering.

**Fix:**
Inlined all WebSocket state into the effect closure. Added `if (disposed) return` to every handler. Deleted the now-unused `createReconnectingKlineWs` and `createKlineWebSocket` exports from `binanceApi.js`.

```js
useEffect(() => {
  let disposed = false, ws = null, retryCount = 0, retryTimer = null

  function connect() {
    if (disposed) return
    ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`)
    ws.onopen    = () => { if (disposed) return; /* ... */ }
    ws.onmessage = () => { if (disposed) return; /* ... */ }  // ← new guard
    ws.onerror   = () => { if (!disposed) handleStatus('error') }
    ws.onclose   = () => { if (disposed) return; /* reconnect logic */ }
  }
  connect()

  return () => {
    disposed = true          // stops all callbacks immediately
    clearTimeout(retryTimer)
    if (ws) { ws.close(); ws = null }
  }
}, [symbol, interval, onCandle, handleStatus])
```

---

## 3. Performance Issues

### PERF-1 — Canvas dimensions reset on every render
**File:** `src/components/chart/DrawingCanvas.jsx:197`
**Severity:** Medium

**Problem:**
`canvas.width = rect.width` was called unconditionally on every `renderDrawings` invocation. Setting `canvas.width` or `canvas.height` **always** clears the canvas AND resets all 2D context state (transforms, dash patterns, styles) — even when the dimensions haven't changed. The subsequent `ctx.clearRect` was also redundant.

**Fix:**
Only resize when dimensions actually change:

```js
const newW = Math.round(rect.width)
const newH = Math.round(rect.height)
if (canvas.width !== newW || canvas.height !== newH) {
  canvas.width = newW   // clears canvas as a side effect
  canvas.height = newH
} else {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}
```

---

### PERF-2 — Full canvas repaint on every `mousemove`
**File:** `src/components/chart/DrawingCanvas.jsx`
**Severity:** Medium

**Problem:**
`mousePos` was stored as React state and included in `renderDrawings`'s `useCallback` deps. Every pixel of mouse movement triggered: `setMousePos` → new `renderDrawings` ref → `useEffect([renderDrawings])` fired → full canvas repaint of all drawings. With many drawings this caused visible lag, and also drove LEAK-1 (subscription re-created on every move).

**Fix:**
Demoted `mousePos` from `useState` to `useRef` (`mousePosRef`). `renderDrawings` reads from the ref directly (no dep). `handleMouseMove` calls `renderDrawings()` directly for the preview line instead of going through a state-update → effect chain.

```js
// mousePosRef — no re-renders on update
const mousePosRef = useRef(null)

// renderDrawings reads the ref, no mousePos in deps
const renderDrawings = useCallback(() => {
  const mousePos = mousePosRef.current   // always current value
  // ...draw preview...
}, [drawings, selectedDrawingId, activeTool, clickPoints, chartRef, seriesRef])

// handleMouseMove calls renderDrawings directly
if (activeTool && clickPoints.length > 0) {
  mousePosRef.current = { x: coords.x, y: coords.y }
  renderDrawings()   // direct call, no setState
}
```

---

## 4. Security Issues

### SEC-1 — No user scoping on Supabase queries
**File:** `src/stores/journalStore.js`
**Severity:** Critical

**Problem:**
All four database operations (`fetchTrades`, `addTrade`, `updateTrade`, `deleteTrade`) had no `user_id` filter. Any authenticated user who knew another user's trade `id` could read, modify, or delete their trades. Without Supabase Row-Level Security, **every user could see every trade from every user**.

**Fix:**
Added `getAuthUser()` helper that fetches the current session user. Every operation now guards on authentication and scopes by `user_id`:

```js
// select
query.eq('user_id', user.id)

// insert
{ ...trade, user_id: user.id }

// update / delete — double-scoped for safety
.eq('id', id).eq('user_id', user.id)
```

> **Required server-side action:** Enable RLS on the `trades` table in Supabase and add a policy:
> ```sql
> CREATE POLICY "users_own_trades" ON trades
> FOR ALL USING (auth.uid() = user_id);
> ```

---

### SEC-2 — No authentication layer
**File:** `src/components/auth/AuthGate.jsx` *(new file)*
**Severity:** Critical

**Problem:**
The app had no login/logout flow. The Supabase anon key was used directly, which is safe **only** when RLS is correctly configured. Since the anon key is visible in the browser bundle, anyone could query the API directly if RLS was misconfigured.

**Fix:**
Added `AuthGate` component wrapping the entire app. Features:
- Email + password sign-in and sign-up
- Reads Supabase session on mount, subscribes to auth state changes
- Bypassed when Supabase is not configured (local dev without `.env`)
- Sign-out button in the app header

---

## 5. Calculation Accuracy

### CALC-1 — Liquidation price ignores maintenance margin
**File:** `src/lib/calculations.js:37`
**Severity:** Medium

**Problem:**
```js
// Before — 0% maintenance margin assumed
liquidationPrice = isLong ? entry * (1 - 1/lev) : entry * (1 + 1/lev)
```
Binance Futures requires a maintenance margin (MMR ≈ 0.4% for tier-1). At 10x leverage the old formula gave `entry × 0.900` but Binance liquidates at `entry × 0.904`. The gap widens at higher leverage, giving traders a false sense of safety.

**Fix:**
```js
const MMR = 0.004  // Binance tier-1 cross-margin default
liquidationPrice = isLong
  ? entry * (1 - 1/lev + MMR)
  : entry * (1 + 1/lev - MMR)
```

---

### CALC-2 — "Open" trade stored with calculated PnL
**File:** `src/components/journal/AddTradeForm.jsx:66`
**Severity:** Medium

**Problem:**
```js
// Before
const status = form.exit_price && form.close_at ? 'closed' : 'open'
```
If a user filled `exit_price` but left `close_at` empty, the trade was saved as `status: 'open'` while `pnl_usd` was calculated and stored. `calculateTradeStats` filters on `status === 'closed'`, so the PnL was stored in the DB but never counted in statistics.

**Fix:**
```js
// After — exit_price is the source of truth
const status = form.exit_price ? 'closed' : 'open'
```

---

### CALC-3 — Average R:R diluted by trades with no stop-loss
**File:** `src/lib/calculations.js:82`
**Severity:** Low

**Problem:**
```js
// Before — null rr_ratio becomes 0, dragging down the average
const avgRR = closed.reduce((s, t) => s + (t.rr_ratio || 0), 0) / closed.length
```
Trades logged without a stop-loss have `rr_ratio: null`. These were counted as `0`, making the displayed average R:R lower than the trader's actual discipline.

**Fix:**
```js
const rrTrades = closed.filter(t => t.rr_ratio != null)
const avgRR = rrTrades.length > 0
  ? rrTrades.reduce((s, t) => s + t.rr_ratio, 0) / rrTrades.length
  : 0
```

---

## 6. Missing UI States

### UI-1 — StatsPanel has no loading state
**File:** `src/components/stats/StatsPanel.jsx`
**Severity:** Medium

**Problem:**
While trades were being fetched, `stats.totalTrades === 0` was true, causing the "No closed trades yet" empty state to flash on every page visit before data arrived.

**Fix:**
```jsx
const { trades, fetchTrades, loading } = useJournalStore()

{loading && trades.length === 0 ? (
  <div className="flex items-center justify-center py-16">
    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
  </div>
) : stats.totalTrades === 0 ? (
  // empty state...
)}
```

---

### UI-2 — Delete button has no loading guard
**File:** `src/components/journal/TradeDetail.jsx`
**Severity:** Medium

**Problem:**
`handleDelete` called `await deleteTrade(trade.id)` but the button had no `disabled` state or spinner. Double-clicking would fire two simultaneous delete requests to Supabase.

**Fix:**
```jsx
const [deleting, setDeleting] = useState(false)

const handleDelete = async () => {
  if (!window.confirm('...')) return
  setDeleting(true)
  await deleteTrade(trade.id)
  setSelectedTradeId(null)
}

<button onClick={handleDelete} disabled={deleting}>
  {deleting ? 'Deleting...' : 'Delete'}
</button>
```

---

### UI-3 — Toast ID collision under React 18 batching
**File:** `src/stores/uiStore.js:23`
**Severity:** Low

**Problem:**
```js
{ id: Date.now(), ... }
```
`Date.now()` returns milliseconds. Two toasts queued in the same millisecond (increasingly common with React 18's automatic batching) would share an `id`, causing a React key collision and potentially one toast overriding the other.

**Fix:**
```js
let _toastId = 0

addToast: (toast) => set(state => ({
  toasts: [...state.toasts, { id: ++_toastId, duration: 4000, ...toast }]
}))
```

---

## Additional Changes

### New trading pairs
Added to `src/lib/binanceApi.js`:
```js
export const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT']
```

### New timeframes
Added to `src/lib/binanceApi.js`:
```js
{ label: '3D', value: '3d' },
{ label: '1W', value: '1w' },
{ label: '1M', value: '1M' },   // capital M = monthly (Binance convention)
```

---

## Recommended Next Steps

These items were identified but are out of scope for this audit:

| # | Item | Priority |
|---|------|----------|
| 1 | Enable Supabase RLS with `auth.uid() = user_id` policy | **Critical** |
| 2 | Add `git config --global user.name/email` to fix committer identity | Low |
| 3 | Add pagination or virtual list to `TradeTable` for large datasets | Medium |
| 4 | Add a `git config --global user.name/email` to fix committer identity | Low |
| 5 | Expose `MMR` as a user-configurable field (varies by position size/tier) | Low |
| 6 | Add `3m` and `30m` scalping timeframes if needed | Low |
