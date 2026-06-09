import type { Transaction } from '../types'

export interface KPIs {
  revenue: number
  netAmount: number
  totalSales: number
  avgCart: number
}

export function computeKPIs(transactions: Transaction[]): KPIs {
  const paid = transactions.filter(t => t.price > 0)
  const revenue = paid.reduce((sum, t) => sum + t.price, 0)
  const netAmount = paid.reduce((sum, t) => sum + t.netAmount, 0)
  const totalSales = transactions.length
  const avgCart = paid.length > 0 ? Math.round(revenue / paid.length) : 0
  return { revenue, netAmount, totalSales, avgCart }
}

export interface TimePoint {
  label: string
  revenue: number
  volume: number
}

export function groupByTime(
  transactions: Transaction[],
  dateStart: Date | null,
  dateEnd: Date | null,
): TimePoint[] {
  if (transactions.length === 0) return []

  const effectiveStart = dateStart ?? new Date(Math.min(...transactions.map(t => t.date.getTime())))
  const effectiveEnd = dateEnd ?? new Date(Math.max(...transactions.map(t => t.date.getTime())))
  const rangeMs = effectiveEnd.getTime() - effectiveStart.getTime()
  const byMonth = rangeMs > 90 * 24 * 60 * 60 * 1000

  const map = new Map<string, { revenue: number; volume: number }>()

  for (const t of transactions) {
    const d = t.date
    const label = byMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const entry = map.get(label) ?? { revenue: 0, volume: 0 }
    entry.volume++
    if (t.price > 0) entry.revenue += t.price
    map.set(label, entry)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, ...data }))
}

export interface ProductStat {
  productName: string
  revenue: number
  volume: number
}

export function groupByProduct(transactions: Transaction[]): ProductStat[] {
  const map = new Map<string, { revenue: number; volume: number }>()

  for (const t of transactions) {
    const entry = map.get(t.productName) ?? { revenue: 0, volume: 0 }
    entry.volume++
    if (t.price > 0) entry.revenue += t.price
    map.set(t.productName, entry)
  }

  return Array.from(map.entries())
    .map(([productName, data]) => ({ productName, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
}

export interface HeatCell {
  day: number
  hour: number
  volume: number
}

export function buildHeatmap(transactions: Transaction[]): HeatCell[] {
  const map = new Map<string, number>()

  for (const t of transactions) {
    const day = (t.date.getDay() + 6) % 7 // Sun=0 → Mon=0
    const hour = t.date.getHours()
    const key = `${day}-${hour}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  const cells: HeatCell[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, volume: map.get(`${day}-${hour}`) ?? 0 })
    }
  }
  return cells
}
