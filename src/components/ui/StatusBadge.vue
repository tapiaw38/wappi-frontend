<script setup lang="ts">
import Tag from 'primevue/tag'

interface Props {
  status: string
  size?: 'small' | 'normal' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal'
})

const statusConfig: Record<string, { severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast', icon: string, label: string }> = {
  CREATED: { severity: 'secondary', icon: 'pi pi-file', label: 'Creado' },
  CONFIRMED: { severity: 'info', icon: 'pi pi-check-circle', label: 'Confirmado' },
  PREPARING: { severity: 'warn', icon: 'pi pi-spinner pi-spin', label: 'En Preparación' },
  ON_THE_WAY: { severity: 'info', icon: 'pi pi-truck', label: 'En Camino' },
  DELIVERED: { severity: 'success', icon: 'pi pi-check', label: 'Entregado' },
  CANCELLED: { severity: 'danger', icon: 'pi pi-times', label: 'Cancelado' },
  PAUSED: { severity: 'warn', icon: 'pi pi-pause', label: 'Pausado' },
  MODIFICATION_REQUESTED: { severity: 'warn', icon: 'pi pi-pencil', label: 'Modificación' },
}

const config = statusConfig[props.status] || { severity: 'secondary', icon: 'pi pi-question', label: props.status }
</script>

<template>
  <Tag 
    :value="config.label" 
    :severity="config.severity" 
    :icon="config.icon"
    :class="['status-badge', `status-${status.toLowerCase().replace(/_/g, '-')}`, `size-${size}`]"
  />
</template>

<style scoped>
.status-badge {
  font-weight: 600;
  letter-spacing: 0.025em;
}

.status-badge.size-small {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
}

.status-badge.size-normal {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.status-badge.size-large {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

/* Custom colors for specific statuses */
:deep(.status-created) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

:deep(.status-confirmed) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

:deep(.status-preparing) {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

:deep(.status-on-the-way) {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  border: 1px solid #a5b4fc;
}

:deep(.status-delivered) {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #047857;
  border: 1px solid #6ee7b7;
}

:deep(.status-cancelled) {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

:deep(.status-paused) {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

:deep(.status-modification-requested) {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  color: #c2410c;
  border: 1px solid #fdba74;
}
</style>
