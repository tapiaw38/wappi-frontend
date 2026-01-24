<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { profileService } from '../api/profileService'
import { authService } from '../api/authService'
import type { Profile } from '../types/profile'
import MapboxPicker from '../components/MapboxPicker.vue'

const router = useRouter()

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const profile = ref<Profile | null>(null)
const profileId = ref<string | null>(null)
const isCompleted = ref(false)

// Country codes
const countries = [
  { code: 'AR', name: 'Argentina', dialCode: '+54 9', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
]

// Form data
const selectedCountry = ref(countries[0])
const phoneNumber = ref('')
const location = ref<{ lng: number; lat: number } | null>(null)
const address = ref('')

// Full phone number with country code
const fullPhoneNumber = computed(() => {
  if (!phoneNumber.value) return ''
  const cleanNumber = phoneNumber.value.replace(/\D/g, '')
  return `${selectedCountry.value.dialCode}${cleanNumber}`
})

// Parse existing phone number to extract country and number
const parsePhoneNumber = (fullPhone: string) => {
  for (const country of countries) {
    if (fullPhone.startsWith(country.dialCode)) {
      selectedCountry.value = country
      phoneNumber.value = fullPhone.replace(country.dialCode, '').trim()
      return
    }
  }
  phoneNumber.value = fullPhone
}

const loadProfile = async () => {
  try {
    // First check if profile is completed
    const checkResult = await profileService.checkCompleted()
    isCompleted.value = checkResult.is_completed
    profileId.value = checkResult.profile_id || null

    if (checkResult.profile_id) {
      // Load full profile
      profile.value = await profileService.getProfile(checkResult.profile_id)

      // Populate form with existing data
      if (profile.value.phone_number) {
        parsePhoneNumber(profile.value.phone_number)
      }

      if (profile.value.location) {
        location.value = {
          lng: profile.value.location.longitude,
          lat: profile.value.location.latitude
        }
        address.value = profile.value.location.address
      }
      error.value = null
    } else {
      // Profile doesn't exist yet - show message
      error.value = checkResult.message || 'Tu perfil aún no ha sido creado. Contacta al administrador para generar un enlace.'
      profile.value = null
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'No se pudo cargar el perfil'
  } finally {
    loading.value = false
  }
}

const handleAddressChange = (newAddress: string) => {
  address.value = newAddress
}

const handleSubmit = async () => {
  if (!location.value || !phoneNumber.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  submitting.value = true
  error.value = null

  try {
    // Use createOrUpdateProfile which works for both creating and updating
    // User ID is extracted from JWT token by the backend
    await profileService.createOrUpdateProfile({
      phone_number: fullPhoneNumber.value,
      longitude: location.value.lng,
      latitude: location.value.lat,
      address: address.value
    })
    success.value = true

    // Reload profile after 2 seconds
    setTimeout(() => {
      success.value = false
      loadProfile()
    }, 2000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'Error al guardar el perfil'
  } finally {
    submitting.value = false
  }
}

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin')
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-view">
    <header class="app-header">
      <h1 class="app-title">Mi Perfil</h1>
      <div class="header-actions">
        <button @click="goToAdmin" class="admin-button">Admin</button>
        <button @click="handleLogout" class="logout-button">Cerrar Sesion</button>
      </div>
    </header>

    <main class="main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando perfil...</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">✅</div>
        <h2>Perfil {{ profileId ? 'actualizado' : 'creado' }}</h2>
        <p>Tu informacion ha sido guardada correctamente.</p>
      </div>

      <!-- Profile Form (shown even when no profile exists, so user can create one) -->
      <div v-else class="form-container">
        <div v-if="profileId" class="profile-status" :class="{ 'status-complete': isCompleted, 'status-incomplete': !isCompleted }">
          <span v-if="isCompleted">✅ Perfil completo</span>
          <span v-else>⚠️ Perfil incompleto</span>
        </div>
        <div v-else class="profile-status status-new">
          <span>📝 Crea tu perfil</span>
        </div>

        <p class="form-intro">
          {{ profileId ? 'Actualiza tu informacion de entrega' : 'Completa tu informacion de entrega' }}
        </p>

        <form @submit.prevent="handleSubmit" class="profile-form">
          <!-- Phone Number with Country Selector -->
          <div class="form-group">
            <label for="phone">Numero de telefono</label>
            <div class="phone-input-container">
              <select v-model="selectedCountry" class="country-select">
                <option v-for="country in countries" :key="country.code" :value="country">
                  {{ country.flag }} {{ country.dialCode }}
                </option>
              </select>
              <input
                id="phone"
                v-model="phoneNumber"
                type="tel"
                placeholder="11 1234-5678"
                required
                class="form-input phone-input"
              />
            </div>
            <span class="phone-preview" v-if="phoneNumber">
              {{ fullPhoneNumber }}
            </span>
          </div>

          <!-- Location Map -->
          <div class="form-group">
            <label>Ubicacion de entrega</label>
            <MapboxPicker
              v-model="location"
              :access-token="MAPBOX_TOKEN"
              @address-change="handleAddressChange"
            />
          </div>

          <!-- Address (auto-filled from map) -->
          <div class="form-group">
            <label for="address">Direccion</label>
            <input
              id="address"
              v-model="address"
              type="text"
              placeholder="Se completara automaticamente al seleccionar en el mapa"
              class="form-input"
              readonly
            />
          </div>

          <!-- Coordinates display -->
          <div v-if="location" class="coordinates-display">
            <span>📍 {{ location.lat.toFixed(6) }}, {{ location.lng.toFixed(6) }}</span>
          </div>

          <!-- Error message -->
          <div v-if="error" class="form-error">
            {{ error }}
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            class="submit-button"
            :disabled="submitting || !location || !phoneNumber"
          >
            <span v-if="submitting">Guardando...</span>
            <span v-else>{{ profileId ? 'Guardar cambios' : 'Crear perfil' }}</span>
          </button>
        </form>
      </div>
    </main>

    <footer class="app-footer">
      <p>Powered by WhatsApp IA Assistant</p>
    </footer>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.app-header {
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.admin-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.admin-button:hover {
  background: #5a67d8;
}

.logout-button {
  background: none;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.logout-button:hover {
  background: #fef2f2;
}

.main-content {
  flex: 1;
  padding: 1rem;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h2,
.success-state h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.error-state p,
.success-state p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

.order-link-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  word-break: break-all;
}

.order-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;
  margin-right: 0.5rem;
}

.order-link:hover {
  text-decoration: underline;
}

.copy-link-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  vertical-align: middle;
}

.copy-link-btn:hover {
  background: #5a67d8;
}

.form-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-status {
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.status-complete {
  background: #d1fae5;
  color: #065f46;
}

.status-incomplete {
  background: #fef3c7;
  color: #92400e;
}

.status-new {
  background: #dbeafe;
  color: #1e40af;
}

.form-intro {
  text-align: center;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.phone-input-container {
  display: flex;
  gap: 0.5rem;
}

.country-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  min-width: 110px;
}

.country-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.phone-input {
  flex: 1;
}

.phone-preview {
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input[readonly] {
  background: #f9fafb;
  color: #6b7280;
}

.coordinates-display {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.form-error {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
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

.create-order-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.create-order-button {
  width: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.create-order-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.create-order-button:active:not(:disabled) {
  transform: translateY(0);
}

.create-order-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-footer {
  background: white;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.app-footer p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}
</style>
