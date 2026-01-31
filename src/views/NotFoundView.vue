<script setup lang="ts">
</script>

<template>
  <div class="not-found">
    <div class="content">
      <div class="icon"><i class="pi pi-search"></i></div>
      <h1>Página no encontrada</h1>
      <p>El enlace que seguiste no existe o ha expirado.</p>
      <p class="hint">Verifica el link que recibiste por WhatsApp</p>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.content {
  background: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

h1 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.875rem;
  color: #9ca3af;
}
</style>
