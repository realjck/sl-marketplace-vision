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
  const chartHeight = Math.max(280, data.length * 36 + 40)

  return (
    <div className="chart-scroll overflow-y-auto" style={{ height: 280 }}>
      <div style={{ height: chartHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#0d1a0d" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#3a6a3a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="productName"
              width={200}
              tick={{ fill: '#7a9e7a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 28) + '…' : v)}
            />
            <Tooltip
              contentStyle={{
                background: '#0b130b',
                border: '1px solid #1a3a1a',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#7a9e7a' }}
              itemStyle={{ color: '#00e676' }}
            />
            <Bar dataKey={dataKey} fill="#00e676" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
