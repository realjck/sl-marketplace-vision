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

    if (isNaN(orderId)) { skipped++; continue }
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
