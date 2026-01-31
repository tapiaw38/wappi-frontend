import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { IProfileService } from '@/services/profile/profileService'
import type {
  Profile,
  GenerateLinkResponse,
  ValidateTokenResponse,
  CompleteProfileInput,
  UpdateProfileInput,
  CheckCompletedResponse,
} from '@/types/profile'

export function useProfileQueries(profileService: IProfileService) {
  const queryClient = useQueryClient()

  const getProfileQuery = useQuery<Profile, Error>({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(''),
    enabled: false,
  })

  const checkCompletedQuery = useQuery<CheckCompletedResponse, Error>({
    queryKey: ['checkCompleted'],
    queryFn: profileService.checkCompleted.bind(profileService),
    enabled: false,
  })

  const generateLinkMutation = useMutation<GenerateLinkResponse, Error, string>({
    mutationFn: profileService.generateLink.bind(profileService),
  })

  const validateTokenMutation = useMutation<ValidateTokenResponse, Error, string>({
    mutationFn: profileService.validateToken.bind(profileService),
  })

  const completeProfileMutation = useMutation<Profile, Error, CompleteProfileInput>({
    mutationFn: profileService.completeProfile.bind(profileService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['checkCompleted'] })
    },
  })

  const updateProfileMutation = useMutation<Profile, Error, { id: string; input: UpdateProfileInput }>(
    {
      mutationFn: ({ id, input }) => profileService.updateProfile(id, input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      },
    }
  )

  return {
    getProfileQuery,
    checkCompletedQuery,
    generateLinkMutation,
    validateTokenMutation,
    completeProfileMutation,
    updateProfileMutation,
  }
}
