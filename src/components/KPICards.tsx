import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { computeKPIs } from '../lib/computeKPIs'

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0b130b] border border-[#1a3a1a] rounded-lg p-3">
      <p className="text-xs text-[#3a6a3a] uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-[#00e676] mt-1">{value}</p>
    </div>
  )
}

export default function KPICards() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const kpis = useMemo(() => computeKPIs(filteredTransactions), [filteredTransactions])

  return (
    <div className="bg-[#070d07] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-[#3a5a3a] uppercase tracking-widest">KPIs</p>
      <Card
        label="Revenue (L$)"
        value={`${kpis.revenue.toLocaleString()} L$`}
      />
      <Card
        label="Net Amount (L$)"
        value={`${kpis.netAmount.toLocaleString()} L$`}
      />
      <Card label="Total Sales" value={kpis.totalSales.toLocaleString()} />
    </div>
  )
}
