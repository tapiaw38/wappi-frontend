import { paymentClient } from './paymentClient'
import type { TokenDataInput, TokenResponse } from '../types/payment'

export const mercadopagoService = {
  async createToken(tokenData: TokenDataInput): Promise<TokenResponse> {
    const response = await paymentClient.post<TokenResponse>('/api/v1/mercadopago/token', tokenData)
    return response.data
  },

  async getPaymentMethodByBin(bin: string): Promise<string> {
    const response = await paymentClient.get<{ id: string }>(`/api/v1/mercadopago/payment_method?bin=${bin}`)
    return response.data?.id ?? 'visa'
  }
}
