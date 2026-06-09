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

export type ChartTab = 'area' | 'bar'
export type ChartMetric = 'revenue' | 'volume'
