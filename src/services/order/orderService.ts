import type { AxiosInstance } from 'axios'
import type {
  Order,
  CreateOrderInput,
  UpdateStatusInput,
  ClaimOrderResponse,
  MyOrdersResponse,
  OrderData,
} from '@/types/order'

export interface UpdateOrderInput {
  status?: string
  status_message?: string
  eta?: string
  data?: OrderData
}

export interface IOrderService {
  getOrder(id: string): Promise<Order>
  createOrder(input: CreateOrderInput): Promise<Order>
  updateStatus(id: string, input: UpdateStatusInput): Promise<Order>
  claimOrder(token: string): Promise<ClaimOrderResponse>
  getMyOrders(): Promise<MyOrdersResponse>
  updateOrder(id: string, input: UpdateOrderInput): Promise<Order>
}

export class OrderService implements IOrderService {
  constructor(private readonly api: AxiosInstance) {
    this.api = api
  }

  async getOrder(id: string): Promise<Order> {
    const { data } = await this.api.get<Order>(`/api/orders/${id}`)
    return data
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const { data } = await this.api.post<Order>('/api/orders', input)
    return data
  }

  async updateStatus(id: string, input: UpdateStatusInput): Promise<Order> {
    const { data } = await this.api.patch<Order>(`/api/orders/${id}/status`, input)
    return data
  }

  async claimOrder(token: string): Promise<ClaimOrderResponse> {
    const { data } = await this.api.post<ClaimOrderResponse>(`/api/orders/claim/${token}`)
    return data
  }

  async getMyOrders(): Promise<MyOrdersResponse> {
    const { data } = await this.api.get<MyOrdersResponse>('/api/orders/my')
    return data
  }

  async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
    const { data } = await this.api.put<Order>(`/api/admin/orders/${id}`, input)
    return data
  }
}
