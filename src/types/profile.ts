export interface ProfileLocation {
  id: string
  longitude: number
  latitude: number
  address: string
}

export interface Profile {
  id: string
  user_id: string
  phone_number: string
  location: ProfileLocation | null
  created_at: string
  updated_at: string
}

export interface GenerateLinkResponse {
  link: string
  token: string
  expires_at: string
}

export interface ValidateTokenResponse {
  valid: boolean
  user_id: string
  message?: string
}

export interface CompleteProfileInput {
  token: string
  phone_number: string
  longitude: number
  latitude: number
  address: string
}

export interface UpdateProfileInput {
  phone_number: string
  longitude: number
  latitude: number
  address: string
}

export interface CheckCompletedResponse {
  is_completed: boolean
  profile_id: string | null
  message: string
}
