import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profileStore'
import type { IProfileService } from '@/services/profile/profileService'

export const useProfile = () => {
  const services = inject<{ profileService: IProfileService }>('services')
  if (!services) throw new Error('Services not provided')

  const profileService = services.profileService

  const store = useProfileStore(profileService)
  const profileStore = store()

  const {
    currentProfile,
    checkCompleted,
    isGetProfilePending,
    isCheckCompletedPending,
    isGenerateLinkPending,
    isValidateTokenPending,
    isCompleteProfilePending,
    isUpdateProfilePending,
  } = storeToRefs(profileStore)

  const {
    getProfile,
    fetchCheckCompleted,
    generateLink,
    validateToken,
    completeProfile,
    updateProfile,
  } = profileStore

  return {
    currentProfile,
    checkCompleted,
    isGetProfilePending,
    isCheckCompletedPending,
    isGenerateLinkPending,
    isValidateTokenPending,
    isCompleteProfilePending,
    isUpdateProfilePending,
    getProfile,
    fetchCheckCompleted,
    generateLink,
    validateToken,
    completeProfile,
    updateProfile,
    reset: () => profileStore.$reset(),
  }
}
