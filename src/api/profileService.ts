import { apiClient } from './client'
import type {
  Profile,
  GenerateLinkResponse,
  ValidateTokenResponse,
  CompleteProfileInput,
  UpdateProfileInput,
  CheckCompletedResponse
} from '../types/profile'

export const profileService = {
  async generateLink(userId: string): Promise<GenerateLinkResponse> {
    const { data } = await apiClient.post<GenerateLinkResponse>('/api/profiles/generate-link', {
      user_id: userId
    })
    return data
  },

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const { data } = await apiClient.get<ValidateTokenResponse>(`/api/profiles/validate/${token}`)
    return data
  },

  async completeProfile(input: CompleteProfileInput): Promise<Profile> {
    const response = await apiClient.post<{ data: Profile }>('/api/profiles/complete', input)
    return response.data.data
  },

  async getProfile(id: string): Promise<Profile> {
    const response = await apiClient.get<{ data: Profile }>(`/api/profiles/${id}`)
    return response.data.data
  },

  async updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
    const response = await apiClient.put<{ data: Profile }>(`/api/profiles/${id}`, input)
    return response.data.data
  },

  async checkCompleted(): Promise<CheckCompletedResponse> {
    const { data } = await apiClient.get<CheckCompletedResponse>('/api/profiles/check-completed')
    return data
  },

  async upsertProfile(input: UpdateProfileInput): Promise<Profile> {
    const response = await apiClient.post<{ data: Profile }>('/api/profiles/upsert', input)
    return response.data.data
  }
}
