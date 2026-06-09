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
