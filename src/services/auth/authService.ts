import type { AxiosInstance } from 'axios'
import type {
  LoginParams,
  LoginResponse,
  MeUserResponse,
  RegisterParams,
  RegisterResponse,
} from '@/types/auth'

export interface IAuthService {
  login(params: LoginParams): Promise<LoginResponse>
  meUser(): Promise<MeUserResponse>
  register(params: RegisterParams): Promise<RegisterResponse>
  getToken(): string | null
  setToken(token: string): void
  removeToken(): void
  isAuthenticated(): boolean
  logout(): void
}

export class AuthService implements IAuthService {
  constructor(private readonly api: AxiosInstance) {
    this.api = api
  }

  async login({ email, password, ssoType, ssoCode }: LoginParams): Promise<LoginResponse> {
    const { data } = await this.api.post<LoginResponse>('/auth/login', {
      email,
      password,
      sso_type: ssoType,
      code: ssoCode,
    })
    return data
  }

  async meUser(): Promise<MeUserResponse> {
    const { data } = await this.api.get<MeUserResponse>('/user/me')
    return data
  }

  async register(params: RegisterParams): Promise<RegisterResponse> {
    const { data } = await this.api.post<RegisterResponse>('/auth/register', params)
    return data
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  setToken(token: string): void {
    localStorage.setItem('token', token)
  }

  removeToken(): void {
    localStorage.removeItem('token')
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  logout(): void {
    this.removeToken()
  }
}
