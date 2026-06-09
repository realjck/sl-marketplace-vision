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
