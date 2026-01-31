import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { IOrderService } from '@/services/order/orderService'
import type {
  Order,
  CreateOrderInput,
  UpdateStatusInput,
  ClaimOrderResponse,
  MyOrdersResponse,
} from '@/types/order'
import type { UpdateOrderInput } from '@/services/order/orderService'

export function useOrderQueries(orderService: IOrderService) {
  const queryClient = useQueryClient()

  const getOrderQuery = useQuery<Order, Error>({
    queryKey: ['order'],
    queryFn: () => orderService.getOrder(''),
    enabled: false,
  })

  const getMyOrdersQuery = useQuery<MyOrdersResponse, Error>({
    queryKey: ['myOrders'],
    queryFn: orderService.getMyOrders.bind(orderService),
    enabled: false,
  })

  const createOrderMutation = useMutation<Order, Error, CreateOrderInput>({
    mutationFn: orderService.createOrder.bind(orderService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] })
    },
  })

  const updateStatusMutation = useMutation<
    Order,
    Error,
    { id: string; input: UpdateStatusInput }
  >({
    mutationFn: ({ id, input }) => orderService.updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['myOrders'] })
    },
  })

  const claimOrderMutation = useMutation<ClaimOrderResponse, Error, string>({
    mutationFn: orderService.claimOrder.bind(orderService),
  })

  const updateOrderMutation = useMutation<Order, Error, { id: string; input: UpdateOrderInput }>({
    mutationFn: ({ id, input }) => orderService.updateOrder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['myOrders'] })
    },
  })

  return {
    getOrderQuery,
    getMyOrdersQuery,
    createOrderMutation,
    updateStatusMutation,
    claimOrderMutation,
    updateOrderMutation,
  }
}
