import { apiClient } from './client'
import type { ListTransactionsResponse } from '../types/transaction'

export const transactionService = {
  async getTransactions(limit = 100, offset = 0): Promise<ListTransactionsResponse> {
    const { data } = await apiClient.get<ListTransactionsResponse>('/api/admin/transactions', {
      params: { limit, offset }
    })
    return data
  }
}
