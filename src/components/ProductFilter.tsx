import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function ProductFilter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const transactions = useStore(s => s.transactions)
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)

  const products = Array.from(new Set(transactions.map(t => t.productName))).sort()
  const allSelected = filters.selectedProducts.length === 0

  function toggleAll() {
    setFilters({ selectedProducts: [] })
  }

  function toggleProduct(name: string) {
    const current = filters.selectedProducts
    if (current.includes(name)) {
      setFilters({ selectedProducts: current.filter(p => p !== name) })
    } else {
      setFilters({ selectedProducts: [...current, name] })
    }
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = allSelected ? 'All products selected' : `${filters.selectedProducts.length} selected`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full bg-[#0b130b] border border-[#1a3a1a] rounded-lg px-3 py-2 text-sm text-[#7a9e7a] flex justify-between items-center hover:border-[#00e676]/50 transition-colors"
      >
        <span className="truncate">{label}</span>
        <span className="text-[#00e676] ml-2 shrink-0">▾</span>
      </button>
      {open && (
        <div className="slim-scroll absolute z-50 top-full left-0 right-0 mt-1 bg-[#0b130b] border border-[#1a3a1a] rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-[#00e676]/5 cursor-pointer border-b border-[#1a3a1a]">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-[#00e676]"
            />
            <span className="text-sm font-semibold text-[#00e676]">ALL</span>
          </label>
          {products.map(name => (
            <label
              key={name}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#00e676]/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={!allSelected && filters.selectedProducts.includes(name)}
                onChange={() => toggleProduct(name)}
                className="accent-[#00e676] shrink-0"
              />
              <span className="text-sm text-[#7a9e7a] truncate">{name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
