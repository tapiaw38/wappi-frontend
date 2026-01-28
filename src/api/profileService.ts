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
    const { data } = await apiClient.post<Profile>('/api/profiles/complete', input)
    return data
  },

  async getProfile(id: string): Promise<Profile> {
    const { data } = await apiClient.get<Profile>(`/api/profiles/${id}`)
    return data
  },

  async updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
    const { data } = await apiClient.put<Profile>(`/api/profiles/${id}`, input)
    return data
  },

  async checkCompleted(): Promise<CheckCompletedResponse> {
    const { data } = await apiClient.get<CheckCompletedResponse>('/api/profiles/check-completed')
    return data
  }
}
