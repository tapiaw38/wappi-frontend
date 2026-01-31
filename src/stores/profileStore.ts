import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useProfileQueries } from '@/queries/profile'
import type { IProfileService } from '@/services/profile/profileService'
import type {
  Profile,
  GenerateLinkResponse,
  ValidateTokenResponse,
  CompleteProfileInput,
  UpdateProfileInput,
  CheckCompletedResponse,
} from '@/types/profile'

export const useProfileStore = (profileService: IProfileService) =>
  defineStore('profile', () => {
    const currentProfile = ref<Profile | null>(null)
    const checkCompleted = ref<CheckCompletedResponse | null>(null)

    const {
      getProfileQuery,
      checkCompletedQuery,
      generateLinkMutation,
      validateTokenMutation,
      completeProfileMutation,
      updateProfileMutation,
    } = useProfileQueries(profileService)

    const getProfile = async (id: string) => {
      try {
        const profile = await profileService.getProfile(id)
        currentProfile.value = profile
        return profile
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        throw error
      }
    }

    const fetchCheckCompleted = async () => {
      try {
        const { data } = await checkCompletedQuery.refetch()
        checkCompleted.value = data || null
        return data
      } catch (error) {
        console.error('Failed to check completed:', error)
        throw error
      }
    }

    const generateLink = async (userId: string) => {
      try {
        const response = await generateLinkMutation.mutateAsync(userId)
        return response
      } catch (error) {
        console.error('Failed to generate link:', error)
        throw error
      }
    }

    const validateToken = async (token: string) => {
      try {
        const response = await validateTokenMutation.mutateAsync(token)
        return response
      } catch (error) {
        console.error('Failed to validate token:', error)
        throw error
      }
    }

    const completeProfile = async (input: CompleteProfileInput) => {
      try {
        const response = await completeProfileMutation.mutateAsync(input)
        currentProfile.value = response
        return response
      } catch (error) {
        console.error('Failed to complete profile:', error)
        throw error
      }
    }

    const updateProfile = async (id: string, input: UpdateProfileInput) => {
      try {
        const response = await updateProfileMutation.mutateAsync({ id, input })
        if (currentProfile.value?.id === id) {
          currentProfile.value = response
        }
        return response
      } catch (error) {
        console.error('Failed to update profile:', error)
        throw error
      }
    }

    return {
      currentProfile,
      checkCompleted,
      isGetProfilePending: getProfileQuery.isPending,
      isCheckCompletedPending: checkCompletedQuery.isPending,
      isGenerateLinkPending: generateLinkMutation.isPending,
      isValidateTokenPending: validateTokenMutation.isPending,
      isCompleteProfilePending: completeProfileMutation.isPending,
      isUpdateProfilePending: updateProfileMutation.isPending,
      getProfile,
      fetchCheckCompleted,
      generateLink,
      validateToken,
      completeProfile,
      updateProfile,
    }
  })
