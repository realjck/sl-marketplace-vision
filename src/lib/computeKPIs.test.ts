import { describe, it, expect } from 'vitest'
import { computeKPIs, groupByTime, groupByProduct, buildHeatmap } from './computeKPIs'
import type { Transaction } from '../types'

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    orderId: 1,
    date: new Date('2024-06-15T14:00:00Z'),
    sku: 'SKU',
    productName: 'Product A',
    orderItemId: 1,
    buyer: 'Buyer',
    recipient: 'Recipient',
    price: 480,
    status: 'Delivered',
    commission: 48,
    allocations: 0,
    netAmount: 432,
    ...overrides,
  }
}

describe('computeKPIs', () => {
  it('sums revenue from paid transactions only', () => {
    const txs = [tx({ price: 480, netAmount: 432 }), tx({ orderId: 2, price: 0, netAmount: 0 })]
    const kpis = computeKPIs(txs)
    expect(kpis.revenue).toBe(480)
    expect(kpis.netAmount).toBe(432)
  })

  it('counts all transactions in totalSales including free', () => {
    const txs = [tx(), tx({ orderId: 2, price: 0, netAmount: 0 })]
    expect(computeKPIs(txs).totalSales).toBe(2)
  })

  it('computes avgCart from paid transactions only', () => {
    const txs = [tx({ price: 480 }), tx({ orderId: 2, price: 120 }), tx({ orderId: 3, price: 0 })]
    expect(computeKPIs(txs).avgCart).toBe(300)
  })

  it('returns avgCart of 0 when no paid transactions', () => {
    expect(computeKPIs([tx({ price: 0, netAmount: 0 })]).avgCart).toBe(0)
  })

  it('returns zeros for empty array', () => {
    const kpis = computeKPIs([])
    expect(kpis.revenue).toBe(0)
    expect(kpis.totalSales).toBe(0)
    expect(kpis.avgCart).toBe(0)
  })
})

describe('groupByTime', () => {
  it('groups by day when range <= 90 days', () => {
    const start = new Date('2024-06-01')
    const end = new Date('2024-06-30')
    const txs = [tx({ date: new Date('2024-06-15T14:00:00Z') })]
    const points = groupByTime(txs, start, end)
    expect(points[0].label).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('groups by month when range > 90 days', () => {
    const start = new Date('2024-01-01')
    const end = new Date('2024-12-31')
    const txs = [tx({ date: new Date('2024-06-15T14:00:00Z') })]
    const points = groupByTime(txs, start, end)
    expect(points[0].label).toMatch(/^\d{4}-\d{2}$/)
  })

  it('excludes free items from revenue but counts in volume', () => {
    const start = new Date('2024-06-01')
    const end = new Date('2024-06-30')
    const txs = [
      tx({ price: 480 }),
      tx({ orderId: 2, price: 0 }),
    ]
    const points = groupByTime(txs, start, end)
    const june15 = points.find(p => p.label === '2024-06-15')!
    expect(june15.volume).toBe(2)
    expect(june15.revenue).toBe(480)
  })

  it('returns empty array for no transactions', () => {
    expect(groupByTime([], null, null)).toHaveLength(0)
  })

  it('sorts points chronologically', () => {
    const txs = [
      tx({ date: new Date('2024-06-20') }),
      tx({ orderId: 2, date: new Date('2024-06-10') }),
    ]
    const points = groupByTime(txs, new Date('2024-06-01'), new Date('2024-06-30'))
    expect(points[0].label < points[1].label).toBe(true)
  })
})

describe('groupByProduct', () => {
  it('aggregates volume and revenue by productName', () => {
    const txs = [
      tx({ price: 480 }),
      tx({ orderId: 2, price: 120 }),
      tx({ orderId: 3, productName: 'Product B', price: 300 }),
    ]
    const stats = groupByProduct(txs)
    const a = stats.find(s => s.productName === 'Product A')!
    expect(a.volume).toBe(2)
    expect(a.revenue).toBe(600)
  })

  it('sorts by revenue descending', () => {
    const txs = [
      tx({ productName: 'Cheap', price: 10 }),
      tx({ orderId: 2, productName: 'Expensive', price: 500 }),
    ]
    const stats = groupByProduct(txs)
    expect(stats[0].productName).toBe('Expensive')
  })

  it('excludes free items from revenue', () => {
    const txs = [tx({ price: 0, netAmount: 0 })]
    const stats = groupByProduct(txs)
    expect(stats[0].revenue).toBe(0)
    expect(stats[0].volume).toBe(1)
  })
})

describe('buildHeatmap', () => {
  it('returns exactly 168 cells (7 days × 24 hours)', () => {
    expect(buildHeatmap([])).toHaveLength(168)
  })

  it('maps a Monday midnight transaction to day=0 hour=0', () => {
    // "2024-06-17T00:00:00" parsed as local midnight on a Monday
    const txs = [tx({ date: new Date('2024-06-17T00:00:00') })]
    const cells = buildHeatmap(txs)
    const cell = cells.find(c => c.day === 0 && c.hour === 0)
    expect(cell?.volume).toBe(1)
  })

  it('all cells have volume 0 for empty transactions', () => {
    const cells = buildHeatmap([])
    expect(cells.every(c => c.volume === 0)).toBe(true)
  })

  it('accumulates multiple transactions in the same slot', () => {
    const txs = [
      tx({ date: new Date('2024-06-17T00:00:00') }),
      tx({ orderId: 2, date: new Date('2024-06-17T00:00:00') }),
    ]
    const cells = buildHeatmap(txs)
    const cell = cells.find(c => c.day === 0 && c.hour === 0)
    expect(cell?.volume).toBe(2)
  })
})
