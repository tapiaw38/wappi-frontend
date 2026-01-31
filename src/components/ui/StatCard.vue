<script setup lang="ts">
import Card from 'primevue/card'

interface Props {
  title: string
  value: string | number
  icon: string
  trend?: number
  trendLabel?: string
  color?: 'primary' | 'success' | 'info' | 'warn' | 'danger'
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  trend: 0,
  trendLabel: ''
})

const colorClasses: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  warn: 'bg-warn',
  danger: 'bg-danger'
}
</script>

<template>
  <Card class="stat-card">
    <template #content>
      <div class="stat-content">
        <div :class="['stat-icon', colorClasses[color]]">
          <i :class="icon"></i>
        </div>
        <div class="stat-info">
          <span class="stat-title">{{ title }}</span>
          <span class="stat-value">{{ value }}</span>
          <div v-if="trend !== 0" class="stat-trend">
            <i :class="trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
            <span :class="trend > 0 ? 'trend-up' : 'trend-down'">
              {{ Math.abs(trend) }}% {{ trendLabel }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.25rem;
  color: white;
}

.stat-icon.bg-primary {
  background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600));
}

.stat-icon.bg-success {
  background: linear-gradient(135deg, var(--p-success-500), var(--p-success-600));
}

.stat-icon.bg-info {
  background: linear-gradient(135deg, var(--p-info-500), var(--p-info-600));
}

.stat-icon.bg-warn {
  background: linear-gradient(135deg, var(--p-warn-500), var(--p-warn-600));
}

.stat-icon.bg-danger {
  background: linear-gradient(135deg, var(--p-danger-500), var(--p-danger-600));
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-title {
  font-size: 0.875rem;
  color: var(--p-surface-500);
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-surface-800);
  line-height: 1.2;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-trend i {
  font-size: 0.625rem;
}

.trend-up {
  color: var(--p-success-600);
}

.trend-down {
  color: var(--p-danger-600);
}
</style>
