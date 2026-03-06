import { create } from 'zustand'

export const useChartStore = create((set) => ({
  symbol: 'BTCUSDT',
  interval: '1h',
  setSymbol: (symbol) => set({ symbol }),
  setInterval: (interval) => set({ interval }),

  // Drawing tools state
  activeTool: null, // null | 'horizontal' | 'trendline' | 'rectangle'
  drawingColor: '#6366f1',
  drawings: [],
  selectedDrawingId: null,
  setActiveTool: (tool) => set({ activeTool: tool, selectedDrawingId: null }),
  setDrawingColor: (color) => set({ drawingColor: color }),
  addDrawing: (drawing) => set((state) => ({
    drawings: [...state.drawings, { ...drawing, color: state.drawingColor, id: Date.now().toString() }],
  })),
  updateDrawing: (id, updates) => set((state) => ({
    drawings: state.drawings.map((d) => (d.id === id ? { ...d, ...updates } : d)),
  })),
  removeDrawing: (id) => set((state) => ({
    drawings: state.drawings.filter((d) => d.id !== id),
    selectedDrawingId: null,
  })),
  selectDrawing: (id) => set({ selectedDrawingId: id, activeTool: null }),
  clearDrawings: () => set({ drawings: [], selectedDrawingId: null }),

  // Position calculator
  position: null,
  setPosition: (position) => set({ position }),
  clearPosition: () => set({ position: null }),
}))
