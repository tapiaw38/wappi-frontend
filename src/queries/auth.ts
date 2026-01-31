import { useMutation, useQuery } from '@tanstack/vue-query'
import type { IAuthService } from '@/services/auth/authService'
import type {
  LoginParams,
  LoginResponse,
  MeUserResponse,
  RegisterParams,
  RegisterResponse,
} from '@/types/auth'

export function useAuthQueries(authService: IAuthService) {
  const loginMutation = useMutation<LoginResponse, Error, LoginParams>({
    mutationFn: authService.login.bind(authService),
  })

  const meUserQuery = useQuery<MeUserResponse, Error>({
    queryKey: ['meUser'],
    queryFn: authService.meUser.bind(authService),
    enabled: false,
    retry: false,
  })

  const registerMutation = useMutation<RegisterResponse, Error, RegisterParams>({
    mutationFn: authService.register.bind(authService),
  })

  return {
    loginMutation,
    meUserQuery,
    registerMutation,
  }
}
