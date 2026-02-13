export interface PaymentMethod {
  id: number
  user_id: string
  gateway: string
  last_four_digits: string
  payment_method_id: string
  cardholder_name: string
  expiration_month: string
  expiration_year: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface PaymentMethodCreate {
  card_token_id: string
  last_four_digits: string
  payment_method_id: string
  cardholder_name: string
  expiration_month: string
  expiration_year: string
  is_default?: boolean
  payer_email?: string
  // Raw card fields used for server-side tokenization only; not stored in DB.
  card_number?: string
  security_code?: string
  doc_type?: string
  doc_number?: string
}

export interface PaymentMethodUpdate {
  is_default?: boolean
}

export interface TokenDataInput {
  card_expiration_month: string
  card_expiration_year: string
  card_number: string
  cardholder_name: string
  security_code?: string
  doc_type?: string
  doc_number?: string
}

export interface TokenResponse {
  id: string
  public_key: string
  card_id: string | null
  status: string
  date_created: string
  date_last_updated: string
  date_due: string
  luhn_validation: boolean
  live_mode: boolean
  require_esc: boolean
  card_number_length: number
  security_code_length: number
}
