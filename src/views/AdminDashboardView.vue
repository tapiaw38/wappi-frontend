<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '../api/client'
import { authClient } from '../api/authClient'
import wappiLogo from '../assets/img/wappi-logo.png'

interface Location {
  id: string
  longitude: number
  latitude: number
  address: string
}

interface Profile {
  id: string
  user_id: string
  phone_number: string
  location: Location | null
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  profile_id: string
  status: string
  status_message?: string
  status_index: number
  eta: string
  data?: {
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
  }
  created_at: string
  updated_at: string
  all_statuses: string[]
}

interface UserInfo {
  id: string
  first_name: string
  last_name: string
  email: string
}

const profiles = ref<Profile[]>([])
const orders = ref<Order[]>([])
const usersMap = ref<Map<string, UserInfo>>(new Map())
const loading = ref(true)
const activeTab = ref<'orders' | 'profiles'>('orders')
const editingOrder = ref<Order | null>(null)
const editForm = ref({ status: '', eta: '' })
const saving = ref(false)
const viewingProfile = ref<Profile | null>(null)
const pausingOrder = ref<Order | null>(null)
const pauseForm = ref({ reason: '', customMessage: '' })
const viewingOrder = ref<Order | null>(null)
const pauseReasons = [
  { value: 'phone', label: 'Número de teléfono incorrecto' },
  { value: 'address', label: 'Dirección incompleta o incorrecta' },
  { value: 'zone', label: 'Fuera de zona de entrega' },
  { value: 'no_response', label: 'Cliente no responde' },
  { value: 'other', label: 'Otro' }
]

const statusLabels: Record<string, string> = {
  CREATED: 'Creado',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En Preparación',
  ON_THE_WAY: 'En Camino',
  DELIVERED: 'Entregado',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado'
}

const statusColors: Record<string, string> = {
  CREATED: '#6b7280',
  CONFIRMED: '#3b82f6',
  PREPARING: '#f59e0b',
  ON_THE_WAY: '#8b5cf6',
  DELIVERED: '#10b981',
  PAUSED: '#f59e0b',
  CANCELLED: '#ef4444'
}

const fetchUserInfo = async (userId: string): Promise<UserInfo | null> => {
  try {
    const response = await authClient.get(`/user/${userId}`)
    return response.data.data
  } catch (err) {
    console.error(`Error fetching user ${userId}:`, err)
    return null
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const [profilesRes, ordersRes] = await Promise.all([
      apiClient.get('/api/admin/profiles'),
      apiClient.get('/api/admin/orders')
    ])
    profiles.value = profilesRes.data.profiles
    orders.value = ordersRes.data.orders

    // Fetch user info for all unique user_ids
    const uniqueUserIds = [...new Set(profiles.value.map(p => p.user_id))]
    const userInfoPromises = uniqueUserIds.map(async (userId) => {
      const userInfo = await fetchUserInfo(userId)
      if (userInfo) {
        usersMap.value.set(userId, userInfo)
      }
    })
    await Promise.all(userInfoPromises)
  } catch (err) {
    console.error('Error fetching data:', err)
  } finally {
    loading.value = false
  }
}

const getUserInfo = (userId: string): UserInfo | undefined => {
  return usersMap.value.get(userId)
}

const getUserDisplayName = (userId: string): string => {
  const user = usersMap.value.get(userId)
  if (user) {
    return `${user.first_name} ${user.last_name}`
  }
  return userId.slice(0, 12) + '...'
}

const getProfileForOrder = (profileId: string) => {
  return profiles.value.find(p => p.id === profileId)
}

const openProfileDetail = (profile: Profile) => {
  viewingProfile.value = profile
}

const closeProfileDetail = () => {
  viewingProfile.value = null
}

const openOrderDetail = (order: Order) => {
  viewingOrder.value = order
}

const closeOrderDetail = () => {
  viewingOrder.value = null
}

const startEdit = (order: Order) => {
  editingOrder.value = order
  editForm.value = {
    status: order.status,
    eta: order.eta
  }
}

