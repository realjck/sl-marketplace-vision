import DatePicker from 'react-datepicker'
import { useStore } from '../store/useStore'
import ProductFilter from './ProductFilter'

export default function ControlBar() {
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)

  function setAll() {
    setFilters({ dateStart: null, dateEnd: null })
  }

  function setLastYear() {
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - 1)
    setFilters({ dateStart: start, dateEnd: end })
  }

  function setLastMonth() {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setFilters({ dateStart: start, dateEnd: end })
  }

  const isAll = !filters.dateStart && !filters.dateEnd

  return (
    <div className="bg-[#0f172a] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-slate-500 uppercase tracking-widest">Controls</p>

      <div>
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-1.5">Date Range</p>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={filters.dateStart}
            onChange={(date: Date | null) => setFilters({ dateStart: date })}
            selectsStart
            startDate={filters.dateStart ?? undefined}
            endDate={filters.dateEnd ?? undefined}
            placeholderText="Start date"
            dateFormat="yyyy-MM-dd"
            className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 w-full cursor-pointer"
          />
          <span className="text-slate-600 shrink-0">→</span>
          <DatePicker
            selected={filters.dateEnd}
            onChange={(date: Date | null) => setFilters({ dateEnd: date })}
            selectsEnd
            startDate={filters.dateStart ?? undefined}
            endDate={filters.dateEnd ?? undefined}
            minDate={filters.dateStart ?? undefined}
            placeholderText="End date"
            dateFormat="yyyy-MM-dd"
            className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { label: 'All', fn: setAll, active: isAll },
          { label: 'Last Year', fn: setLastYear, active: false },
          { label: 'Last Month', fn: setLastMonth, active: false },
        ].map(({ label, fn, active }) => (
          <button
            key={label}
            onClick={fn}
            className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
              active
                ? 'border-blue-500 text-blue-400'
                : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-1.5">Filter by Product</p>
        <ProductFilter />
      </div>
    </div>
  )
}
