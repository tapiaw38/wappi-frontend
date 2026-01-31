<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderService } from '../api/orderService'
import type { ClaimOrderResponse } from '../types/order'
import { StatusLabels, StatusIcons } from '../types/order'

const route = useRoute()
const router = useRouter()

const token = route.params.token as string

const loading = ref(true)
const error = ref<string | null>(null)
const claimedOrder = ref<ClaimOrderResponse | null>(null)

const claimOrder = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await orderService.claimOrder(token)
    claimedOrder.value = response
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { code?: string; message?: string } } }
    const errorCode = axiosError.response?.data?.code

    if (errorCode === 'order:token:expired') {
      error.value = 'El enlace ha expirado. Por favor, solicita uno nuevo.'
    } else if (errorCode === 'order:token:already-claimed') {
      error.value = 'Esta orden ya fue reclamada.'
    } else if (errorCode === 'order:token:not-found') {
      error.value = 'Enlace invalido. Verifica que el enlace sea correcto.'
    } else {
      error.value = axiosError.response?.data?.message || 'Error al reclamar la orden. Intenta nuevamente.'
    }
  } finally {
    loading.value = false
  }
}

const goToOrder = () => {
  if (claimedOrder.value) {
    router.push(`/order/${claimedOrder.value.order_id}`)
  }
}

const goToProfile = () => {
  router.push('/profile')
}

onMounted(() => {
  claimOrder()
})
</script>

<template>
  <div class="claim-container">
    <div class="claim-background">
      <div class="claim-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <div class="claim-content">
      <div class="claim-header">
        <div class="logo-container">
          <div class="logo-icon">
            <span>W</span>
          </div>
          <h1 class="logo-text">Wappi</h1>
        </div>
      </div>

      <div class="claim-card">
        <!-- Loading State -->
        <div v-if="loading" class="state-container">
          <div class="state-icon loading-icon">
            <div class="spinner"></div>
          </div>
          <h2 class="state-title">Procesando tu orden</h2>
          <p class="state-description">Estamos vinculando esta orden a tu cuenta...</p>
        </div>

        <!-- Success State -->
        <div v-else-if="claimedOrder" class="state-container success">
          <div class="state-icon success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="state-title">Orden Reclamada</h2>
          <p class="state-description">La orden ha sido vinculada a tu cuenta exitosamente.</p>

          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">ID de Orden</span>
              <span class="detail-value">{{ claimedOrder.order_id.slice(0, 8) }}...</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado</span>
              <span class="detail-value status-badge">
                <i :class="['pi', StatusIcons[claimedOrder.status] || 'pi-box']"></i>
                {{ StatusLabels[claimedOrder.status] }}
              </span>
            </div>
            <div v-if="claimedOrder.eta" class="detail-row">
              <span class="detail-label">Tiempo Estimado</span>
              <span class="detail-value">{{ claimedOrder.eta }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="primary-button" @click="goToOrder">
              Ver Estado de la Orden
            </button>
            <button class="secondary-button" @click="goToProfile">
              Ir a Mi Perfil
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="state-container error">
          <div class="state-icon error-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h2 class="state-title">No se pudo reclamar</h2>
          <p class="state-description">{{ error }}</p>

          <div class="action-buttons">
            <button class="secondary-button" @click="goToProfile">
              Ir a Mi Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claim-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.claim-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.claim-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
  border-radius: 50%;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.claim-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 2rem;
}

.claim-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.logo-icon span {
  font-size: 1.75rem;
  font-weight: 700;
  color: #667eea;
}

.logo-text {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.claim-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.state-container {
  text-align: center;
}

.state-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.success-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.success-icon span {
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.error-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.error-icon span {
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.state-description {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.order-details {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.detail-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-value {
  color: #1f2937;
  font-weight: 500;
}

.status-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.primary-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary-button:hover {
  background: #f5f3ff;
}

@media (max-width: 480px) {
  .claim-content {
    padding: 1rem;
  }

  .claim-card {
    padding: 1.5rem;
  }

  .logo-text {
    font-size: 1.5rem;
  }
}
</style>
