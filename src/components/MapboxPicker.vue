<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps<{
  modelValue: { lng: number; lat: number } | null
  accessToken: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { lng: number; lat: number }): void
  (e: 'address-change', address: string): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<mapboxgl.Map | null>(null)
const marker = ref<mapboxgl.Marker | null>(null)
const isLoading = ref(false)

// Default center (can be changed based on user's location)
const defaultCenter: [number, number] = [-58.3816, -34.6037] // Buenos Aires

const initMap = () => {
  if (!mapContainer.value) return

  mapboxgl.accessToken = props.accessToken

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: props.modelValue
      ? [props.modelValue.lng, props.modelValue.lat]
      : defaultCenter,
    zoom: 14
  })

  // Add navigation controls
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // Add geolocate control
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: false,
    showUserHeading: false
  })
  map.value.addControl(geolocate, 'top-right')

  // Initialize marker if there's an initial value
  if (props.modelValue) {
    createMarker(props.modelValue.lng, props.modelValue.lat)
  }

  // Handle map click to place marker
  map.value.on('click', (e) => {
    const { lng, lat } = e.lngLat
    createMarker(lng, lat)
    emit('update:modelValue', { lng, lat })
    reverseGeocode(lng, lat)
  })

  // Handle geolocate result
  geolocate.on('geolocate', (e: GeolocationPosition) => {
    const { longitude, latitude } = e.coords
    createMarker(longitude, latitude)
    emit('update:modelValue', { lng: longitude, lat: latitude })
    reverseGeocode(longitude, latitude)
  })

  // Trigger geolocate on load if no initial value
  map.value.on('load', () => {
    if (!props.modelValue) {
      geolocate.trigger()
    }
  })
}

const createMarker = (lng: number, lat: number) => {
  if (marker.value) {
    marker.value.remove()
  }

  if (map.value) {
    marker.value = new mapboxgl.Marker({ color: '#667eea', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.value)

    // Handle marker drag
    marker.value.on('dragend', () => {
      const lngLat = marker.value?.getLngLat()
      if (lngLat) {
        emit('update:modelValue', { lng: lngLat.lng, lat: lngLat.lat })
        reverseGeocode(lngLat.lng, lngLat.lat)
      }
    })
  }
}

const reverseGeocode = async (lng: number, lat: number) => {
  isLoading.value = true
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${props.accessToken}&language=es`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const address = data.features[0].place_name
      emit('address-change', address)
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal && map.value) {
    createMarker(newVal.lng, newVal.lat)
    map.value.flyTo({ center: [newVal.lng, newVal.lat], zoom: 16 })
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<template>
  <div class="mapbox-picker">
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="isLoading" class="loading-overlay">
      <span>Obteniendo dirección...</span>
    </div>
    <p class="map-hint">
      Haz clic en el mapa o arrastra el marcador para seleccionar tu ubicación
    </p>
  </div>
</template>

<style scoped>
.mapbox-picker {
  position: relative;
  width: 100%;
}

.map-container {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-hint {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  margin-top: 0.5rem;
}
</style>
