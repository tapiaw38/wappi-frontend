<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiClient } from '../api/client'

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
  status_index: number
  eta: string
  created_at: string
  updated_at: string
  all_statuses: string[]
}

const profiles = ref<Profile[]>([])
const orders = ref<Order[]>([])
const loading = ref(true)
const activeTab = ref<'orders' | 'profiles'>('orders')
const editingOrder = ref<Order | null>(null)
const editForm = ref({ status: '', eta: '' })
const saving = ref(false)

const statusLabels: Record<string, string> = {
  CREATED: 'Creado',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En Preparación',
  ON_THE_WAY: 'En Camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
}

const statusColors: Record<string, string> = {
  CREATED: '#6b7280',
  CONFIRMED: '#3b82f6',
  PREPARING: '#f59e0b',
  ON_THE_WAY: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444'
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
  } catch (err) {
    console.error('Error fetching data:', err)
  } finally {
    loading.value = false
  }
}

const getProfileForOrder = (profileId: string) => {
  return profiles.value.find(p => p.id === profileId)
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <h1>Panel de Administración</h1>
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
                  <span v-if="getProfileForOrder(order.profile_id)" class="profile-info">
                    {{ getProfileForOrder(order.profile_id)?.phone_number }}
                  </span>
                  <span v-else class="profile-unknown">-</span>
                </td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td>
                  <button class="edit-btn" @click="startEdit(order)">Editar</button>
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
                <th>User ID</th>
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
                <td>{{ profile.user_id }}</td>
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

.edit-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #5a67d8;
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

.btn-cancel:disabled,
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
