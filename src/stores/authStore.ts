import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthQueries } from '@/queries/auth'
import type { IAuthService } from '@/services/auth/authService'
import type {
  LoginParams,
  LoginResponse,
  RegisterParams,
  RegisterResponse,
  User,
} from '@/types/auth'

export const useAuthStore = (authService: IAuthService) =>
  defineStore('auth', () => {
    const user = ref<User | null | undefined>(null)
    const token = ref<string | null>(localStorage.getItem('token'))

    const {
      loginMutation,
      meUserQuery,
      registerMutation,
    } = useAuthQueries(authService)

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        token.value = storedToken
        try {
          const { data } = await meUserQuery.refetch()
          user.value = data?.data
        } catch (error) {
          console.error('Token inválido, limpiando sesión:', error)
          localStorage.removeItem('token')
          token.value = null
          user.value = null
        }
      }
    }

    const loginUser = async (params: LoginParams) => {
      try {
        const response: LoginResponse = await loginMutation.mutateAsync(params)
        authService.setToken(response.token)
        user.value = response.data
        token.value = response.token
        return response
      } catch (error) {
        console.error('Failed to login:', error)
        throw error
      }
    }

    const logoutUser = async () => {
      authService.logout()
      user.value = null
      token.value = null
    }

    const meUser = async () => {
      try {
        const { data } = await meUserQuery.refetch()
        user.value = data?.data
        return data
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        throw error
      }
    }

    const registerUser = async (params: RegisterParams) => {
      try {
        const response: RegisterResponse = await registerMutation.mutateAsync(params)
        return response
      } catch (error) {
        console.error('Failed to register:', error)
        throw error
      }
    }

    return {
      user,
      token,
      isLoginPending: loginMutation.isPending,
      isLoginSuccess: loginMutation.isSuccess,
      isLoginError: loginMutation.isError,
      loginError: loginMutation.error,
      isMeUserPending: meUserQuery.isPending,
      isMeUserSuccess: meUserQuery.isSuccess,
      isMeUserError: meUserQuery.isError,
      meUserError: meUserQuery.error,
      isRegisterPending: registerMutation.isPending,
      isRegisterSuccess: registerMutation.isSuccess,
      isRegisterError: registerMutation.isError,
      registerError: registerMutation.error,
      loginUser,
      logoutUser,
      meUser,
      registerUser,
      initializeAuth,
    }
  })
