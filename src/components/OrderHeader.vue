<script setup lang="ts">
import type { Order } from '../types/order'
import { StatusLabels, StatusIcons } from '../types/order'
import { computed } from 'vue'

const props = defineProps<{
  order: Order
}>()

const formattedDate = computed(() => {
  const date = new Date(props.order.created_at)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const currentStatusLabel = computed(() => StatusLabels[props.order.status] || props.order.status)
const currentStatusIcon = computed(() => StatusIcons[props.order.status] || 'pi-box')
</script>

<template>
  <div class="order-header">
    <div class="order-id-section">
      <span class="label">Pedido</span>
      <span class="order-id">#{{ order.id.slice(0, 8).toUpperCase() }}</span>
    </div>

    <div class="order-status-badge">
      <i :class="['pi', currentStatusIcon, 'status-icon']"></i>
      <span class="status-text">{{ currentStatusLabel }}</span>
    </div>

    <div class="order-meta">
      <div class="meta-item">
        <span class="meta-label">Creado</span>
        <span class="meta-value">{{ formattedDate }}</span>
      </div>
      <div v-if="order.eta" class="meta-item">
        <span class="meta-label">Tiempo estimado</span>
        <span class="meta-value eta">{{ order.eta }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.order-id-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.order-id {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: monospace;
}

.order-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.25rem;
}

.status-text {
  font-weight: 600;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.meta-value {
  font-weight: 500;
}

.meta-value.eta {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}
</style>
