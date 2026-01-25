<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '../types/order'
import { StatusLabels, StatusIcons } from '../types/order'

const props = defineProps<{
  order: Order
  allCompleted?: boolean
}>()

const timelineStatuses = computed(() => {
  // Filter out CANCELLED, PAUSED and MODIFICATION_REQUESTED for the normal timeline
  // They will be shown separately if the order is in those states
  const normalStatuses = props.order.all_statuses.filter(s => s !== 'CANCELLED' && s !== 'PAUSED' && s !== 'MODIFICATION_REQUESTED')

  return normalStatuses.map((status, index) => {
    // If allCompleted is true, mark everything as completed
    const isCurrent = props.allCompleted ? false : status === props.order.status
    const isCompleted = props.allCompleted ? true : index < props.order.status_index
    const isPending = props.allCompleted ? false : index > props.order.status_index

    return {
      status,
      label: StatusLabels[status] || status,
      icon: StatusIcons[status] || '⚪',
      isCurrent,
      isCompleted,
      isPending
    }
  })
})

const isCancelled = computed(() => props.order.status === 'CANCELLED')
const isPaused = computed(() => props.order.status === 'PAUSED')
const isModificationRequested = computed(() => props.order.status === 'MODIFICATION_REQUESTED')
</script>

<template>
  <div class="timeline-container">
    <!-- Cancelled State -->
    <div v-if="isCancelled" class="cancelled-banner">
      <span class="cancelled-icon">❌</span>
      <span class="cancelled-text">Pedido Cancelado</span>
    </div>

    <!-- Paused State -->
    <div v-else-if="isPaused" class="paused-banner">
      <span class="paused-icon">⏸️</span>
      <span class="paused-text">Pedido Pausado</span>
    </div>

    <!-- Modification Requested State -->
    <div v-else-if="isModificationRequested" class="modification-banner">
      <span class="modification-icon">✏️</span>
      <span class="modification-text">Modificación Solicitada</span>
    </div>

    <!-- Normal Timeline (including Delivered state with all green) -->
    <div v-else class="timeline">
      <div
        v-for="(item, index) in timelineStatuses"
        :key="item.status"
        class="timeline-item"
        :class="{
          'is-completed': item.isCompleted,
          'is-current': item.isCurrent,
          'is-pending': item.isPending
        }"
      >
        <div class="timeline-marker">
          <div class="marker-circle">
            <span v-if="item.isCompleted" class="check-icon">✓</span>
            <span v-else class="status-icon">{{ item.icon }}</span>
          </div>
          <div v-if="index < timelineStatuses.length - 1" class="marker-line"></div>
        </div>
        <div class="timeline-content">
          <span class="status-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 1rem;
}

.cancelled-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 12px;
  border: 2px solid #ef4444;
}

.cancelled-icon {
  font-size: 2rem;
}

.cancelled-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #dc2626;
}

.paused-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  border: 2px solid #f59e0b;
}

.paused-icon {
  font-size: 2rem;
}

.paused-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #d97706;
}

.modification-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  border-radius: 12px;
  border: 2px solid #f97316;
}

.modification-icon {
  font-size: 2rem;
}

.modification-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ea580c;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.marker-line {
  width: 3px;
  height: 40px;
  transition: background-color 0.3s ease;
}

/* Completed state */
.is-completed .marker-circle {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.is-completed .marker-line {
  background: linear-gradient(180deg, #10b981 0%, #10b981 100%);
}

.is-completed .check-icon {
  font-weight: bold;
}

/* Current state */
.is-current .marker-circle {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
  animation: pulse 2s infinite;
}

.is-current .marker-line {
  background: linear-gradient(180deg, #f59e0b 0%, #e5e7eb 100%);
}

/* Pending state */
.is-pending .marker-circle {
  background: #f3f4f6;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.is-pending .marker-line {
  background: #e5e7eb;
}

.timeline-content {
  padding-top: 0.75rem;
  padding-bottom: 1.5rem;
}

.status-label {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.is-completed .status-label {
  color: #10b981;
}

.is-current .status-label {
  color: #f59e0b;
  font-weight: 600;
}

.is-pending .status-label {
  color: #9ca3af;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Last item - no line */
.timeline-item:last-child .marker-line {
  display: none;
}
</style>
