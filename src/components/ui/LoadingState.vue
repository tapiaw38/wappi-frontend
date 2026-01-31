<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  message?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  message: 'Cargando...',
  fullscreen: false
})
</script>

<template>
  <div :class="['loading-state', { fullscreen }]">
    <div class="loading-content">
      <ProgressSpinner 
        strokeWidth="4" 
        class="loading-spinner"
      />
      <p class="loading-message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-state.fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
}

:deep(.loading-spinner circle) {
  stroke: var(--p-primary-500);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.loading-message {
  font-size: 0.9375rem;
  color: var(--p-surface-600);
  font-weight: 500;
  margin: 0;
}

/* Inline variant */
.loading-state.inline {
  padding: 1rem;
}

.loading-state.inline .loading-spinner {
  width: 24px;
  height: 24px;
}

.loading-state.inline .loading-message {
  font-size: 0.875rem;
}
</style>
