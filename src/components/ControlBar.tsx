import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { useStore } from '../store/useStore'
import ProductFilter from './ProductFilter'
import PreferencesModal from './PreferencesModal'

export default function ControlBar() {
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)
  const [prefsOpen, setPrefsOpen] = useState(false)

  function setAll() {
    setFilters({ dateStart: null, dateEnd: null })
  }

  function setLastYear() {
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - 1)
    setFilters({ dateStart: start, dateEnd: end })
  }

  function setYMinus1() {
    const end = new Date()
    end.setFullYear(end.getFullYear() - 1)
    const start = new Date(end)
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
    <div className="bg-[#070d07] rounded-xl p-4 flex flex-col gap-3 h-full">
      <p className="text-xs text-[#3a5a3a] uppercase tracking-widest">Controls</p>

      <div>
        <p className="text-xs text-[#3a5a3a] uppercase tracking-wider mb-1.5">Date Range</p>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={filters.dateStart}
            onChange={(date: Date | null) => setFilters({ dateStart: date })}
            selectsStart
            startDate={filters.dateStart ?? undefined}
            endDate={filters.dateEnd ?? undefined}
            placeholderText="Start date"
            dateFormat="yyyy-MM-dd"
            className="bg-[#0b130b] border border-[#1a3a1a] rounded-lg px-3 py-1.5 text-sm text-[#7a9e7a] w-full cursor-pointer"
          />
          <span className="text-[#3a5a3a] shrink-0">→</span>
          <DatePicker
            selected={filters.dateEnd}
            onChange={(date: Date | null) => setFilters({ dateEnd: date })}
            selectsEnd
            startDate={filters.dateStart ?? undefined}
            endDate={filters.dateEnd ?? undefined}
            minDate={filters.dateStart ?? undefined}
            placeholderText="End date"
            dateFormat="yyyy-MM-dd"
            className="bg-[#0b130b] border border-[#1a3a1a] rounded-lg px-3 py-1.5 text-sm text-[#7a9e7a] w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'All', fn: setAll, active: isAll },
          { label: 'Last Year', fn: setLastYear, active: false },
          { label: 'Y-1', fn: setYMinus1, active: false },
          { label: 'Last Month', fn: setLastMonth, active: false },
        ].map(({ label, fn, active }) => (
          <button
            key={label}
            onClick={fn}
            className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
              active
                ? 'border-[#00e676] text-[#00e676]'
                : 'border-[#1a3a1a] text-[#3a6a3a] hover:border-[#00e676]/50 hover:text-[#00e676]/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-[#3a5a3a] uppercase tracking-wider mb-1.5">Filter by Product</p>
        <ProductFilter />
      </div>

      <div className="mt-auto">
        <button
          onClick={() => setPrefsOpen(true)}
          className="text-[#3a6a3a] hover:text-[#00e676] transition-colors"
          title="Preferences"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  )
}
