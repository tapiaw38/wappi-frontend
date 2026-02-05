import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { websocketService, type Notification, type OrderClaimedPayload } from '@/services/websocket/websocketService'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  onOrderClaimed?: (payload: OrderClaimedPayload) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export interface UseWebSocketReturn {
  isConnected: Ref<boolean>
  connect: (token: string) => void
  disconnect: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const isConnected = ref(false)
  let unsubscribeMessage: (() => void) | null = null
  let unsubscribeConnect: (() => void) | null = null
  let unsubscribeDisconnect: (() => void) | null = null

  const handleMessage = (notification: Notification) => {
    if (notification.type === 'order_claimed' && options.onOrderClaimed) {
      options.onOrderClaimed(notification.payload as OrderClaimedPayload)
    }
  }

  const handleConnect = () => {
    isConnected.value = true
    options.onConnected?.()
  }

  const handleDisconnect = () => {
    isConnected.value = false
    options.onDisconnected?.()
  }

  onMounted(() => {
    unsubscribeMessage = websocketService.onMessage(handleMessage)
    unsubscribeConnect = websocketService.onConnect(handleConnect)
    unsubscribeDisconnect = websocketService.onDisconnect(handleDisconnect)

    // Set initial connection state
    isConnected.value = websocketService.isConnected()
  })

  onUnmounted(() => {
    unsubscribeMessage?.()
    unsubscribeConnect?.()
    unsubscribeDisconnect?.()
  })

  const connect = (token: string) => {
    websocketService.connect(token)
  }

  const disconnect = () => {
    websocketService.disconnect()
  }

  return {
    isConnected,
    connect,
    disconnect,
  }
}
