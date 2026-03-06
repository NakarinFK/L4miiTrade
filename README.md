# L4miiTrade — Trading Monitor & Journal

A personal crypto futures trading monitor and journal web application focused on Binance. Features real-time candlestick charts, drawing tools, position calculator, and a full trading journal with statistics.

## Features

### Chart Monitor
- **Real-time candlestick chart** powered by Lightweight Charts (TradingView)
- **Live price data** from Binance REST API + WebSocket
- **Timeframe switching**: 1m, 5m, 15m, 1H, 4H, 1D
- **Symbol switching**: BTCUSDT, ETHUSDT
- **Drawing tools**: Horizontal line, Trendline, Rectangle zone
- **Position Calculator**: Entry/SL/TP with auto-calculated R:R, PnL, liquidation price
- Chart overlay with position lines and colored zones

### Trading Journal
- **Add/view trades** with full position details
- **Auto-calculate** PnL (USD & %), R:R ratio on trade entry
- **Sortable & filterable** trade history table
- **Color-coded** rows (green = profit, red = loss)
- **Tags**: breakout, reversal, scalp, swing, etc.
- **Trade detail** modal with full breakdown

### Statistics
- Win rate, total PnL, average R:R
- Profit factor, max drawdown
- Best/worst trade tracking

## Tech Stack
- **React 19** + **Vite 7**
- **Tailwind CSS v4** (Vite plugin)
- **Zustand** (state management)
- **Lightweight Charts v5** (TradingView charting)
- **Supabase** (database)
- **Binance Public API** (price data)
- **Lucide React** (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Schema

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE trades (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol       TEXT NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price  DECIMAL(18,8) NOT NULL,
  exit_price   DECIMAL(18,8),
  leverage     INT NOT NULL DEFAULT 1,
  size_usd     DECIMAL(18,2) NOT NULL,
  tp           DECIMAL(18,8),
  sl           DECIMAL(18,8),
  open_at      TIMESTAMP WITH TIME ZONE NOT NULL,
  close_at     TIMESTAMP WITH TIME ZONE,
  pnl_usd      DECIMAL(18,2),
  pnl_pct      DECIMAL(10,4),
  rr_ratio     DECIMAL(10,4),
  tags         TEXT[],
  note         TEXT,
  status       TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure

```
src/
  components/
    layout/      — Header, Sidebar, MainLayout
    chart/       — CandlestickChart, DrawingToolbar, DrawingCanvas, PositionCalculator, TimeframeBar
    journal/     — AddTradeForm, TradeTable, TradeDetail
    stats/       — StatsPanel
  stores/        — Zustand stores (chartStore, journalStore, uiStore)
  lib/           — supabaseClient, binanceApi, calculations
  pages/         — ChartPage, JournalPage, StatsPage
  hooks/         — useBinanceWs, useBinanceKlines
```

## Notes
- No backend server needed — Binance public API supports CORS
- No authentication in v0.1 (personal use)
- Drawing tools state is in-memory only (not saved to DB)
- Chart Monitor works without Supabase credentials
- Journal/Stats require Supabase connection
