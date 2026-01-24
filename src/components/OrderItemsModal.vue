<script setup lang="ts">
import { computed } from 'vue'
import type { OrderData } from '../types/order'
import { calculateOrderTotal, formatPrice } from '../types/order'

const props = defineProps<{
  data: OrderData
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const total = computed(() => calculateOrderTotal(props.data))
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalle del pedido</h2>
          <button class="close-button" @click="emit('close')">
            &times;
          </button>
        </div>

        <div class="modal-body">
          <div class="items-list">
            <div v-for="(item, index) in data.items" :key="index" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
              <div class="item-prices">
                <span class="item-unit-price">{{ formatPrice(item.price) }} c/u</span>
                <span class="item-subtotal">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <div class="total-section">
            <span class="total-label">Total</span>
            <span class="total-value">{{ formatPrice(total) }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="close-btn" @click="emit('close')">Cerrar</button>
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
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
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

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.close-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.close-btn:active {
  transform: translateY(0);
}
</style>
