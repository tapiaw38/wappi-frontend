<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { OrderData, OrderItem } from '../types/order'
import { calculateOrderTotal, formatPrice } from '../types/order'
import { orderService } from '../api/orderService'

const props = defineProps<{
  data: OrderData
  show: boolean
  isAdmin?: boolean
  canRequestModification?: boolean
  orderId?: string
}>()

const emit = defineEmits<{
  close: []
  updated: [data: OrderData]
  modificationRequested: []
}>()

const isEditing = ref(false)
const isRequestingModification = ref(false)
const saving = ref(false)
const submittingRequest = ref(false)
const editableItems = ref<OrderItem[]>([])
const modificationMessage = ref('')

// Initialize editable items when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    editableItems.value = props.data.items.map(item => ({ ...item }))
    isEditing.value = false
    isRequestingModification.value = false
    modificationMessage.value = ''
  }
})

const total = computed(() => {
  if (isEditing.value) {
    return editableItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  return calculateOrderTotal(props.data)
})

const startEditing = () => {
  editableItems.value = props.data.items.map(item => ({ ...item }))
  isEditing.value = true
}

const cancelEditing = () => {
  editableItems.value = props.data.items.map(item => ({ ...item }))
  isEditing.value = false
}

const addItem = () => {
  editableItems.value.push({
    name: '',
    price: 0,
    quantity: 1,
    weight: undefined
  })
}

const removeItem = (index: number) => {
  editableItems.value.splice(index, 1)
}

const saveChanges = async () => {
  if (!props.orderId || saving.value) return

  // Validate items
  const validItems = editableItems.value.filter(item =>
    item.name.trim() !== '' && item.price >= 0 && item.quantity > 0
  )

  if (validItems.length === 0) {
    alert('Debe haber al menos un producto valido')
    return
  }

  saving.value = true
  try {
    const newData: OrderData = { items: validItems }
    await orderService.updateOrder(props.orderId, { data: newData })
    emit('updated', newData)
    isEditing.value = false
  } catch (err) {
    console.error('Error updating order items:', err)
    alert('Error al guardar los cambios')
  } finally {
    saving.value = false
  }
}

const startRequestingModification = () => {
  modificationMessage.value = ''
  isRequestingModification.value = true
}

const cancelRequestingModification = () => {
  isRequestingModification.value = false
  modificationMessage.value = ''
}

const submitModificationRequest = async () => {
  if (!props.orderId || submittingRequest.value) return

  if (!modificationMessage.value.trim()) {
    alert('Por favor describe los cambios que necesitas')
    return
  }

  submittingRequest.value = true
  try {
    await orderService.updateOrder(props.orderId, {
      status: 'MODIFICATION_REQUESTED',
      status_message: modificationMessage.value.trim()
    })
    emit('modificationRequested')
    isRequestingModification.value = false
    handleClose()
  } catch (err) {
    console.error('Error submitting modification request:', err)
    alert('Error al enviar la solicitud')
  } finally {
    submittingRequest.value = false
  }
}

const handleClose = () => {
  isEditing.value = false
  isRequestingModification.value = false
  modificationMessage.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar pedido' : isRequestingModification ? 'Solicitar modificación' : 'Detalle del pedido' }}</h2>
          <button class="close-button" @click="handleClose">
            &times;
          </button>
        </div>

        <div class="modal-body">
          <!-- Request Modification Form -->
          <div v-if="isRequestingModification" class="modification-form">
            <div class="current-items">
              <h4>Items actuales:</h4>
              <div v-for="(item, index) in data.items" :key="index" class="item-summary">
                <span>{{ item.name }} x{{ item.quantity }}</span>
                <span>{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
              <div class="items-total">
                <span>Total:</span>
                <span>{{ formatPrice(calculateOrderTotal(data)) }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="modificationMessage">Describe los cambios que necesitas:</label>
              <textarea
                id="modificationMessage"
                v-model="modificationMessage"
                placeholder="Ej: Quisiera cambiar la pizza grande por una mediana, agregar una bebida..."
                rows="4"
                class="modification-textarea"
              ></textarea>
            </div>

            <div class="info-message">
              <span class="info-icon">ℹ️</span>
              <p>Tu pedido quedará en estado "Modificación Solicitada" hasta que el administrador procese tu solicitud.</p>
            </div>
          </div>

          <!-- View Mode -->
          <div v-else-if="!isEditing" class="items-list">
            <div v-for="(item, index) in data.items" :key="index" :class="['item-row', { 'pending-price': item.price === 0 }]">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
              <div v-if="item.price > 0" class="item-prices">
                <span class="item-unit-price">{{ formatPrice(item.price) }} c/u</span>
                <span class="item-subtotal">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
              <div v-else class="item-pending">
                <span class="pending-badge">Precio pendiente</span>
              </div>
            </div>


            <div class="total-section">
              <span class="total-label">Total</span>
              <span class="total-value">{{ formatPrice(total) }}</span>
            </div>

          </div>

          <!-- Edit Mode -->
          <div v-else class="items-list edit-mode">
            <div v-for="(item, index) in editableItems" :key="index" class="item-row-edit">
              <div class="item-fields">
                <input
                  v-model="item.name"
                  type="text"
                  placeholder="Nombre del producto"
                  class="item-input name-input"
                />
                <div class="item-number-fields">
                  <div class="field-group">
                    <label>Precio</label>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="item-input price-input"
                    />
                  </div>
                  <div class="field-group">
                    <label>Cant.</label>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="item-input quantity-input"
                    />
                  </div>
                  <div class="field-group">
                    <label>Peso (g)</label>
                    <input
                      v-model.number="item.weight"
                      type="number"
                      min="0"
                      placeholder="Opcional"
                      class="item-input weight-input"
                    />
                  </div>
                </div>
              </div>
              <button class="remove-btn" @click="removeItem(index)" title="Eliminar">
                &times;
              </button>
            </div>

            <button class="add-item-btn" @click="addItem">
              + Agregar producto
            </button>

            <div class="total-section">
              <span class="total-label">Total</span>
              <span class="total-value">{{ formatPrice(total) }}</span>
            </div>

            <!-- Info message for users who can request modification -->
            <div v-if="canRequestModification" class="info-message">
              <span class="info-icon">ℹ️</span>
              <p>Puedes solicitar modificaciones a tu pedido mientras no haya sido enviado. Una vez que el pedido esté "En camino", no será posible realizar cambios.</p>
            </div>

            <!-- Info message for users who cannot request modification -->
            <div v-if="!isAdmin && !canRequestModification" class="info-message warning">
              <span class="info-icon">⚠️</span>
              <p>El pedido ya está en camino o ha sido entregado. No es posible solicitar modificaciones en este momento.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <!-- Request Modification Mode -->
          <template v-if="isRequestingModification">
            <button class="cancel-btn" @click="cancelRequestingModification" :disabled="submittingRequest">
              Cancelar
            </button>
            <button class="submit-btn" @click="submitModificationRequest" :disabled="submittingRequest">
              {{ submittingRequest ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </template>
          <!-- Edit Mode -->
          <template v-else-if="isEditing">
            <button class="cancel-btn" @click="cancelEditing" :disabled="saving">
              Cancelar
            </button>
            <button class="save-btn" @click="saveChanges" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </template>
          <!-- View Mode -->
          <template v-else>
            <!-- Admin can edit directly -->
            <button v-if="isAdmin && orderId" class="edit-btn" @click="startEditing">
              Editar
            </button>
            <!-- User can request modification -->
            <button v-if="canRequestModification" class="request-btn" @click="startRequestingModification">
              ✏️ Solicitar modificación
            </button>
            <button class="close-btn" @click="handleClose">Cerrar</button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 450px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
}

/* Modification Form */
.modification-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-items {
  background: #f9fafb;
  border-radius: 8px;
  padding: 0.75rem;
}

.current-items h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #374151;
}

.item-summary {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 0.25rem 0;
}

.items-total {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.modification-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
}

.modification-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-name {
  font-weight: 500;
  color: #1f2937;
}

.item-quantity {
  color: #6b7280;
  font-size: 0.875rem;
}

.item-prices {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.item-unit-price {
  font-size: 0.75rem;
  color: #9ca3af;
}

.item-subtotal {
  font-weight: 600;
  color: #1f2937;
}

.item-row.pending-price {
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.item-pending {
  display: flex;
  align-items: center;
}

.pending-badge {
  background: #f59e0b;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}


/* Edit Mode Styles */
.edit-mode {
  gap: 1rem;
}

.item-row-edit {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.item-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.item-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.item-number-fields {
  display: flex;
  gap: 0.5rem;
}

.field-group {
  flex: 1;
}

.field-group label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.price-input,
.quantity-input {
  width: 100%;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.remove-btn:hover {
  background: #fecaca;
}

.add-item-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.add-item-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e5e7eb;
}

.total-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
}

.info-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.info-message.warning {
  background: #fef3c7;
  border-color: #fcd34d;
}

.info-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.info-message p {
  margin: 0;
  font-size: 0.8rem;
  color: #1e40af;
  line-height: 1.4;
}

.info-message.warning p {
  color: #92400e;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}

.close-btn,
.edit-btn,
.save-btn,
.cancel-btn,
.request-btn,
.submit-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
  font-size: 0.875rem;
}

.close-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.edit-btn {
  background: #10b981;
  color: white;
}

.edit-btn:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.request-btn {
  background: #f59e0b;
  color: white;
}

.request-btn:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.submit-btn {
  background: #f59e0b;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.cancel-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
