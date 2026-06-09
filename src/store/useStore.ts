import { create } from 'zustand'
import type { Transaction, ChartTab, ChartMetric } from '../types'
import { loadAllTransactions, clearAllTransactions } from '../db/database'

interface Filters {
  dateStart: Date | null
  dateEnd: Date | null
  selectedProducts: string[]
}

export interface ImportStatus {
  state: 'idle' | 'loading' | 'success' | 'error'
  message: string
  count: number
}

interface Store {
  transactions: Transaction[]
  filters: Filters
  filteredTransactions: Transaction[]
  importStatus: ImportStatus
  activeTab: ChartTab
  chartMetric: ChartMetric

  loadFromDB: () => Promise<void>
  setImportStatus: (status: ImportStatus) => void
  setFilters: (partial: Partial<Filters>) => void
  resetData: () => Promise<void>
  setActiveTab: (tab: ChartTab) => void
  setChartMetric: (metric: ChartMetric) => void
}

function applyFilters(transactions: Transaction[], filters: Filters): Transaction[] {
  return transactions.filter(t => {
    if (filters.dateStart && t.date < filters.dateStart) return false
    if (filters.dateEnd && t.date > filters.dateEnd) return false
    if (filters.selectedProducts.length > 0 && !filters.selectedProducts.includes(t.productName)) return false
    return true
  })
}

export const useStore = create<Store>((set, get) => ({
  transactions: [],
  filters: { dateStart: null, dateEnd: null, selectedProducts: [] },
  filteredTransactions: [],
  importStatus: { state: 'idle', message: '', count: 0 },
  activeTab: 'area',
  chartMetric: 'revenue',

  loadFromDB: async () => {
    const transactions = await loadAllTransactions()
    set({ transactions, filteredTransactions: applyFilters(transactions, get().filters) })
  },

  setImportStatus: (importStatus) => set({ importStatus }),

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial }
    set({ filters, filteredTransactions: applyFilters(get().transactions, filters) })
  },

  resetData: async () => {
    await clearAllTransactions()
    set({
      transactions: [],
      filteredTransactions: [],
      importStatus: { state: 'idle', message: '', count: 0 },
    })
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setChartMetric: (chartMetric) => set({ chartMetric }),
}))
