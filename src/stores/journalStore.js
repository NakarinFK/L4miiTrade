import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useUiStore } from './uiStore'

const toast = (opts) => useUiStore.getState().addToast(opts)

async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    toast({ type: 'error', title: 'Not authenticated', message: 'Please sign in.' })
    return null
  }
  return user
}

export const useJournalStore = create((set, get) => ({
  trades: [],
  loading: false,
  error: null,
  filters: {
    symbol: '',
    direction: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  },

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  resetFilters: () => set({
    filters: { symbol: '', direction: '', status: '', dateFrom: '', dateTo: '' },
  }),

  fetchTrades: async () => {
    if (!supabase) {
      toast({ type: 'warning', title: 'Supabase not configured', message: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' })
      return
    }
    const user = await getAuthUser()
    if (!user) return

    set({ loading: true, error: null })
    try {
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { filters } = get()
      if (filters.symbol) query = query.eq('symbol', filters.symbol)
      if (filters.direction) query = query.eq('direction', filters.direction)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('open_at', filters.dateFrom)
      if (filters.dateTo) query = query.lte('open_at', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      set({ trades: data || [], loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
      toast({ type: 'error', title: 'Failed to fetch trades', message: error.message })
    }
  },

  addTrade: async (trade) => {
    if (!supabase) {
      toast({ type: 'warning', title: 'Supabase not configured' })
      return null
    }
    const user = await getAuthUser()
    if (!user) return null

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{ ...trade, user_id: user.id }])
        .select()
        .single()
      if (error) throw error
      set((state) => ({ trades: [data, ...state.trades], loading: false }))
      toast({ type: 'success', title: 'Trade added', message: `${trade.symbol} ${trade.direction.toUpperCase()}` })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      toast({ type: 'error', title: 'Failed to add trade', message: error.message })
      return null
    }
  },

  updateTrade: async (id, updates) => {
    if (!supabase) return null
    const user = await getAuthUser()
    if (!user) return null

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      set((state) => ({
        trades: state.trades.map((t) => (t.id === id ? data : t)),
        loading: false,
      }))
      toast({ type: 'success', title: 'Trade updated' })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      toast({ type: 'error', title: 'Failed to update trade', message: error.message })
      return null
    }
  },

  deleteTrade: async (id) => {
    if (!supabase) return
    const user = await getAuthUser()
    if (!user) return

    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      set((state) => ({
        trades: state.trades.filter((t) => t.id !== id),
        loading: false,
      }))
      toast({ type: 'success', title: 'Trade deleted' })
    } catch (error) {
      set({ error: error.message, loading: false })
      toast({ type: 'error', title: 'Failed to delete trade', message: error.message })
    }
  },
}))
