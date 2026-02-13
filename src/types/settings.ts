export interface Settings {
  id: string
  business_name: string
  business_latitude: number
  business_longitude: number
  default_map_latitude: number
  default_map_longitude: number
  default_map_zoom: number
  default_item_weight: number // in grams
  delivery_base_price: number
  delivery_price_per_km: number
  delivery_price_per_kg: number
  manager_collector_id?: string // MercadoPago collector ID for manager account
  created_at: string
  updated_at: string
}

export interface UpdateSettingsInput {
  business_name?: string
  business_latitude?: number
  business_longitude?: number
  default_map_latitude?: number
  default_map_longitude?: number
  default_map_zoom?: number
  default_item_weight?: number
  delivery_base_price?: number
  delivery_price_per_km?: number
  delivery_price_per_kg?: number
  manager_collector_id?: string
}

export interface CalculateDeliveryInput {
  user_latitude: number
  user_longitude: number
  items: Array<{
    quantity: number
    weight?: number
  }>
}

export interface DeliveryFeeResult {
  distance_km: number
  total_weight_g: number
  total_weight_kg: number
  base_price: number
  distance_price: number
  weight_price: number
  total_price: number
}
