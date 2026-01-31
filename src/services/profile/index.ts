import { client } from '@/api/request/client'
import { ProfileService } from './profileService'

const BASE_URL = import.meta.env.VITE_API_URL
export const profileService = new ProfileService(client({ baseURL: BASE_URL }))
