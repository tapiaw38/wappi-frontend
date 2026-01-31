import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ISettingsService } from '@/services/settings/settingsService'

export const useSettings = () => {
  const services = inject<{ settingsService: ISettingsService }>('services')
  if (!services) throw new Error('Services not provided')

  const settingsService = services.settingsService

  const store = useSettingsStore(settingsService)
  const settingsStore = store()

  const {
    settings,
    isGetSettingsPending,
    isUpdateSettingsPending,
    isCalculateDeliveryFeePending,
  } = storeToRefs(settingsStore)

  const {
    fetchSettings,
    updateSettings,
    calculateDeliveryFee,
  } = settingsStore

  return {
    settings,
    isGetSettingsPending,
    isUpdateSettingsPending,
    isCalculateDeliveryFeePending,
    fetchSettings,
    updateSettings,
    calculateDeliveryFee,
    reset: () => settingsStore.$reset(),
  }
}
