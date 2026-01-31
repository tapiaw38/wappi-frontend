import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrderStore } from '@/stores/orderStore'
import type { IOrderService } from '@/services/order/orderService'

export const useOrder = () => {
  const services = inject<{ orderService: IOrderService }>('services')
  if (!services) throw new Error('Services not provided')

  const orderService = services.orderService

  const store = useOrderStore(orderService)
  const orderStore = store()

  const {
    currentOrder,
    myOrders,
    isGetOrderPending,
    isGetMyOrdersPending,
    isCreateOrderPending,
    isUpdateStatusPending,
    isClaimOrderPending,
    isUpdateOrderPending,
  } = storeToRefs(orderStore)

  const {
    getOrder,
    fetchMyOrders,
    createOrder,
    updateStatus,
    claimOrder,
    updateOrder,
  } = orderStore

  return {
    currentOrder,
    myOrders,
    isGetOrderPending,
    isGetMyOrdersPending,
    isCreateOrderPending,
    isUpdateStatusPending,
    isClaimOrderPending,
    isUpdateOrderPending,
    getOrder,
    fetchMyOrders,
    createOrder,
    updateStatus,
    claimOrder,
    updateOrder,
    reset: () => orderStore.$reset(),
  }
}
