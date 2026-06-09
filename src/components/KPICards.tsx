import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { computeKPIs } from '../lib/computeKPIs'

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1e293b] rounded-lg p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function KPICards() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const kpis = useMemo(() => computeKPIs(filteredTransactions), [filteredTransactions])

  return (
    <div className="bg-[#0f172a] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-slate-500 uppercase tracking-widest">KPIs</p>
      <Card
        label="Revenue (L$)"
        value={`${kpis.revenue.toLocaleString()} L$`}
        sub="excl. free items"
      />
      <Card
        label="Net Amount (L$)"
        value={`${kpis.netAmount.toLocaleString()} L$`}
      />
      <div className="grid grid-cols-2 gap-2">
        <Card label="Total Sales" value={kpis.totalSales.toLocaleString()} />
        <Card label="Avg. Cart" value={`${kpis.avgCart.toLocaleString()} L$`} />
      </div>
    </div>
  )
}
