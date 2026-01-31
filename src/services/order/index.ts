import { client } from '@/api/request/client'
import { OrderService } from './orderService'

const BASE_URL = import.meta.env.VITE_API_URL
export const orderService = new OrderService(client({ baseURL: BASE_URL }))
