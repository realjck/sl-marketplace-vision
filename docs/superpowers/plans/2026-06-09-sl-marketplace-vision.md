# SL Marketplace Vision — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side React dashboard that imports Second Life CSV sales exports, stores them in IndexedDB, and visualizes them with an area chart, horizontal bar chart, and heatmap.

**Architecture:** Vite + React 18 SPA with Tailwind CSS v4 for styling, Recharts for charts, Dexie.js for IndexedDB, and Zustand for global state. Pure logic (CSV parsing, KPI calculations) is separated into testable lib modules; React components are thin rendering layers over store state.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, Recharts, react-dropzone, PapaParse, Dexie.js, Zustand, react-datepicker, Vitest

---

## File Map

```
src/
  types.ts                          — Transaction type, ChartTab, ChartMetric
  main.tsx                          — React entry point
  App.tsx                           — Root layout, CSS grid, loads DB on mount
  index.css                         — @import "tailwindcss"
  db/
    database.ts                     — Dexie schema + DB helper functions
  lib/
    csvParser.ts                    — PapaParse wrapper, column-index parsing, validation
    csvParser.test.ts               — unit tests
    computeKPIs.ts                  — KPI calcs, groupByTime, groupByProduct, buildHeatmap
    computeKPIs.test.ts             — unit tests
  store/
    useStore.ts                     — Zustand store (transactions, filters, importStatus)
  components/
    Dropzone.tsx                    — react-dropzone, calls parser + db + store
    ControlBar.tsx                  — DatePicker, quick selectors, ProductFilter
    ProductFilter.tsx               — multi-select dropdown with ALL toggle
    KPICards.tsx                    — 4 stat cards (Revenue, Net, Total Sales, Avg Cart)
    ChartArea.tsx                   — tab switcher + Revenue/Volume toggle
    PreferencesModal.tsx            — fixed button + reset modal with confirmation
    charts/
      SalesAreaChart.tsx            — Recharts AreaChart (smoothed)
      TopArticlesChart.tsx          — Recharts BarChart (horizontal)
      SalesHeatmap.tsx              — custom 7×24 grid component
  test/
    setup.ts                        — @testing-library/jest-dom import
```

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/index.css`, `src/main.tsx`, `index.html`, `.gitignore`

- [ ] **Step 1: Scaffold Vite React TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted about non-empty directory, select **"Ignore files and continue"**.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install recharts react-dropzone papaparse dexie zustand react-datepicker
npm install -D @types/papaparse @types/react-datepicker tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @vitest/coverage-v8 jsdom
```

- [ ] **Step 3: Configure Tailwind v4 in vite.config.ts**

Replace the full content of `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Set up global CSS**

Replace `src/index.css` entirely:

```css
@import "tailwindcss";

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #0a0f1e;
}

/* react-datepicker dark theme overrides */
.react-datepicker {
  background: #1e293b !important;
  border: 1px solid #334155 !important;
  font-family: inherit !important;
}
.react-datepicker__header {
  background: #0f172a !important;
  border-bottom: 1px solid #334155 !important;
}
.react-datepicker__current-month,
.react-datepicker__day-name,
.react-datepicker__day {
  color: #94a3b8 !important;
}
.react-datepicker__day:hover {
  background: #334155 !important;
}
.react-datepicker__day--selected,
.react-datepicker__day--in-range {
  background: #3b82f6 !important;
  color: #fff !important;
}
.react-datepicker__navigation-icon::before {
  border-color: #64748b !important;
}
```

- [ ] **Step 5: Create vitest setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script and update .gitignore**

In `package.json`, ensure the scripts section includes:
```json
"test": "vitest",
"test:run": "vitest run"
```

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, browser shows default React app at http://localhost:5173

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React TypeScript project with Tailwind v4 and Vitest"
```

---

## Task 2: TypeScript types + Dexie database

**Files:**
- Create: `src/types.ts`
- Create: `src/db/database.ts`

- [ ] **Step 1: Create types.ts**

Create `src/types.ts`:

```ts
export interface Transaction {
  orderId: number
  date: Date
  sku: string
  productName: string
  orderItemId: number
  buyer: string
  recipient: string
  price: number
  status: string
  commission: number
  allocations: number
  netAmount: number
}

export type ChartTab = 'area' | 'bar' | 'heatmap'
export type ChartMetric = 'revenue' | 'volume'
```

