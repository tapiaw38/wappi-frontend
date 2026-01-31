import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useOrderQueries } from '@/queries/order'
import type { IOrderService } from '@/services/order/orderService'
import type {
  Order,
  CreateOrderInput,
  UpdateStatusInput,
  ClaimOrderResponse,
  MyOrdersResponse,
} from '@/types/order'
import type { UpdateOrderInput } from '@/services/order/orderService'

export const useOrderStore = (orderService: IOrderService) =>
  defineStore('order', () => {
    const currentOrder = ref<Order | null>(null)
    const myOrders = ref<MyOrdersResponse | null>(null)

    const {
      getOrderQuery,
      getMyOrdersQuery,
      createOrderMutation,
      updateStatusMutation,
      claimOrderMutation,
      updateOrderMutation,
    } = useOrderQueries(orderService)

    const getOrder = async (id: string) => {
      try {
        const order = await orderService.getOrder(id)
        currentOrder.value = order
        return order
      } catch (error) {
        console.error('Failed to fetch order:', error)
        throw error
      }
    }

    const fetchMyOrders = async () => {
      try {
        const { data } = await getMyOrdersQuery.refetch()
        myOrders.value = data || null
        return data
      } catch (error) {
        console.error('Failed to fetch my orders:', error)
        throw error
      }
    }

    const createOrder = async (input: CreateOrderInput) => {
      try {
        const response = await createOrderMutation.mutateAsync(input)
        return response
      } catch (error) {
        console.error('Failed to create order:', error)
        throw error
      }
    }

    const updateStatus = async (id: string, input: UpdateStatusInput) => {
      try {
        const response = await updateStatusMutation.mutateAsync({ id, input })
        if (currentOrder.value?.id === id) {
          currentOrder.value = response
        }
        return response
      } catch (error) {
        console.error('Failed to update order status:', error)
        throw error
      }
    }

    const claimOrder = async (token: string) => {
      try {
        const response = await claimOrderMutation.mutateAsync(token)
        return response
      } catch (error) {
        console.error('Failed to claim order:', error)
        throw error
      }
    }

    const updateOrder = async (id: string, input: UpdateOrderInput) => {
      try {
        const response = await updateOrderMutation.mutateAsync({ id, input })
        if (currentOrder.value?.id === id) {
          currentOrder.value = response
        }
        return response
      } catch (error) {
        console.error('Failed to update order:', error)
        throw error
      }
    }

    return {
      currentOrder,
      myOrders,
      isGetOrderPending: getOrderQuery.isPending,
      isGetMyOrdersPending: getMyOrdersQuery.isPending,
      isCreateOrderPending: createOrderMutation.isPending,
      isUpdateStatusPending: updateStatusMutation.isPending,
      isClaimOrderPending: claimOrderMutation.isPending,
      isUpdateOrderPending: updateOrderMutation.isPending,
      getOrder,
      fetchMyOrders,
      createOrder,
      updateStatus,
      claimOrder,
      updateOrder,
    }
  })
