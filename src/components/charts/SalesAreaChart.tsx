import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '../../store/useStore'
import { groupByTime } from '../../lib/computeKPIs'

export default function SalesAreaChart() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const chartMetric = useStore(s => s.chartMetric)
  const filters = useStore(s => s.filters)

  const data = useMemo(
    () => groupByTime(filteredTransactions, filters.dateStart, filters.dateEnd),
    [filteredTransactions, filters.dateStart, filters.dateEnd],
  )

  const dataKey = chartMetric === 'revenue' ? 'revenue' : 'volume'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00e676" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d1a0d" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#3a6a3a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#3a6a3a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
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
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#00e676"
          strokeWidth={2}
          fill="url(#areaGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