- [ ] **Step 2: Create database.ts**

Create `src/db/database.ts`:

```ts
import Dexie, { type Table } from 'dexie'
import type { Transaction } from '../types'

class MarketDB extends Dexie {
  transactions!: Table<Transaction, number>

  constructor() {
    super('sl-marketplace')
    this.version(1).stores({
      transactions: 'orderId, date, productName, price',
    })
  }
}

export const db = new MarketDB()

export async function getExistingOrderIds(): Promise<Set<number>> {
  const ids = await db.transactions.orderBy('orderId').primaryKeys()
  return new Set(ids as number[])
}

export async function insertTransactions(rows: Transaction[]): Promise<void> {
  await db.transactions.bulkPut(rows)
}

export async function loadAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').toArray()
}

export async function clearAllTransactions(): Promise<void> {
  await db.transactions.clear()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/db/database.ts
git commit -m "feat: add Transaction types and Dexie IndexedDB schema"
```

---

## Task 3: CSV parser (TDD)

**Files:**
- Create: `src/lib/csvParser.ts`
- Create: `src/lib/csvParser.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/csvParser.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseCSV } from './csvParser'

const HEADER = 'Date,Commande #,SKU,Article,ItemID,Acheteur,Dest,Prix,État,Commission,Alloc,Net'

function row(orderId: number, status = 'Delivered', price = 480) {
  return `31/12/2024 14 h 13 +00:00,${orderId},SKU,Product A,578275916,Buyer,Recipient,${price},${status},48,0,432`
}

describe('parseCSV', () => {
  it('parses a valid delivered row', () => {
    const csv = [HEADER, row(1001)].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.errors).toHaveLength(0)
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].orderId).toBe(1001)
    expect(result.transactions[0].price).toBe(480)
    expect(result.transactions[0].netAmount).toBe(432)
    expect(result.transactions[0].productName).toBe('Product A')
  })

  it('parses the date correctly', () => {
    const csv = [HEADER, row(1001)].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.transactions[0].date).toBeInstanceOf(Date)
    expect(result.transactions[0].date.getFullYear()).toBe(2024)
    expect(result.transactions[0].date.getMonth()).toBe(11) // December = 11
    expect(result.transactions[0].date.getDate()).toBe(31)
  })

  it('skips non-Delivered rows', () => {
    const csv = [HEADER, row(1001, 'Cancelled')].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.transactions).toHaveLength(0)
    expect(result.skipped).toBe(1)
  })

  it('deduplicates against existing IDs', () => {
    const csv = [HEADER, row(1001), row(1002)].join('\n')
    const result = parseCSV(csv, new Set([1001]))
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].orderId).toBe(1002)
    expect(result.skipped).toBe(1)
  })

  it('deduplicates within the same file', () => {
    const csv = [HEADER, row(1001), row(1001)].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.transactions).toHaveLength(1)
    expect(result.skipped).toBe(1)
  })

  it('includes free items (price=0)', () => {
    const csv = [HEADER, row(1001, 'Delivered', 0)].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].price).toBe(0)
  })

  it('handles multiple files via accumulated existingIds', () => {
    const csv = [HEADER, row(1002)].join('\n')
    const existing = new Set([1001])
    parseCSV([HEADER, row(1001)].join('\n'), existing) // modifies existing
    const result = parseCSV(csv, existing)
    expect(result.transactions).toHaveLength(1)
  })

  it('returns error when column count is wrong', () => {
    const csv = [HEADER, '31/12/2024 14 h 13 +00:00,1001,SKU'].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/12 columns/)
  })

  it('returns error for invalid date in first data row', () => {
    const badRow = `NOTADATE,1001,SKU,Product A,578275916,Buyer,Recipient,480,Delivered,48,0,432`
    const csv = [HEADER, badRow].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/date/)
  })

  it('returns error for non-numeric price in first data row', () => {
    const badRow = `31/12/2024 14 h 13 +00:00,1001,SKU,Product A,578275916,Buyer,Recipient,NOTANUMBER,Delivered,48,0,432`
    const csv = [HEADER, badRow].join('\n')
    const result = parseCSV(csv, new Set())
    expect(result.errors).toHaveLength(1)
  })

  it('returns error for empty file', () => {
    const result = parseCSV('', new Set())
    expect(result.errors).toHaveLength(1)
  })

  it('returns error for header-only file', () => {
    const result = parseCSV(HEADER, new Set())
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/no data/)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- src/lib/csvParser.test.ts
```

