import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '../../store/useStore'
import { groupByProduct } from '../../lib/computeKPIs'

export default function TopArticlesChart() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const chartMetric = useStore(s => s.chartMetric)

  const data = useMemo(() => groupByProduct(filteredTransactions), [filteredTransactions])
  const dataKey = chartMetric === 'revenue' ? 'revenue' : 'volume'

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36 + 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="productName"
          width={200}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 28) + '…' : v)}
        />
        <Tooltip
          contentStyle={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
          }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#3b82f6' }}
        />
        <Bar dataKey={dataKey} fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
