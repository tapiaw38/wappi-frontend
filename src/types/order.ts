export interface OrderItem {
  name: string
  price: number
  quantity: number
}

export interface OrderData {
  items: OrderItem[]
}

export interface Order {
  id: string
  profile_id: string
  status: string
  status_message?: string
  status_index: number
  eta: string
  data?: OrderData
  created_at: string
  updated_at: string
  all_statuses: string[]
}

export function calculateOrderTotal(data?: OrderData): number {
  if (!data?.items) return 0
  return data.items.reduce((total, item) => total + (item.price * item.quantity), 0)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

export interface CreateOrderInput {
  eta: string
}

export interface UpdateStatusInput {
  status: string
}

export interface ClaimOrderResponse {
  order_id: string
  user_id: string
  profile_id?: string
  status: string
  eta: string
  claimed_at: string
}

export const StatusLabels: Record<string, string> = {
  CREATED: 'Pedido Creado',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En Preparación',
  ON_THE_WAY: 'En Camino',
  DELIVERED: 'Entregado',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado'
}

export const StatusIcons: Record<string, string> = {
  CREATED: '📝',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  ON_THE_WAY: '🚗',
  DELIVERED: '📦',
  PAUSED: '⏸️',
  CANCELLED: '❌'
}
