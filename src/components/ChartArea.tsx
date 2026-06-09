import { useStore } from '../store/useStore'
import SalesAreaChart from './charts/SalesAreaChart'
import TopArticlesChart from './charts/TopArticlesChart'
import type { ChartTab } from '../types'

const TABS: { id: ChartTab; label: string }[] = [
  { id: 'area', label: 'Sales Over Time' },
  { id: 'bar', label: 'Top Articles' },
]

export default function ChartArea() {
  const activeTab = useStore(s => s.activeTab)
  const setActiveTab = useStore(s => s.setActiveTab)
  const chartMetric = useStore(s => s.chartMetric)
  const setChartMetric = useStore(s => s.setChartMetric)

  return (
    <div className="bg-[#0f172a] rounded-xl p-4 flex-1">
      <div className="flex items-center gap-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-[#1e293b] text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1.5">
          {(['revenue', 'volume'] as const).map(m => (
            <button
              key={m}
              onClick={() => setChartMetric(m)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                chartMetric === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1e293b] text-slate-500 hover:text-slate-300'
              }`}
            >
              {m === 'revenue' ? 'Revenue L$' : 'Volume'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'area' && <SalesAreaChart />}
      {activeTab === 'bar' && <TopArticlesChart />}
    </div>
  )
}
