const BASE_URL = 'https://api.binance.com/api/v3'

export const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
]
export const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
]

export async function fetchKlines(symbol, interval, limit = 200, signal) {
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const response = await fetch(url, signal ? { signal } : undefined)
  if (!response.ok) throw new Error(`Failed to fetch klines: ${response.statusText}`)
  const data = await response.json()
  return data.map((k) => ({
    time: k[0] / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

