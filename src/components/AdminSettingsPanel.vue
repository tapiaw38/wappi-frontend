<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsService } from '../api/settingsService'
import type { Settings } from '../types/settings'

const loading = ref(true)
const saving = ref(false)
const settings = ref<Settings | null>(null)
const error = ref('')
const successMessage = ref('')

// Form fields
const form = ref({
  business_name: '',
  business_latitude: 0,
  business_longitude: 0,
  default_map_latitude: 0,
  default_map_longitude: 0,
  default_map_zoom: 13,
  default_item_weight: 500,
  delivery_base_price: 500,
  delivery_price_per_km: 200,
  delivery_price_per_kg: 100
})

const fetchSettings = async () => {
  loading.value = true
  error.value = ''
  try {
    settings.value = await settingsService.getSettings()
    // Populate form
    form.value = {
      business_name: settings.value.business_name || '',
      business_latitude: settings.value.business_latitude,
      business_longitude: settings.value.business_longitude,
      default_map_latitude: settings.value.default_map_latitude,
      default_map_longitude: settings.value.default_map_longitude,
      default_map_zoom: settings.value.default_map_zoom,
      default_item_weight: settings.value.default_item_weight,
      delivery_base_price: settings.value.delivery_base_price,
      delivery_price_per_km: settings.value.delivery_price_per_km,
      delivery_price_per_kg: settings.value.delivery_price_per_kg
    }
  } catch (err) {
    console.error('Error fetching settings:', err)
    error.value = 'Error al cargar la configuración'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    settings.value = await settingsService.updateSettings(form.value)
    successMessage.value = 'Configuración guardada correctamente'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Error saving settings:', err)
    error.value = 'Error al guardar la configuración'
  } finally {
    saving.value = false
  }
}

const useCurrentLocation = async (field: 'business' | 'default_map') => {
  if (!navigator.geolocation) {
    error.value = 'Geolocalización no soportada'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (field === 'business') {
        form.value.business_latitude = position.coords.latitude
        form.value.business_longitude = position.coords.longitude
      } else {
        form.value.default_map_latitude = position.coords.latitude
        form.value.default_map_longitude = position.coords.longitude
      }
    },
    (err) => {
      console.error('Error getting location:', err)
      error.value = 'Error al obtener ubicación'
    }
  )
}

const copyBusinessToDefault = () => {
  form.value.default_map_latitude = form.value.business_latitude
  form.value.default_map_longitude = form.value.business_longitude
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="settings-panel">
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando configuración...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error && !settings" class="error-message">
      {{ error }}
      <button @click="fetchSettings">Reintentar</button>
    </div>

    <!-- Settings Form -->
    <form v-else @submit.prevent="saveSettings" class="settings-form">
      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-alert">
        {{ error }}
      </div>

      <!-- Business Info Section -->
      <section class="form-section">
        <h3>Información del Negocio</h3>

        <div class="form-group">
          <label for="business_name">Nombre del Negocio</label>
          <input
            id="business_name"
            v-model="form.business_name"
            type="text"
            placeholder="Mi Restaurante"
            class="form-input"
          />
        </div>
      </section>

      <!-- Business Location Section -->
      <section class="form-section">
        <h3>Ubicación del Negocio</h3>
        <p class="section-description">Esta es la ubicación desde donde se calculará la distancia de envío.</p>

        <div class="form-row">
          <div class="form-group">
            <label for="business_latitude">Latitud</label>
            <input
              id="business_latitude"
              v-model.number="form.business_latitude"
              type="number"
              step="0.000001"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="business_longitude">Longitud</label>
            <input
              id="business_longitude"
              v-model.number="form.business_longitude"
              type="number"
              step="0.000001"
              class="form-input"
            />
          </div>
        </div>

        <button type="button" class="btn-secondary" @click="useCurrentLocation('business')">
          📍 Usar mi ubicación actual
        </button>
      </section>

      <!-- Default Map Section -->
      <section class="form-section">
        <h3>Mapa por Defecto (para usuarios)</h3>
        <p class="section-description">Punto inicial que verán los usuarios al agregar su dirección.</p>

        <div class="form-row">
          <div class="form-group">
            <label for="default_map_latitude">Latitud</label>
            <input
              id="default_map_latitude"
              v-model.number="form.default_map_latitude"
              type="number"
              step="0.000001"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="default_map_longitude">Longitud</label>
            <input
              id="default_map_longitude"
              v-model.number="form.default_map_longitude"
              type="number"
              step="0.000001"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="default_map_zoom">Zoom</label>
            <input
              id="default_map_zoom"
              v-model.number="form.default_map_zoom"
              type="number"
              min="1"
              max="20"
              class="form-input"
            />
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn-secondary" @click="useCurrentLocation('default_map')">
            📍 Usar mi ubicación actual
          </button>
          <button type="button" class="btn-secondary" @click="copyBusinessToDefault">
            📋 Copiar ubicación del negocio
          </button>
        </div>
      </section>

      <!-- Weight Settings Section -->
      <section class="form-section">
        <h3>Peso de Productos</h3>

        <div class="form-group">
          <label for="default_item_weight">Peso por defecto (gramos)</label>
          <input
            id="default_item_weight"
            v-model.number="form.default_item_weight"
            type="number"
            min="0"
            class="form-input"
          />
          <span class="input-hint">Se usa cuando un producto no tiene peso especificado</span>
        </div>
      </section>

      <!-- Delivery Pricing Section -->
      <section class="form-section">
        <h3>Tarifas de Envío</h3>
        <p class="section-description">
          Fórmula: <strong>Precio Base + (Distancia × Precio/km) + (Peso × Precio/kg)</strong>
        </p>

        <div class="form-row pricing-row">
          <div class="form-group">
            <label for="delivery_base_price">Precio Base</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                id="delivery_base_price"
                v-model.number="form.delivery_base_price"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="delivery_price_per_km">Precio por Km</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                id="delivery_price_per_km"
                v-model.number="form.delivery_price_per_km"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="delivery_price_per_kg">Precio por Kg</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                id="delivery_price_per_kg"
                v-model.number="form.delivery_price_per_kg"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Example calculation -->
        <div class="example-box">
          <h4>Ejemplo de cálculo</h4>
          <p>
            Para un pedido de <strong>2 kg</strong> a <strong>5 km</strong> de distancia:
          </p>
          <ul>
            <li>Precio base: {{ formatPrice(form.delivery_base_price) }}</li>
            <li>Distancia (5 km × {{ formatPrice(form.delivery_price_per_km) }}): {{ formatPrice(5 * form.delivery_price_per_km) }}</li>
            <li>Peso (2 kg × {{ formatPrice(form.delivery_price_per_kg) }}): {{ formatPrice(2 * form.delivery_price_per_kg) }}</li>
            <li><strong>Total: {{ formatPrice(form.delivery_base_price + (5 * form.delivery_price_per_km) + (2 * form.delivery_price_per_kg)) }}</strong></li>
          </ul>
        </div>
      </section>

      <!-- Submit Button -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings-panel {
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #dc2626;
}

.error-message button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 500;
}

.error-alert {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.section-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.pricing-row {
  grid-template-columns: repeat(3, 1fr);
}

.input-with-prefix {
  display: flex;
  align-items: stretch;
}

.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: #6b7280;
  font-weight: 500;
}

.input-with-prefix .form-input {
  border-radius: 0 8px 8px 0;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.example-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.example-box h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #475569;
}

.example-box p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.example-box ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: #64748b;
}

.example-box li {
  margin-bottom: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .pricing-row {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .btn-secondary {
    width: 100%;
  }
}
</style>
