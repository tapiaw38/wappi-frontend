<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderService } from '../api/orderService'
import { paymentService } from '../api/paymentService'
import type { ClaimOrderResponse } from '../types/order'
import type { PaymentMethod } from '../types/payment'
import { StatusLabels, StatusIcons } from '../types/order'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'

const route = useRoute()
const router = useRouter()

const token = route.params.token as string

const loading = ref(true)
const claiming = ref(false)
const error = ref<string | null>(null)
const claimedOrder = ref<ClaimOrderResponse | null>(null)
const paymentMethods = ref<PaymentMethod[]>([])
const selectedPaymentMethod = ref<PaymentMethod | null>(null)
const cvv = ref('')
const showPaymentForm = ref(false)

// Fetch payment methods
const fetchPaymentMethods = async () => {
  try {
    const methods = await paymentService.getPaymentMethods()
    paymentMethods.value = methods
    // Auto-select default payment method
    const defaultMethod = methods.find(m => m.is_default)
    if (defaultMethod) {
      selectedPaymentMethod.value = defaultMethod
    } else if (methods.length > 0) {
      selectedPaymentMethod.value = methods[0]
    }
  } catch (err) {
    console.error('Error fetching payment methods:', err)
  }
}

const hasPaymentMethod = computed(() => paymentMethods.value.length > 0)

const claimOrder = async () => {
  if (!hasPaymentMethod.value || !selectedPaymentMethod.value || !cvv.value) {
    error.value = 'Por favor selecciona un método de pago e ingresa el CVV'
    return
  }

  if (cvv.value.length < 3 || cvv.value.length > 4) {
    error.value = 'El CVV debe tener 3 o 4 dígitos'
    return
  }

  claiming.value = true
  error.value = null

  try {
    const response = await orderService.claimOrder(token, cvv.value)

    // Check if order was already claimed (backend now returns order info instead of error)
    if (response.order_id && response.claimed_at) {
      // Order was already claimed, redirect to order page
      error.value = 'Esta orden ya fue reclamada. Redirigiendo...'
      setTimeout(() => router.push(`/order/${response.order_id}`), 1500)
      return
    }

    // New claim successful
    claimedOrder.value = response
    showPaymentForm.value = false
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { code?: string; message?: string } } }
    const errorCode = axiosError.response?.data?.code

    if (errorCode === 'order:token:expired') {
      error.value = 'El enlace ha expirado. Por favor, solicita uno nuevo.'
    } else if (errorCode === 'order:token:not-found') {
      error.value = 'Enlace invalido. Verifica que el enlace sea correcto.'
    } else if (errorCode === 'order:payment-failed') {
      error.value = 'El pago falló. Verifica tu CVV e intenta nuevamente.'
    } else {
      error.value = axiosError.response?.data?.message || 'Error al reclamar la orden. Intenta nuevamente.'
    }
  } finally {
    claiming.value = false
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

const goToPaymentMethods = () => {
  // Pass the claim token so we can return after adding a card
  router.push(`/payment-methods?returnTo=claim&token=${token}`)
}

onMounted(async () => {
  loading.value = true
  try {
    // First check if the order is already claimed
    const claimInfo = await orderService.getClaimInfo(token)

    if (claimInfo.is_claimed) {
      // Order already claimed, redirect to order details
      error.value = 'Esta orden ya fue reclamada. Redirigiendo...'
      setTimeout(() => router.push(`/order/${claimInfo.order_id}`), 1500)
      return
    }

    // Order not claimed, fetch payment methods and show form
    await fetchPaymentMethods()
    showPaymentForm.value = true
  } catch (err) {
    error.value = 'Error al cargar los métodos de pago'
  } finally {
    loading.value = false
  }
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
          <h2 class="state-title">Cargando...</h2>
          <p class="state-description">Estamos preparando tu orden...</p>
        </div>

        <!-- Payment Form -->
        <div v-else-if="showPaymentForm && !claimedOrder" class="state-container">
          <div class="state-icon payment-icon">
            <i class="pi pi-credit-card"></i>
          </div>
          <h2 class="state-title">Confirmar Pedido</h2>
          <p class="state-description">Ingresa el CVV de tu tarjeta para completar el pago</p>

          <div v-if="!hasPaymentMethod" class="no-payment-method">
            <i class="pi pi-exclamation-circle"></i>
            <p>No tienes métodos de pago registrados</p>
            <Button label="Agregar Tarjeta" @click="goToPaymentMethods" class="add-card-button" />
          </div>

          <div v-else class="payment-form">
            <div class="form-group">
              <label for="payment-method">Método de Pago</label>
              <Dropdown
                v-model="selectedPaymentMethod"
                :options="paymentMethods"
                optionLabel="last_four_digits"
                placeholder="Selecciona una tarjeta"
                class="payment-dropdown"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="payment-method-value">
                    <i class="pi pi-credit-card"></i>
                    <span>•••• {{ slotProps.value.last_four_digits }}</span>
                    <span class="cardholder">{{ slotProps.value.cardholder_name }}</span>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="payment-method-option">
                    <i class="pi pi-credit-card"></i>
                    <div>
                      <div>•••• {{ slotProps.option.last_four_digits }}</div>
                      <small>{{ slotProps.option.cardholder_name }}</small>
                    </div>
                  </div>
                </template>
              </Dropdown>
            </div>

            <div class="form-group">
              <label for="cvv">Código de Seguridad (CVV) *</label>
              <InputText
                id="cvv"
                v-model="cvv"
                placeholder="123"
                type="password"
                maxlength="4"
                class="cvv-input"
                :disabled="claiming"
              />
              <small>Ingresa el CVV de tu tarjeta</small>
            </div>

            <div v-if="error" class="error-message">
              <i class="pi pi-exclamation-triangle"></i>
              {{ error }}
            </div>

            <Button
              label="Confirmar y Pagar"
              @click="claimOrder"
              :loading="claiming"
              :disabled="!cvv || !selectedPaymentMethod"
              class="submit-button"
            />
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="claimedOrder" class="state-container success">
          <div class="state-icon success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="state-title">¡Pago Confirmado!</h2>
          <p class="state-description">Tu pedido ha sido confirmado y el pago procesado exitosamente.</p>

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

        <!-- Error State (without payment form) -->
        <div v-else-if="error && !showPaymentForm" class="state-container error">
          <div class="state-icon error-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h2 class="state-title">No se pudo procesar</h2>
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
  max-width: 480px;
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
  font-size: 2rem;
  color: white;
}

.loading-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.payment-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.success-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.error-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

.no-payment-method {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
}

.no-payment-method i {
  font-size: 2rem;
  color: #f59e0b;
  margin-bottom: 0.5rem;
}

.no-payment-method p {
  color: #92400e;
  margin: 0.5rem 0 1rem 0;
}

.add-card-button {
  background: #f59e0b !important;
  border-color: #f59e0b !important;
}

.payment-form {
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.payment-dropdown,
.cvv-input {
  width: 100%;
}

.payment-method-value,
.payment-method-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cardholder {
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: auto;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.submit-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  padding: 0.875rem !important;
  font-weight: 600 !important;
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
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
