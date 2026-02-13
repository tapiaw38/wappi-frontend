import { paymentClient } from './paymentClient'
import type { PaymentMethod, PaymentMethodCreate, PaymentMethodUpdate } from '../types/payment'

export const paymentMethodService = {
  async createPaymentMethod(userId: string, data: PaymentMethodCreate): Promise<PaymentMethod> {
    const response = await paymentClient.post<PaymentMethod>(
      `/api/v1/payment-methods/?user_id=${userId}`,
      data
    )
    return response.data
  },

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const response = await paymentClient.get<PaymentMethod[]>(
      `/api/v1/payment-methods/user/${userId}`
    )
    return response.data
  },

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    try {
      const response = await paymentClient.get<PaymentMethod>(
        `/api/v1/payment-methods/user/${userId}/default`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async updatePaymentMethod(
    paymentMethodId: number,
    userId: string,
    data: PaymentMethodUpdate
  ): Promise<PaymentMethod> {
    const response = await paymentClient.put<PaymentMethod>(
      `/api/v1/payment-methods/${paymentMethodId}?user_id=${userId}`,
      data
    )
    return response.data
  },

  async deletePaymentMethod(paymentMethodId: number, userId: string): Promise<void> {
    await paymentClient.delete(`/api/v1/payment-methods/${paymentMethodId}?user_id=${userId}`)
  }
}