Expected: all tests FAIL with "Cannot find module './csvParser'"

- [ ] **Step 3: Implement csvParser.ts**

Create `src/lib/csvParser.ts`:

```ts
import Papa from 'papaparse'
import type { Transaction } from '../types'

export interface ParseResult {
  transactions: Transaction[]
  skipped: number
  errors: string[]
}

function parseSLDate(raw: string): Date {
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}) h (\d{2}) ([+-]\d{2}:\d{2})/)
  if (!m) throw new Error(`Unparseable date: ${raw}`)
  return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00${m[6]}`)
}

function validateFirstDataRow(row: string[]): string | null {
  if (row.length !== 12) return `Expected 12 columns, got ${row.length}`
  try {
    parseSLDate(row[0])
  } catch {
    return `Column 0 is not a valid date: ${row[0]}`
  }
  for (const idx of [1, 7, 9, 10, 11]) {
    if (isNaN(Number(row[idx]))) return `Column ${idx} is not numeric: ${row[idx]}`
  }
  return null
}

export function parseCSV(content: string, existingIds: Set<number>): ParseResult {
  const { data } = Papa.parse<string[]>(content, { skipEmptyLines: true, header: false })

  if (data.length < 2) {
    return { transactions: [], skipped: 0, errors: ['File has no data rows'] }
  }

  const dataRows = data.slice(1)
  const firstRowError = validateFirstDataRow(dataRows[0])
  if (firstRowError) {
    return { transactions: [], skipped: 0, errors: [`Invalid file structure: ${firstRowError}`] }
  }

  const transactions: Transaction[] = []
  let skipped = 0

  for (const row of dataRows) {
    const orderId = Number(row[1])
    const status = row[8]

    if (status !== 'Delivered') { skipped++; continue }
    if (existingIds.has(orderId)) { skipped++; continue }

    transactions.push({
      orderId,
      date: parseSLDate(row[0]),
      sku: row[2],
      productName: row[3],
      orderItemId: Number(row[4]),
      buyer: row[5],
      recipient: row[6],
      price: Number(row[7]),
      status,
      commission: Number(row[9]),
      allocations: Number(row[10]),
      netAmount: Number(row[11]),
    })
    existingIds.add(orderId)
  }

  return { transactions, skipped, errors: [] }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run -- src/lib/csvParser.test.ts
```

Expected: all 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/csvParser.ts src/lib/csvParser.test.ts
git commit -m "feat: add CSV parser with column-index parsing and validation (TDD)"
```

---

## Task 4: KPI and chart data computations (TDD)

**Files:**
- Create: `src/lib/computeKPIs.ts`
- Create: `src/lib/computeKPIs.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/computeKPIs.test.ts`:

```ts
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
    expect(points[0].volume).toBe(2)
    expect(points[0].revenue).toBe(480)
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- src/lib/computeKPIs.test.ts
```

Expected: all tests FAIL with "Cannot find module './computeKPIs'"

- [ ] **Step 3: Implement computeKPIs.ts**

Create `src/lib/computeKPIs.ts`:

```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run -- src/lib/computeKPIs.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Run full test suite**

```bash
npm run test:run
```

Expected: all tests from Tasks 3 and 4 PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/computeKPIs.ts src/lib/computeKPIs.test.ts
git commit -m "feat: add KPI calculations and chart data aggregations (TDD)"
```

---

## Task 5: Zustand store

**Files:**
- Create: `src/store/useStore.ts`

- [ ] **Step 1: Create useStore.ts**

Create `src/store/useStore.ts`:

```ts
import { create } from 'zustand'
import type { Transaction, ChartTab, ChartMetric } from '../types'
import { loadAllTransactions, clearAllTransactions } from '../db/database'

interface Filters {
  dateStart: Date | null
  dateEnd: Date | null
  selectedProducts: string[]
}

export interface ImportStatus {
  state: 'idle' | 'loading' | 'success' | 'error'
  message: string
  count: number
}

interface Store {
  transactions: Transaction[]
  filters: Filters
  filteredTransactions: Transaction[]
  importStatus: ImportStatus
  activeTab: ChartTab
  chartMetric: ChartMetric

  loadFromDB: () => Promise<void>
  setImportStatus: (status: ImportStatus) => void
  setFilters: (partial: Partial<Filters>) => void
  resetData: () => Promise<void>
  setActiveTab: (tab: ChartTab) => void
  setChartMetric: (metric: ChartMetric) => void
}

function applyFilters(transactions: Transaction[], filters: Filters): Transaction[] {
  return transactions.filter(t => {
    if (filters.dateStart && t.date < filters.dateStart) return false
    if (filters.dateEnd && t.date > filters.dateEnd) return false
    if (filters.selectedProducts.length > 0 && !filters.selectedProducts.includes(t.productName)) return false
    return true
  })
}

export const useStore = create<Store>((set, get) => ({
  transactions: [],
  filters: { dateStart: null, dateEnd: null, selectedProducts: [] },
  filteredTransactions: [],
  importStatus: { state: 'idle', message: '', count: 0 },
  activeTab: 'area',
  chartMetric: 'revenue',

  loadFromDB: async () => {
    const transactions = await loadAllTransactions()
    set({ transactions, filteredTransactions: applyFilters(transactions, get().filters) })
  },

  setImportStatus: (importStatus) => set({ importStatus }),

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial }
    set({ filters, filteredTransactions: applyFilters(get().transactions, filters) })
  },

  resetData: async () => {
    await clearAllTransactions()
    set({
      transactions: [],
      filteredTransactions: [],
      importStatus: { state: 'idle', message: '', count: 0 },
    })
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setChartMetric: (chartMetric) => set({ chartMetric }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat: add Zustand store with transactions, filters, and import status"
```

---

## Task 6: App shell layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Update main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Update App.tsx**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <div className="border-2 border-dashed border-slate-700 rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          Dropzone
        </div>
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          Controls
        </div>
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          KPIs
        </div>
      </div>
      <div className="bg-[#0f172a] rounded-xl p-4 flex-1 min-h-80 flex items-center justify-center text-slate-600 text-xs">
        Charts
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify layout in browser**

```bash
npm run dev
```

Expected: dark page at http://localhost:5173 showing 3-column top row (Dropzone 180px | Controls flexible | KPIs 280px) + chart area below. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: add dark dashboard shell layout"
```

---

## Task 7: Dropzone component

**Files:**
- Create: `src/components/Dropzone.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Dropzone.tsx**

Create `src/components/Dropzone.tsx`:

```tsx
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '../store/useStore'
import { parseCSV } from '../lib/csvParser'
import { getExistingOrderIds, insertTransactions } from '../db/database'

export default function Dropzone() {
  const setImportStatus = useStore(s => s.setImportStatus)
  const loadFromDB = useStore(s => s.loadFromDB)
  const importStatus = useStore(s => s.importStatus)

  const onDrop = useCallback(
    async (files: File[]) => {
      setImportStatus({ state: 'loading', message: 'Importing...', count: 0 })

      let totalImported = 0
      const errors: string[] = []

      for (const file of files) {
        const content = await file.text()
        const existingIds = await getExistingOrderIds()
        const result = parseCSV(content, existingIds)

        if (result.errors.length > 0) {
          errors.push(`${file.name}: ${result.errors.join(', ')}`)
          continue
        }

        await insertTransactions(result.transactions)
        totalImported += result.transactions.length
      }

      if (errors.length > 0) {
        setImportStatus({ state: 'error', message: errors.join(' | '), count: totalImported })
      } else {
        setImportStatus({
          state: 'success',
          message: `${totalImported} transaction${totalImported !== 1 ? 's' : ''} loaded`,
          count: totalImported,
        })
      }

      await loadFromDB()
    },
    [setImportStatus, loadFromDB],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#0f172a] transition-colors min-h-52 ${
        isDragActive ? 'border-blue-500 bg-blue-950/30' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <input {...getInputProps()} />
      <svg
        className="w-8 h-8 text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-xs text-slate-500 text-center leading-relaxed px-3">
        Drag & Drop
        <br />
        Linden Lab
        <br />
        Transactions (CSV)
      </p>
      {importStatus.state !== 'idle' && (
        <p
          className={`text-xs text-center px-3 mt-1 leading-tight ${
            importStatus.state === 'error' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          {importStatus.message}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire Dropzone into App.tsx**

Replace the placeholder div in `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <Dropzone />
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          Controls
        </div>
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          KPIs
        </div>
      </div>
      <div className="bg-[#0f172a] rounded-xl p-4 flex-1 min-h-80 flex items-center justify-center text-slate-600 text-xs">
        Charts
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Drop the `.plan/exemple.csv` file onto the dropzone. Expected: dropzone shows "7 transactions loaded" (the example file has 7 delivered rows). Refresh — data should persist (loaded from IndexedDB on mount).

- [ ] **Step 4: Commit**

```bash
git add src/components/Dropzone.tsx src/App.tsx
git commit -m "feat: add Dropzone component with CSV import and IndexedDB persistence"
```

---

## Task 8: ControlBar + ProductFilter

**Files:**
- Create: `src/components/ProductFilter.tsx`
- Create: `src/components/ControlBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create ProductFilter.tsx**

Create `src/components/ProductFilter.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function ProductFilter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const transactions = useStore(s => s.transactions)
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)

  const products = Array.from(new Set(transactions.map(t => t.productName))).sort()
  const allSelected = filters.selectedProducts.length === 0

  function toggleAll() {
    setFilters({ selectedProducts: [] })
  }

  function toggleProduct(name: string) {
    const current = filters.selectedProducts
    if (current.includes(name)) {
      setFilters({ selectedProducts: current.filter(p => p !== name) })
    } else {
      setFilters({ selectedProducts: [...current, name] })
    }
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = allSelected ? 'All products selected' : `${filters.selectedProducts.length} selected`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 flex justify-between items-center hover:border-slate-500 transition-colors"
      >
        <span className="truncate">{label}</span>
        <span className="text-blue-400 ml-2 shrink-0">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1e293b] border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-blue-500"
            />
            <span className="text-sm font-semibold text-slate-200">ALL</span>
          </label>
          {products.map(name => (
            <label
              key={name}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={allSelected || filters.selectedProducts.includes(name)}
                onChange={() => toggleProduct(name)}
                className="accent-blue-500 shrink-0"
              />
              <span className="text-sm text-slate-300 truncate">{name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create ControlBar.tsx**

Create `src/components/ControlBar.tsx`:

```tsx
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
            onChange={date => setFilters({ dateStart: date })}
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
            onChange={date => setFilters({ dateEnd: date })}
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
```

- [ ] **Step 3: Wire ControlBar into App.tsx**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'
import ControlBar from './components/ControlBar'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <Dropzone />
        <ControlBar />
        <div className="bg-[#0f172a] rounded-xl h-52 flex items-center justify-center text-slate-600 text-xs">
          KPIs
        </div>
      </div>
      <div className="bg-[#0f172a] rounded-xl p-4 flex-1 min-h-80 flex items-center justify-center text-slate-600 text-xs">
        Charts
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Import the example CSV, then test:
- Date range pickers open calendar popovers
- "Last Year" / "Last Month" quick selectors set dates in the pickers
- "All" clears both dates and has blue border when active
- Product dropdown lists products from imported data, ALL toggle selects/deselects all

- [ ] **Step 5: Commit**

```bash
git add src/components/ProductFilter.tsx src/components/ControlBar.tsx src/App.tsx
git commit -m "feat: add ControlBar with date range, quick selectors, and product filter"
```

---

## Task 9: KPI Cards

**Files:**
- Create: `src/components/KPICards.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create KPICards.tsx**

Create `src/components/KPICards.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire KPICards into App.tsx**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'
import ControlBar from './components/ControlBar'
import KPICards from './components/KPICards'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <Dropzone />
        <ControlBar />
        <KPICards />
      </div>
      <div className="bg-[#0f172a] rounded-xl p-4 flex-1 min-h-80 flex items-center justify-center text-slate-600 text-xs">
        Charts
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

After importing example CSV: Revenue, Net Amount, Total Sales, Avg Cart should show real numbers. Changing the product filter or date range should update the KPIs live.

- [ ] **Step 4: Commit**

```bash
git add src/components/KPICards.tsx src/App.tsx
git commit -m "feat: add KPI cards (Revenue, Net, Total Sales, Avg Cart)"
```

---

## Task 10: ChartArea + SalesAreaChart

**Files:**
- Create: `src/components/charts/SalesAreaChart.tsx`
- Create: `src/components/ChartArea.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create SalesAreaChart.tsx**

Create `src/components/charts/SalesAreaChart.tsx`:

```tsx
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
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
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
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#areaGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create ChartArea.tsx**

Create `src/components/ChartArea.tsx`:

```tsx
import { useStore } from '../store/useStore'
import SalesAreaChart from './charts/SalesAreaChart'
import type { ChartTab } from '../types'

const TABS: { id: ChartTab; label: string }[] = [
  { id: 'area', label: 'Sales Over Time' },
  { id: 'bar', label: 'Top Articles' },
  { id: 'heatmap', label: 'Sales Heatmap' },
]

export default function ChartArea() {
  const activeTab = useStore(s => s.activeTab)
  const setActiveTab = useStore(s => s.setActiveTab)
  const chartMetric = useStore(s => s.chartMetric)
  const setChartMetric = useStore(s => s.setChartMetric)

  const showToggle = activeTab !== 'heatmap'

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
        {showToggle && (
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
        )}
      </div>

      {activeTab === 'area' && <SalesAreaChart />}
      {activeTab === 'bar' && (
        <div className="h-72 flex items-center justify-center text-slate-600 text-xs">
          Top Articles — Task 11
        </div>
      )}
      {activeTab === 'heatmap' && (
        <div className="h-72 flex items-center justify-center text-slate-600 text-xs">
          Heatmap — Task 12
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire ChartArea into App.tsx**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'
import ControlBar from './components/ControlBar'
import KPICards from './components/KPICards'
import ChartArea from './components/ChartArea'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <Dropzone />
        <ControlBar />
        <KPICards />
      </div>
      <ChartArea />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

With example CSV imported: "Sales Over Time" tab shows a smoothed area chart. Toggling Revenue/Volume changes the Y-axis data. The other tabs show placeholder text.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/SalesAreaChart.tsx src/components/ChartArea.tsx src/App.tsx
git commit -m "feat: add ChartArea with tabs and SalesAreaChart"
```

---

## Task 11: TopArticlesChart

**Files:**
- Create: `src/components/charts/TopArticlesChart.tsx`
- Modify: `src/components/ChartArea.tsx`

- [ ] **Step 1: Create TopArticlesChart.tsx**

Create `src/components/charts/TopArticlesChart.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire into ChartArea.tsx**

Replace the placeholder for the `bar` tab in `src/components/ChartArea.tsx`. Replace the block:

```tsx
      {activeTab === 'bar' && (
        <div className="h-72 flex items-center justify-center text-slate-600 text-xs">
          Top Articles — Task 11
        </div>
      )}
```

With:

```tsx
      {activeTab === 'bar' && <TopArticlesChart />}
```

And add the import at the top of the file:

```tsx
import TopArticlesChart from './charts/TopArticlesChart'
```

- [ ] **Step 3: Verify in browser**

Switch to "Top Articles" tab. Products are listed as horizontal bars sorted by revenue descending. Toggle switches between Revenue L$ and Volume.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/TopArticlesChart.tsx src/components/ChartArea.tsx
git commit -m "feat: add TopArticlesChart horizontal bar chart"
```

---

## Task 12: SalesHeatmap

**Files:**
- Create: `src/components/charts/SalesHeatmap.tsx`
- Modify: `src/components/ChartArea.tsx`

- [ ] **Step 1: Create SalesHeatmap.tsx**

Create `src/components/charts/SalesHeatmap.tsx`:

```tsx
import { useMemo, Fragment } from 'react'
import { useStore } from '../../store/useStore'
import { buildHeatmap } from '../../lib/computeKPIs'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function SalesHeatmap() {
  const filteredTransactions = useStore(s => s.filteredTransactions)
  const cells = useMemo(() => buildHeatmap(filteredTransactions), [filteredTransactions])

  const maxVolume = Math.max(...cells.map(c => c.volume), 1)

  function getColor(volume: number): string {
    const intensity = Math.round((volume / maxVolume) * 200 + 55)
    return `rgba(59, 130, 246, ${(intensity / 255).toFixed(2)})`
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="inline-grid gap-0.5 min-w-full"
        style={{ gridTemplateColumns: `44px repeat(24, minmax(20px, 1fr))` }}
      >
        <div />
        {HOURS.map(h => (
          <div key={h} className="text-center text-xs text-slate-600 pb-1 leading-none">
            {h}
          </div>
        ))}

        {DAYS.map((day, dayIdx) => (
          <Fragment key={day}>
            <div className="text-xs text-slate-500 flex items-center pr-2 leading-none">
              {day}
            </div>
            {HOURS.map(hour => {
              const cell = cells[dayIdx * 24 + hour]
              const vol = cell?.volume ?? 0
              return (
                <div
                  key={`${dayIdx}-${hour}`}
                  title={`${day} ${hour}:00 — ${vol} sale${vol !== 1 ? 's' : ''}`}
                  className="aspect-square rounded-sm"
                  style={{ background: vol > 0 ? getColor(vol) : '#1e293b' }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into ChartArea.tsx**

Replace the heatmap placeholder in `src/components/ChartArea.tsx`:

```tsx
      {activeTab === 'heatmap' && (
        <div className="h-72 flex items-center justify-center text-slate-600 text-xs">
          Heatmap — Task 12
        </div>
      )}
```

With:

```tsx
      {activeTab === 'heatmap' && <SalesHeatmap />}
```

And add the import at the top:

```tsx
import SalesHeatmap from './charts/SalesHeatmap'
```

- [ ] **Step 3: Verify in browser**

Switch to "Sales Heatmap" tab. A 7×24 grid appears. Days Mon–Sun on rows, hours 0–23 on columns. Cells with sales show blue (darker = more sales). Hover over a cell to see the tooltip. Toggle is hidden on this tab.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/SalesHeatmap.tsx src/components/ChartArea.tsx
git commit -m "feat: add SalesHeatmap custom 7x24 grid component"
```

---

## Task 13: PreferencesModal

**Files:**
- Create: `src/components/PreferencesModal.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create PreferencesModal.tsx**

Create `src/components/PreferencesModal.tsx`:

```tsx
import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function PreferencesModal() {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const resetData = useStore(s => s.resetData)

  async function handleReset() {
    await resetData()
    setConfirming(false)
    setOpen(false)
  }

  function handleClose() {
    setConfirming(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-300 hover:border-slate-500 flex items-center gap-2 transition-colors z-40"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        Preferences
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <div
            className="bg-[#1e293b] rounded-xl p-6 w-80 shadow-2xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-slate-100 mb-4">Preferences</h2>

            {!confirming ? (
              <>
                <button
                  onClick={() => setConfirming(true)}
                  className="w-full bg-red-950 border border-red-800 text-red-400 rounded-lg px-4 py-2.5 text-sm hover:bg-red-900 transition-colors"
                >
                  Reset Data
                </button>
                <button
                  onClick={handleClose}
                  className="w-full mt-2 text-slate-500 text-sm py-2 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  This will permanently delete all imported transaction data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 bg-[#0f172a] border border-slate-700 text-slate-400 rounded-lg px-4 py-2 text-sm hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 transition-colors"
                  >
                    Confirm Reset
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Wire PreferencesModal into App.tsx**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Dropzone from './components/Dropzone'
import ControlBar from './components/ControlBar'
import KPICards from './components/KPICards'
import ChartArea from './components/ChartArea'
import PreferencesModal from './components/PreferencesModal'

export default function App() {
  const loadFromDB = useStore(s => s.loadFromDB)

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-4 flex flex-col gap-3">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: '180px 1fr 280px' }}
      >
        <Dropzone />
        <ControlBar />
        <KPICards />
      </div>
      <ChartArea />
      <PreferencesModal />
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

- Preferences button is visible fixed at bottom-right
- Clicking it opens the modal
- "Reset Data" shows confirmation step
- "Confirm Reset" clears all data (KPIs go to 0, charts go empty, dropzone status resets)
- Clicking outside the modal or Cancel closes it
- Clicking Cancel at confirmation step goes back to first step

- [ ] **Step 4: Run full test suite**

```bash
npm run test:run
```

Expected: all tests PASS (no regressions)

- [ ] **Step 5: Commit**

```bash
git add src/components/PreferencesModal.tsx src/App.tsx
git commit -m "feat: add PreferencesModal with reset data confirmation"
```

---

## Done

All features from the spec are implemented. The app is a working Vite SPA:

```bash
npm run dev     # development
npm run build   # production build
npm run test:run  # run all tests
```