const cancelEdit = () => {
  editingOrder.value = null
  editForm.value = { status: '', eta: '' }
}

const startPause = (order: Order) => {
  pausingOrder.value = order
  pauseForm.value = { reason: '', customMessage: '' }
}

const cancelPause = () => {
  pausingOrder.value = null
  pauseForm.value = { reason: '', customMessage: '' }
}

const savePause = async () => {
  if (!pausingOrder.value || !pauseForm.value.reason) return

  saving.value = true
  try {
    let statusMessage = ''
    const reason = pauseReasons.find(r => r.value === pauseForm.value.reason)
    
    if (pauseForm.value.reason === 'other') {
      statusMessage = pauseForm.value.customMessage || 'Pedido pausado'
    } else {
      statusMessage = reason?.label || 'Pedido pausado'
      if (pauseForm.value.customMessage) {
        statusMessage += `: ${pauseForm.value.customMessage}`
      }
    }

    const response = await apiClient.put(`/api/admin/orders/${pausingOrder.value.id}`, {
      status: 'PAUSED',
      status_message: statusMessage
    })

    const index = orders.value.findIndex(o => o.id === pausingOrder.value?.id)
    if (index !== -1) {
      orders.value[index] = response.data
    }

    cancelPause()
  } catch (err) {
    console.error('Error pausing order:', err)
    alert('Error al pausar la orden')
  } finally {
    saving.value = false
  }
}

const saveCancel = async () => {
  if (!pausingOrder.value || !pauseForm.value.reason) return

  saving.value = true
  try {
    let statusMessage = ''
    const reason = pauseReasons.find(r => r.value === pauseForm.value.reason)
    
    if (pauseForm.value.reason === 'other') {
      statusMessage = pauseForm.value.customMessage || 'Pedido cancelado'
    } else {
      statusMessage = reason?.label || 'Pedido cancelado'
      if (pauseForm.value.customMessage) {
        statusMessage += `: ${pauseForm.value.customMessage}`
      }
    }

    const response = await apiClient.put(`/api/admin/orders/${pausingOrder.value.id}`, {
      status: 'CANCELLED',
      status_message: statusMessage
    })

    const index = orders.value.findIndex(o => o.id === pausingOrder.value?.id)
    if (index !== -1) {
      orders.value[index] = response.data
    }

    cancelPause()
  } catch (err) {
    console.error('Error cancelling order:', err)
    alert('Error al cancelar la orden')
  } finally {
    saving.value = false
  }
}

