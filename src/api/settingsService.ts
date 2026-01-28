import { apiClient } from './client'
import type { Settings, UpdateSettingsInput, CalculateDeliveryInput, DeliveryFeeResult } from '../types/settings'

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const { data } = await apiClient.get<Settings>('/api/settings')
    return data
  },

  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    const { data } = await apiClient.put<Settings>('/api/settings', input)
    return data
  },

  async calculateDeliveryFee(input: CalculateDeliveryInput): Promise<DeliveryFeeResult> {
    const { data } = await apiClient.post<DeliveryFeeResult>('/api/settings/calculate-delivery', input)
    return data
  }
}
