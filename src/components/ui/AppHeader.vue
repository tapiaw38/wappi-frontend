<script setup lang="ts">
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title?: string
  showBack?: boolean
  showLogo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: false,
  showLogo: true
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()
const menu = ref<InstanceType<typeof Menu>>()

const items = ref([
  {
    label: 'Mi Perfil',
    icon: 'pi pi-user',
    command: () => router.push('/profile')
  },
  {
    label: 'Mis Pedidos',
    icon: 'pi pi-box',
    command: () => router.push('/my-orders')
  },
  {
    separator: true
  },
  {
    label: 'Cerrar Sesión',
    icon: 'pi pi-sign-out',
    command: () => {
      // Emitir evento para logout o manejar aquí
      router.push('/login')
    }
  }
])

const toggleMenu = (event: Event) => {
  menu.value?.toggle(event)
}

const goBack = () => {
  if (props.showBack) {
    emit('back')
  } else {
    router.back()
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <Button
        v-if="showBack"
        icon="pi pi-arrow-left"
        text
        rounded
        class="back-button"
        @click="goBack"
      />
      <div v-if="showLogo" class="logo-container" @click="router.push('/profile')">
        <slot name="logo">
          <div class="default-logo">
            <i class="pi pi-box"></i>
            <span class="logo-text">Wappi</span>
          </div>
        </slot>
      </div>
      <h1 v-if="title" class="page-title">{{ title }}</h1>
    </div>
    
    <div class="header-right">
      <slot name="actions" />
      <Button
        icon="pi pi-user"
        text
        rounded
        class="user-menu-button"
        @click="toggleMenu"
      />
      <Menu ref="menu" :model="items" popup class="user-menu" />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-button {
  color: var(--p-surface-600);
  transition: all 0.2s ease;
}

.back-button:hover {
  color: var(--p-primary-600);
  background: var(--p-primary-50);
}

.logo-container {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.logo-container:hover {
  transform: scale(1.02);
}

.default-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.default-logo i {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--p-surface-800);
  margin: 0;
  padding-left: 0.75rem;
  border-left: 2px solid var(--p-surface-200);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-menu-button {
  color: var(--p-surface-600);
  transition: all 0.2s ease;
}

.user-menu-button:hover {
  color: var(--p-primary-600);
  background: var(--p-primary-50);
}

:deep(.user-menu) {
  min-width: 200px;
}

:deep(.user-menu .p-menuitem-link) {
  padding: 0.75rem 1rem;
}

@media (max-width: 640px) {
  .app-header {
    padding: 0.625rem 1rem;
  }
  
  .page-title {
    font-size: 1rem;
  }
  
  .default-logo {
    font-size: 1.1rem;
  }
}
</style>
