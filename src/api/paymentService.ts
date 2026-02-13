import { apiClient } from './client'
import { authClient } from './authClient'
import type { PaymentMethod } from '../types/payment'

export const paymentService = {
  async checkPaymentMethod(userId: string): Promise<{ has_payment_method: boolean }> {
    const { data } = await apiClient.get<{ has_payment_method: boolean }>(
      `/api/payment/check/${userId}`
    )
    return data
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // First get current user info
    const userResponse = await authClient.get('/user/me')
    const userId = userResponse.data.data.id

    // Then fetch payment methods from payments API
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8008/api/v1/payment-methods/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods')
    }

    return response.json()
  }
}
