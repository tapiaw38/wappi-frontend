import { client } from '@/api/request/client'
import { SettingsService } from './settingsService'

const BASE_URL = import.meta.env.VITE_API_URL
export const settingsService = new SettingsService(client({ baseURL: BASE_URL }))
