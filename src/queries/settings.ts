import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { ISettingsService } from '@/services/settings/settingsService'
import type {
  Settings,
  UpdateSettingsInput,
  CalculateDeliveryInput,
  DeliveryFeeResult,
} from '@/types/settings'

export function useSettingsQueries(settingsService: ISettingsService) {
  const queryClient = useQueryClient()

  const getSettingsQuery = useQuery<Settings, Error>({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings.bind(settingsService),
    enabled: false,
  })

  const updateSettingsMutation = useMutation<Settings, Error, UpdateSettingsInput>({
    mutationFn: settingsService.updateSettings.bind(settingsService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const calculateDeliveryFeeMutation = useMutation<DeliveryFeeResult, Error, CalculateDeliveryInput>(
    {
      mutationFn: settingsService.calculateDeliveryFee.bind(settingsService),
    }
  )

  return {
    getSettingsQuery,
    updateSettingsMutation,
    calculateDeliveryFeeMutation,
  }
}
