import { server } from '@/api/request/server'
import { AuthService } from './authService'

const BASE_URL = import.meta.env.VITE_AUTH_API_URL
export const authService = new AuthService(server({ baseURL: BASE_URL }))
