<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <i :class="icon || 'pi pi-inbox'"></i>
    </div>
    <h3 class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <Button
      v-if="actionLabel"
      :label="actionLabel"
      :icon="actionIcon"
      class="mt-4"
      severity="primary"
      @click="emit('action')"
    />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 300px;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--p-surface-100) 0%, var(--p-surface-200) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-state-icon i {
  font-size: 2rem;
  color: var(--p-surface-400);
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--p-surface-700);
  margin: 0 0 0.5rem;
}

.empty-state-description {
  font-size: 0.9375rem;
  color: var(--p-surface-500);
  margin: 0;
  max-width: 300px;
  line-height: 1.5;
}

/* Variants */
.empty-state.compact {
  padding: 2rem 1rem;
  min-height: auto;
}

.empty-state.compact .empty-state-icon {
  width: 56px;
  height: 56px;
}

.empty-state.compact .empty-state-icon i {
  font-size: 1.5rem;
}

.empty-state.compact .empty-state-title {
  font-size: 1rem;
}
</style>
