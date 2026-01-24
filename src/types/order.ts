export interface Order {
  id: string
  profile_id: string
  status: string
  status_index: number
  eta: string
  created_at: string
  updated_at: string
  all_statuses: string[]
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
  CANCELLED: 'Cancelado'
}

export const StatusIcons: Record<string, string> = {
  CREATED: '📝',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  ON_THE_WAY: '🚗',
  DELIVERED: '📦',
  CANCELLED: '❌'
}
