import type { AxiosInstance } from 'axios'
import type {
  Profile,
  GenerateLinkResponse,
  ValidateTokenResponse,
  CompleteProfileInput,
  UpdateProfileInput,
  CheckCompletedResponse,
} from '@/types/profile'

export interface IProfileService {
  generateLink(userId: string): Promise<GenerateLinkResponse>
  validateToken(token: string): Promise<ValidateTokenResponse>
  completeProfile(input: CompleteProfileInput): Promise<Profile>
  getProfile(id: string): Promise<Profile>
  updateProfile(id: string, input: UpdateProfileInput): Promise<Profile>
  checkCompleted(): Promise<CheckCompletedResponse>
}

export class ProfileService implements IProfileService {
  private readonly api: AxiosInstance

  constructor(api: AxiosInstance) {
    this.api = api
  }

  async generateLink(userId: string): Promise<GenerateLinkResponse> {
    const { data } = await this.api.post<GenerateLinkResponse>('/api/profiles/generate-link', {
      user_id: userId,
    })
    return data
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const { data } = await this.api.get<ValidateTokenResponse>(`/api/profiles/validate/${token}`)
    return data
  }

  async completeProfile(input: CompleteProfileInput): Promise<Profile> {
    const { data } = await this.api.post<Profile>('/api/profiles/complete', input)
    return data
  }

  async getProfile(id: string): Promise<Profile> {
    const { data } = await this.api.get<Profile>(`/api/profiles/${id}`)
    return data
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
    const { data } = await this.api.put<Profile>(`/api/profiles/${id}`, input)
    return data
  }

  async checkCompleted(): Promise<CheckCompletedResponse> {
    const { data } = await this.api.get<CheckCompletedResponse>('/api/profiles/check-completed')
    return data
  }
}
