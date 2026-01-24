<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../api/authService'
import GoogleButton from '../components/GoogleButton.vue'
import type { User } from '../types/auth'
import wappiLogo from '../assets/img/wappi-logo.png'

const router = useRouter()
const route = useRoute()

// Get redirect URL from query params
const redirectUrl = computed(() => {
  return (route.query.redirect as string) || '/profile'
})

type ViewMode = 'login' | 'register'
const currentView = ref<ViewMode>('login')

// Form state
const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const confirmPassword = ref('')

// UI state
const loading = ref(false)
const error = ref<string | null>(null)
const user = ref<User | null>(null)

// Validation
const emailError = computed(() => {
  if (!email.value) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value) ? '' : 'Email invalido'
})

const passwordError = computed(() => {
  if (!password.value) return ''
  return password.value.length >= 6 ? '' : 'La contrasena debe tener al menos 6 caracteres'
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  return confirmPassword.value === password.value ? '' : 'Las contrasenas no coinciden'
})

const isLoginValid = computed(() => {
  return email.value && password.value && !emailError.value && !passwordError.value
})

const isRegisterValid = computed(() => {
  return (
    firstName.value &&
    lastName.value &&
    email.value &&
    password.value &&
    confirmPassword.value &&
    !emailError.value &&
    !passwordError.value &&
    !confirmPasswordError.value
  )
})

const toggleView = () => {
  currentView.value = currentView.value === 'login' ? 'register' : 'login'
  error.value = null
  // Reset form
  email.value = ''
  password.value = ''
  firstName.value = ''
  lastName.value = ''
  confirmPassword.value = ''
}

const handleLogin = async () => {
  if (!isLoginValid.value) return

  loading.value = true
  error.value = null

  try {
    const response = await authService.login({
      email: email.value,
      password: password.value
    })

    authService.setToken(response.token)
    user.value = response.data

    // Redirect to intended destination or profile
    await router.push(redirectUrl.value)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'Error al iniciar sesion. Verifica tus credenciales.'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!isRegisterValid.value) return

  loading.value = true
  error.value = null

  try {
    await authService.register({
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value
    })

    // After registration, switch to login
    currentView.value = 'login'
    error.value = null
    password.value = ''
    confirmPassword.value = ''
    firstName.value = ''
    lastName.value = ''
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'Error al registrarse. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async (code: string) => {
  loading.value = true
  error.value = null

  try {
    const response = await authService.login({
      ssoType: 'google',
      ssoCode: code
    })

    authService.setToken(response.token)
    user.value = response.data

    // Redirect to intended destination or profile
    await router.push(redirectUrl.value)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'Error al iniciar sesion con Google.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-background">
      <div class="login-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <div class="login-content">
      <div class="login-header">
        <div class="logo-container">
          <img :src="wappiLogo" alt="Wappi" class="logo-img" />
        </div>
        <p class="login-subtitle">
          {{ currentView === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta' }}
        </p>
      </div>

      <div class="login-card">
        <div class="form-header">
          <div class="form-icon">
            <span v-if="currentView === 'login'">&#x1F511;</span>
            <span v-else>&#x1F464;</span>
          </div>
          <h2 class="form-title">
            {{ currentView === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta' }}
          </h2>
        </div>

        <!-- Login Form -->
        <form v-if="currentView === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="form-input"
              :class="{ 'input-error': emailError }"
              required
            />
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Tu contrasena"
              class="form-input"
              :class="{ 'input-error': passwordError }"
              required
            />
            <small v-if="passwordError" class="error-text">{{ passwordError }}</small>
          </div>

          <div v-if="error" class="form-error">
            {{ error }}
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="loading || !isLoginValid"
          >
            <span v-if="loading">Iniciando sesion...</span>
            <span v-else>Iniciar Sesion</span>
          </button>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="firstName">Nombre</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="Tu nombre"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="lastName">Apellido</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Tu apellido"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input
              id="registerEmail"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              class="form-input"
              :class="{ 'input-error': emailError }"
              required
            />
            <small v-if="emailError" class="error-text">{{ emailError }}</small>
          </div>

          <div class="form-group">
            <label for="registerPassword">Contrasena</label>
            <input
              id="registerPassword"
              v-model="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              class="form-input"
              :class="{ 'input-error': passwordError }"
              required
            />
            <small v-if="passwordError" class="error-text">{{ passwordError }}</small>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contrasena</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Repite tu contrasena"
              class="form-input"
              :class="{ 'input-error': confirmPasswordError }"
              required
            />
            <small v-if="confirmPasswordError" class="error-text">{{ confirmPasswordError }}</small>
          </div>

          <div v-if="error" class="form-error">
            {{ error }}
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="loading || !isRegisterValid"
          >
            <span v-if="loading">Registrando...</span>
            <span v-else>Crear Cuenta</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span class="divider-text">o continua con</span>
        </div>

        <!-- Google Button -->
        <div class="social-login">
          <GoogleButton @code="handleGoogleLogin" />
        </div>

        <div class="form-footer">
          <p class="toggle-text">
            {{ currentView === 'login' ? 'No tienes una cuenta?' : 'Ya tienes una cuenta?' }}
            <button type="button" class="toggle-button" @click="toggleView">
              {{ currentView === 'login' ? 'Crear cuenta' : 'Iniciar sesion' }}
            </button>
          </p>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">
            {{ currentView === 'login' ? 'Iniciando sesion...' : 'Registrando...' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Animated Background */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.login-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
  border-radius: 50%;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* Main Content */
.login-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 2rem;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.logo-img {
  height: 80px;
  width: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.login-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* Card */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.5s ease-out;
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

/* Form Header */
.form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.form-icon span {
  font-size: 1.25rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
}

.form-error {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Footer */
.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.toggle-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.toggle-button {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
}

.toggle-button:hover {
  text-decoration: underline;
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider-text {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  position: relative;
  z-index: 1;
}

/* Social Login */
.social-login {
  margin-bottom: 1rem;
}

/* Loading Overlay */
.loading-overlay {
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
  backdrop-filter: blur(4px);
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #374151;
  font-weight: 500;
  margin: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .login-content {
    padding: 1rem;
  }

  .login-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .logo-text {
    font-size: 1.5rem;
  }
}
</style>
