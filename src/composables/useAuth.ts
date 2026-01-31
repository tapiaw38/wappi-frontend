import { computed, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import type { IAuthService } from '@/services/auth/authService'

export const useAuth = () => {
  const services = inject<{ authService: IAuthService }>('services')
  if (!services) throw new Error('Services not provided')

  const authService = services.authService

  const store = useAuthStore(authService)
  const authStore = store()

  const {
    user,
    token,
    isLoginPending,
    isLoginSuccess,
    isLoginError,
    loginError,
    isMeUserPending,
    isMeUserSuccess,
    isMeUserError,
    meUserError,
    isRegisterPending,
    isRegisterSuccess,
    isRegisterError,
    registerError,
  } = storeToRefs(authStore)

  const {
    loginUser,
    logoutUser,
    meUser,
    registerUser,
    initializeAuth,
  } = authStore

  return {
    user,
    token,
    isAuthenticated: computed<boolean>(() => token.value !== null),
    isLoginPending,
    isLoginSuccess,
    isLoginError,
    loginError,
    isMeUserPending,
    isMeUserSuccess,
    isMeUserError,
    meUserError,
    isRegisterPending,
    isRegisterSuccess,
    isRegisterError,
    registerError,
    loginUser,
    logoutUser,
    meUser,
    registerUser,
    initializeAuth,
    reset: () => authStore.$reset(),
  }
}
