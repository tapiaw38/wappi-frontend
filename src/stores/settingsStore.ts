import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsQueries } from '@/queries/settings'
import type { ISettingsService } from '@/services/settings/settingsService'
import type {
  Settings,
  UpdateSettingsInput,
  CalculateDeliveryInput,
  DeliveryFeeResult,
} from '@/types/settings'

export const useSettingsStore = (settingsService: ISettingsService) =>
  defineStore('settings', () => {
    const settings = ref<Settings | null>(null)

    const {
      getSettingsQuery,
      updateSettingsMutation,
      calculateDeliveryFeeMutation,
    } = useSettingsQueries(settingsService)

    const fetchSettings = async () => {
      try {
        const { data } = await getSettingsQuery.refetch()
        settings.value = data || null
        return data
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        throw error
      }
    }

    const updateSettings = async (input: UpdateSettingsInput) => {
      try {
        const response = await updateSettingsMutation.mutateAsync(input)
        settings.value = response
        return response
      } catch (error) {
        console.error('Failed to update settings:', error)
        throw error
      }
    }

    const calculateDeliveryFee = async (input: CalculateDeliveryInput) => {
      try {
        const response = await calculateDeliveryFeeMutation.mutateAsync(input)
        return response
      } catch (error) {
        console.error('Failed to calculate delivery fee:', error)
        throw error
      }
    }

    return {
      settings,
      isGetSettingsPending: getSettingsQuery.isPending,
      isUpdateSettingsPending: updateSettingsMutation.isPending,
      isCalculateDeliveryFeePending: calculateDeliveryFeeMutation.isPending,
      fetchSettings,
      updateSettings,
      calculateDeliveryFee,
    }
  })