const saveOrder = async () => {
  if (!editingOrder.value) return

  saving.value = true
  try {
    const response = await apiClient.put(`/api/admin/orders/${editingOrder.value.id}`, {
      status: editForm.value.status,
      eta: editForm.value.eta
    })

    // Update local order
    const index = orders.value.findIndex(o => o.id === editingOrder.value?.id)
    if (index !== -1) {
      orders.value[index] = response.data
    }

    cancelEdit()
  } catch (err) {
    console.error('Error saving order:', err)
    alert('Error al guardar la orden')
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

const getOrderLink = (orderId: string) => {
  return `${window.location.origin}/order/${orderId}`
}

const getGoogleMapsLink = (lat: number, lng: number) => {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

const calculateOrderTotal = (order: Order): number => {
  if (!order.data?.items) return 0
  return order.data.items.reduce((total, item) => total + (item.price * item.quantity), 0)
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

const shareOrderOnWhatsApp = (order: Order) => {
  const profile = getProfileForOrder(order.profile_id)
  if (!profile) return

  const user = getUserInfo(profile.user_id)
  const userName = user ? `${user.first_name} ${user.last_name}` : 'Cliente'
  const orderLink = getOrderLink(order.id)

  let message = `*Pedido para ${userName}*\n\n`
  message += `*Estado:* ${statusLabels[order.status] || order.status}\n`
  message += `*ETA:* ${order.eta}\n`
  message += `*Teléfono:* ${profile.phone_number}\n`

  if (profile.location) {
    const mapsLink = getGoogleMapsLink(profile.location.latitude, profile.location.longitude)
    message += `*Dirección:* ${profile.location.address}\n`
    message += `*Ubicación:* ${mapsLink}\n`
  }

  message += `\n*Ver pedido:* ${orderLink}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <img :src="wappiLogo" alt="Wappi" class="header-logo" />
        <h1>Panel de Administración</h1>
      </div>
      <button @click="fetchData" class="refresh-btn" :disabled="loading">
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </header>

    <nav class="tabs">
      <button
        :class="['tab', { active: activeTab === 'orders' }]"
        @click="activeTab = 'orders'"
      >
        Órdenes ({{ orders.length }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'profiles' }]"
        @click="activeTab = 'profiles'"
      >
        Perfiles ({{ profiles.length }})
      </button>
    </nav>

    <main class="dashboard-content">
      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
      </div>

      <!-- Orders Tab -->
      <div v-else-if="activeTab === 'orders'" class="orders-list">
        <div v-if="orders.length === 0" class="empty-state">
          <p>No hay órdenes registradas</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Estado</th>
                <th>ETA</th>
                <th>Pedido</th>
                <th>Perfil</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="id-cell">
                  <span class="id-text">{{ order.id.slice(0, 8) }}...</span>
                  <button class="copy-btn" @click="copyToClipboard(getOrderLink(order.id))" title="Copiar link">
                    📋
                  </button>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :style="{ backgroundColor: statusColors[order.status] }"
                  >
                    {{ statusLabels[order.status] || order.status }}
                  </span>
                </td>
                <td>{{ order.eta }}</td>
                <td>
                  <button
                    v-if="order.data && order.data.items && order.data.items.length > 0"
                    class="view-order-btn"
                    @click="openOrderDetail(order)"
                    title="Ver detalles del pedido"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>{{ order.data.items.length }} item(s)</span>
                  </button>
                  <span v-else class="no-items">Sin items</span>
                </td>
                <td>
                  <button
                    v-if="getProfileForOrder(order.profile_id)"
                    class="profile-link"
                    @click="openProfileDetail(getProfileForOrder(order.profile_id)!)"
                  >
                    <span class="profile-name">{{ getUserDisplayName(getProfileForOrder(order.profile_id)!.user_id) }}</span>
                    <span class="profile-phone">{{ getProfileForOrder(order.profile_id)?.phone_number }}</span>
                  </button>
                  <span v-else class="profile-unknown">-</span>
                </td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td class="actions-cell">
                  <button class="edit-btn" @click="startEdit(order)" title="Editar orden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="order.status !== 'CANCELLED' && order.status !== 'DELIVERED'"
                    class="pause-cancel-btn"
                    @click="startPause(order)"
                    title="Pausar o Cancelar pedido"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </button>
                  <button
                    v-if="getProfileForOrder(order.profile_id)"
                    class="share-btn"
                    @click="shareOrderOnWhatsApp(order)"
                    title="Compartir por WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Profiles Tab -->
      <div v-else-if="activeTab === 'profiles'" class="profiles-list">
        <div v-if="profiles.length === 0" class="empty-state">
          <p>No hay perfiles registrados</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="profile in profiles" :key="profile.id">
                <td class="id-cell">
                  <span class="id-text">{{ profile.id.slice(0, 8) }}...</span>
                  <button class="copy-btn" @click="copyToClipboard(profile.id)" title="Copiar ID">
                    📋
                  </button>
                </td>
                <td class="user-cell">
                  <div v-if="getUserInfo(profile.user_id)" class="user-info">
                    <span class="user-name">{{ getUserDisplayName(profile.user_id) }}</span>
                    <span class="user-email">{{ getUserInfo(profile.user_id)?.email }}</span>
                  </div>
                  <span v-else class="user-id-fallback">{{ profile.user_id.slice(0, 12) }}...</span>
                </td>
                <td>{{ profile.phone_number }}</td>
                <td class="address-cell">
                  {{ profile.location?.address || 'Sin dirección' }}
                </td>
                <td>{{ formatDate(profile.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Edit Order Modal -->
    <div v-if="editingOrder" class="modal-overlay" @click.self="cancelEdit">
      <div class="modal">
        <h2>Editar Orden</h2>
        <p class="modal-id">ID: {{ editingOrder.id }}</p>

        <div class="form-group">
          <label>Estado</label>
          <select v-model="editForm.status" class="form-select">
            <option
              v-for="status in editingOrder.all_statuses"
              :key="status"
              :value="status"
            >
              {{ statusLabels[status] || status }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Tiempo estimado (ETA)</label>
          <input
            v-model="editForm.eta"
            type="text"
            class="form-input"
            placeholder="ej: 30 minutos"
          />
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelEdit" :disabled="saving">
            Cancelar
          </button>
          <button class="btn-save" @click="saveOrder" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pause/Cancel Order Modal -->
    <div v-if="pausingOrder" class="modal-overlay" @click.self="cancelPause">
      <div class="modal">
        <h2>Pausar o Cancelar Pedido</h2>
        <p class="modal-id">ID: {{ pausingOrder.id }}</p>

        <div class="form-group">
          <label>Razón</label>
          <select v-model="pauseForm.reason" class="form-select">
            <option value="">Seleccione una razón</option>
            <option
              v-for="reason in pauseReasons"
              :key="reason.value"
              :value="reason.value"
            >
              {{ reason.label }}
            </option>
          </select>
        </div>

        <div v-if="pauseForm.reason" class="form-group">
          <label>Mensaje adicional (opcional)</label>
          <textarea
            v-model="pauseForm.customMessage"
            class="form-textarea"
            placeholder="Agregar detalles adicionales..."
            rows="3"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelPause" :disabled="saving">
            Cancelar
          </button>
          <button
            v-if="pausingOrder.status !== 'PAUSED'"
            class="btn-pause"
            @click="savePause"
            :disabled="saving || !pauseForm.reason"
          >
            {{ saving ? 'Pausando...' : 'Pausar' }}
          </button>
          <button
            class="btn-cancel-order"
            @click="saveCancel"
            :disabled="saving || !pauseForm.reason"
          >
            {{ saving ? 'Cancelando...' : 'Cancelar Pedido' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Detail Modal -->
    <div v-if="viewingProfile" class="modal-overlay" @click.self="closeProfileDetail">
      <div class="modal profile-modal">
        <h2>Detalle del Perfil</h2>

        <div class="profile-detail-section">
          <h3>Usuario</h3>
          <div v-if="getUserInfo(viewingProfile.user_id)" class="detail-content">
            <div class="detail-row">
              <span class="detail-label">Nombre:</span>
              <span class="detail-value">{{ getUserDisplayName(viewingProfile.user_id) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ getUserInfo(viewingProfile.user_id)?.email }}</span>
            </div>
          </div>
          <div v-else class="detail-content">
            <div class="detail-row">
              <span class="detail-label">ID:</span>
              <span class="detail-value user-id-text">{{ viewingProfile.user_id }}</span>
            </div>
          </div>
        </div>

        <div class="profile-detail-section">
          <h3>Contacto</h3>
          <div class="detail-content">
            <div class="detail-row">
              <span class="detail-label">Teléfono:</span>
              <span class="detail-value">{{ viewingProfile.phone_number }}</span>
            </div>
          </div>
        </div>

        <div class="profile-detail-section">
          <h3>Ubicación</h3>
          <div v-if="viewingProfile.location" class="detail-content">
            <div class="detail-row">
              <span class="detail-label">Dirección:</span>
              <span class="detail-value">{{ viewingProfile.location.address }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Coordenadas:</span>
              <span class="detail-value">
                <a
                  :href="getGoogleMapsLink(viewingProfile.location.latitude, viewingProfile.location.longitude)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="maps-link"
                >
                  📍 Ver en Google Maps
                </a>
              </span>
            </div>
          </div>
          <div v-else class="detail-content">
            <span class="no-data">Sin ubicación registrada</span>
          </div>
        </div>

        <div class="profile-detail-section">
          <h3>Fechas</h3>
          <div class="detail-content">
            <div class="detail-row">
              <span class="detail-label">Creado:</span>
              <span class="detail-value">{{ formatDate(viewingProfile.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Actualizado:</span>
              <span class="detail-value">{{ formatDate(viewingProfile.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeProfileDetail">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="viewingOrder" class="modal-overlay" @click.self="closeOrderDetail">
      <div class="modal order-modal">
        <h2>Detalles del Pedido</h2>
        <p class="modal-id">ID: {{ viewingOrder.id }}</p>

        <div v-if="viewingOrder.data && viewingOrder.data.items && viewingOrder.data.items.length > 0" class="order-items-section">
          <h3>Items del Pedido</h3>
          <div class="items-list">
            <div v-for="(item, index) in viewingOrder.data.items" :key="index" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-quantity">Cantidad: {{ item.quantity }}</span>
              </div>
              <div class="item-price">
                {{ formatPrice(item.price * item.quantity) }}
              </div>
            </div>
          </div>
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-amount">{{ formatPrice(calculateOrderTotal(viewingOrder)) }}</span>
          </div>
        </div>
        <div v-else class="no-items-message">
          <p>Este pedido no tiene items registrados.</p>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeOrderDetail">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f1f5f9;
}

.dashboard-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-logo {
  height: 40px;
  width: auto;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1rem;
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s;
}

.tab:hover {
  color: #1e293b;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.dashboard-content {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.id-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.id-text {
  font-family: monospace;
  font-size: 0.875rem;
  color: #64748b;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.profile-info {
  font-size: 0.875rem;
}

.profile-unknown {
  color: #94a3b8;
}

.address-cell {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-cell {
  min-width: 180px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.user-id-fallback {
  font-family: monospace;
  font-size: 0.875rem;
  color: #94a3b8;
}

.view-order-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.view-order-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.view-order-btn svg {
  width: 16px;
  height: 16px;
}

.no-items {
  color: #94a3b8;
  font-size: 0.875rem;
}

.profile-link {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.profile-link:hover {
  background: #e0e7ff;
}

.profile-name {
  font-weight: 500;
  color: #4f46e5;
}

.profile-phone {
  font-size: 0.75rem;
  color: #6b7280;
}

.profile-modal {
  max-width: 500px;
}

.order-modal {
  max-width: 600px;
}

.order-items-section {
  margin-bottom: 1.5rem;
}

.order-items-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.item-quantity {
  font-size: 0.75rem;
  color: #6b7280;
}

.item-price {
  font-weight: 700;
  color: #667eea;
  font-size: 1rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #667eea;
  color: white;
  border-radius: 8px;
  margin-top: 1rem;
}

.total-label {
  font-size: 1rem;
  font-weight: 600;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
}

.no-items-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-items-message p {
  margin: 0;
  font-size: 0.875rem;
}

.profile-detail-section {
  margin-bottom: 1.25rem;
}

.profile-detail-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-content {
  padding-left: 0.5rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.375rem;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.875rem;
  color: #1f2937;
  word-break: break-word;
}

.detail-value.coordinates {
  font-family: monospace;
  font-size: 0.8rem;
}

.maps-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s;
}

.maps-link:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.detail-value.user-id-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.no-data {
  font-size: 0.875rem;
  color: #9ca3af;
  font-style: italic;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-right: 0.5rem;
}

.edit-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.pause-cancel-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-right: 0.5rem;
}

.pause-cancel-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.share-btn {
  background: #25D366;
  color: white;
  border: none;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.share-btn:hover {
  background: #20ba5a;
  transform: translateY(-1px);
}

.edit-btn svg,
.pause-cancel-btn svg,
.share-btn svg {
  width: 18px;
  height: 18px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.modal h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.modal-id {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  font-family: monospace;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-save {
  background: #667eea;
  border: none;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #5a67d8;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-pause {
  background: #f59e0b;
  border: none;
  color: white;
}

.btn-pause:hover:not(:disabled) {
  background: #d97706;
}

.btn-cancel-order {
  background: #ef4444;
  border: none;
  color: white;
}

.btn-cancel-order:hover:not(:disabled) {
  background: #dc2626;
}
</style>
