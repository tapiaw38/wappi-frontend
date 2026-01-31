import type { AxiosInstance } from 'axios'
import type {
  Settings,
  UpdateSettingsInput,
  CalculateDeliveryInput,
  DeliveryFeeResult,
} from '@/types/settings'

export interface ISettingsService {
  getSettings(): Promise<Settings>
  updateSettings(input: UpdateSettingsInput): Promise<Settings>
  calculateDeliveryFee(input: CalculateDeliveryInput): Promise<DeliveryFeeResult>
}

export class SettingsService implements ISettingsService {
  constructor(private readonly api: AxiosInstance) {
    this.api = api
  }

  async getSettings(): Promise<Settings> {
    const { data } = await this.api.get<Settings>('/api/settings')
    return data
  }

  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    const { data } = await this.api.put<Settings>('/api/settings', input)
    return data
  }

  async calculateDeliveryFee(input: CalculateDeliveryInput): Promise<DeliveryFeeResult> {
    const { data } = await this.api.post<DeliveryFeeResult>('/api/settings/calculate-delivery', input)
    return data
  }
}
