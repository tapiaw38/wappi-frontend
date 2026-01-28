<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderService } from '../api/orderService'
import { profileService } from '../api/profileService'
import type { Order } from '../types/order'
import { calculateOrderTotal, formatPrice } from '../types/order'
import type { Profile } from '../types/profile'
import OrderHeader from '../components/OrderHeader.vue'
import OrderTimeline from '../components/OrderTimeline.vue'
import OrderItemsModal from '../components/OrderItemsModal.vue'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const profile = ref<Profile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)
const showItemsModal = ref(false)
const currentUserId = ref<string | null>(null)

let refreshInterval: ReturnType<typeof setInterval> | null = null

// Get current user ID from JWT token
const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.user_id || null
  } catch {
    return null
  }
}

// Check if the current user is the owner of the profile
const isProfileOwner = computed(() => {
  if (!currentUserId.value || !profile.value) return false
  return profile.value.user_id === currentUserId.value
})

// Check if user can request modification (profile owner AND status before ON_THE_WAY)
const canRequestModification = computed(() => {
  if (!isProfileOwner.value || !order.value) return false
  return ['CREATED', 'CONFIRMED', 'PREPARING'].includes(order.value.status)
})

// Check if profile can be edited (CREATED, CONFIRMED or PREPARING)
const canEditProfile = computed(() => {
  if (!order.value) return false
  return ['CREATED', 'CONFIRMED', 'PREPARING'].includes(order.value.status)
})

// Check if order has items data
const hasOrderItems = computed(() => {
  return order.value?.data?.items && order.value.data.items.length > 0
})

// Calculate order total
const orderTotal = computed(() => {
  return calculateOrderTotal(order.value?.data)
})

// Check if there are items with pending price
const hasPendingPrices = computed(() => {
  return order.value?.data?.items?.some(item => item.price === 0) ?? false
})

const fetchOrder = async () => {
  try {
    const id = route.params.id as string
    order.value = await orderService.getOrder(id)
    lastUpdated.value = new Date()
    error.value = null
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'No se pudo cargar el pedido'
    order.value = null
  } finally {
    loading.value = false
  }
}

const fetchProfile = async (profileId: string) => {
  try {
    profile.value = await profileService.getProfile(profileId)
  } catch (err: unknown) {
    console.error('Error fetching profile:', err)
    profile.value = null
  }
}

// Fetch profile when order is loaded
watch(() => order.value?.profile_id, (profileId) => {
  if (profileId) {
    fetchProfile(profileId)
  }
}, { immediate: true })

const refresh = async () => {
  await fetchOrder()
}

const editProfile = () => {
  if (order.value) {
    router.push(`/edit-profile/${order.value.profile_id}`)
  }
}

onMounted(() => {
  currentUserId.value = getCurrentUserId()
  fetchOrder()
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(fetchOrder, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="order-view">
    <header class="app-header">
      <h1 class="app-title">📦 Seguimiento de Pedido</h1>
    </header>

    <main class="main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando pedido...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">😕</div>
        <h2>Pedido no encontrado</h2>
        <p>{{ error }}</p>
        <button @click="refresh" class="retry-button">
          Intentar de nuevo
        </button>
      </div>

      <!-- Order Content -->
      <div v-else-if="order" class="order-content">
        <OrderHeader :order="order" />
        <OrderTimeline :order="order" />

        <!-- Order Summary Card -->
        <div v-if="hasOrderItems" class="order-summary-card">
          <div class="summary-header">
            <h3>Resumen del pedido</h3>
          </div>
          <div class="summary-content">
            <div class="summary-info">
              <span class="items-count">{{ order.data!.items.length }} producto(s)</span>
              <span class="total-amount">{{ formatPrice(orderTotal) }}</span>
            </div>
            <button class="view-details-button" @click="showItemsModal = true">
              Ver detalle
            </button>
          </div>
          <!-- Pending prices message -->
          <div v-if="hasPendingPrices" class="pending-price-notice">
            <span class="pending-icon">🔍</span>
            <p>Estamos buscando el mejor precio para algunos productos. Tu pedido está siendo preparado.</p>
          </div>
        </div>

        <!-- Delivery Info Card -->
        <div v-if="profile" class="delivery-card">
          <div class="delivery-header">
            <h3>El pedido se entregará en:</h3>
            <button
              v-if="canEditProfile"
              @click="editProfile"
              class="edit-button"
            >
              Cambiar datos
            </button>
          </div>
          <div class="delivery-info">
            <div class="info-row">
              <span class="info-icon">📍</span>
              <span class="info-text">{{ profile.location?.address || 'Sin dirección' }}</span>
            </div>
            <div class="info-row">
              <span class="info-icon">📞</span>
              <span class="info-text">{{ profile.phone_number }}</span>
            </div>
          </div>
          <p v-if="!canEditProfile" class="edit-notice">
            Los datos de entrega solo se pueden modificar mientras el pedido no ha sido enviado
          </p>
        </div>

        <div class="refresh-section">
          <button @click="refresh" class="refresh-button">
            🔄 Actualizar estado
          </button>
          <p v-if="lastUpdated" class="last-updated">
            Última actualización: {{ lastUpdated.toLocaleTimeString('es-ES') }}
          </p>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>Powered by WhatsApp IA Assistant</p>
    </footer>

    <!-- Order Items Modal -->
    <OrderItemsModal
      v-if="order?.data"
      :data="order.data"
      :show="showItemsModal"
      :can-request-modification="canRequestModification"
      :order-id="order.id"
      @close="showItemsModal = false"
      @modification-requested="refresh"
    />
  </div>
</template>

<style scoped>
.order-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.app-header {
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin: 0;
}

.main-content {
  flex: 1;
  padding: 1rem;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.retry-button,
.refresh-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-button:hover,
.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.retry-button:active,
.refresh-button:active {
  transform: translateY(0);
}

.order-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.refresh-section {
  margin-top: 1.5rem;
  text-align: center;
}

.last-updated {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.delivery-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.delivery-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.edit-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.edit-button:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.edit-button:active {
  transform: translateY(0);
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.info-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.info-text {
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.4;
}

.edit-notice {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.75rem 0 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  text-align: center;
}

.order-summary-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.summary-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.items-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
}

.view-details-button {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.view-details-button:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.view-details-button:active {
  transform: translateY(0);
}

.pending-price-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fcd34d;
}

.pending-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.pending-price-notice p {
  margin: 0;
  font-size: 0.8rem;
  color: #92400e;
  line-height: 1.4;
}

.app-footer {
  background: white;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.app-footer p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}
</style>
