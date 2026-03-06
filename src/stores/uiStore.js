import { create } from 'zustand'

let _toastId = 0

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  showPositionCalculator: false,
  togglePositionCalculator: () => set((state) => ({
    showPositionCalculator: !state.showPositionCalculator,
  })),

  showAddTradeForm: false,
  toggleAddTradeForm: () => set((state) => ({
    showAddTradeForm: !state.showAddTradeForm,
  })),

  selectedTradeId: null,
  setSelectedTradeId: (id) => set({ selectedTradeId: id }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: ++_toastId, duration: 4000, ...toast }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}))
