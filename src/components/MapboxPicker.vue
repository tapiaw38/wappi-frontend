<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = withDefaults(defineProps<{
  modelValue: { lng: number; lat: number } | null
  accessToken: string
  defaultCenter?: { lng: number; lat: number }
  defaultZoom?: number
  businessLocation?: { lng: number; lat: number } | null
}>(), {
  defaultCenter: () => ({ lng: -58.3816, lat: -34.6037 }), // Buenos Aires default
  defaultZoom: 13,
  businessLocation: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: { lng: number; lat: number }): void
  (e: 'address-change', address: string): void
}>()

interface MapClickEvent {
  lngLat: { lng: number; lat: number }
}

interface SimpleMap {
  addControl: (control: mapboxgl.IControl, position?: string) => void
  on: (event: string, callback: (e: MapClickEvent | GeolocationPosition) => void) => void
  flyTo: (options: { center: [number, number]; zoom: number }) => void
  remove: () => void
}

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<SimpleMap | null>(null)
// Using unknown to avoid deep type instantiation issues with mapbox-gl
const rawMap = ref<unknown>(null)
const marker = ref<unknown>(null)
const businessMarker = ref<unknown>(null)
const isLoading = ref(false)

const initMap = () => {
  if (!mapContainer.value) return

  mapboxgl.accessToken = props.accessToken

  const center: [number, number] = props.modelValue
    ? [props.modelValue.lng, props.modelValue.lat]
    : [props.defaultCenter.lng, props.defaultCenter.lat]

  const newMap = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: center,
    zoom: props.defaultZoom
  })
  map.value = newMap as unknown as SimpleMap
  rawMap.value = newMap

  // Add navigation controls
  newMap.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // Add geolocate control
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: false,
    showUserHeading: false
  })
  newMap.addControl(geolocate, 'top-right')

  // Initialize business location marker if provided
  if (props.businessLocation) {
    createBusinessMarker(props.businessLocation.lng, props.businessLocation.lat, newMap)
  }

  // Initialize marker if there's an initial value
  if (props.modelValue) {
    createMarker(props.modelValue.lng, props.modelValue.lat, newMap)
  }

  // Handle map click to place marker
  newMap.on('click', (e) => {
    const { lng, lat } = e.lngLat
    createMarker(lng, lat, newMap)
    emit('update:modelValue', { lng, lat })
    reverseGeocode(lng, lat)
  })

  // Handle geolocate result
  geolocate.on('geolocate', (e: GeolocationPosition) => {
    const { longitude, latitude } = e.coords
    createMarker(longitude, latitude, newMap)
    emit('update:modelValue', { lng: longitude, lat: latitude })
    reverseGeocode(longitude, latitude)
  })

  // Trigger geolocate on load if no initial value
  newMap.on('load', () => {
    if (!props.modelValue) {
      geolocate.trigger()
    }
  })
}

const createBusinessMarker = (lng: number, lat: number, targetMap?: unknown) => {
  const existingMarker = businessMarker.value
  if (existingMarker) {
    (existingMarker as mapboxgl.Marker).remove()
  }

  const mapToUse = targetMap || rawMap.value
  if (mapToUse) {
    const el = document.createElement('div')
    el.className = 'business-marker'
    el.innerHTML = '<i class="pi pi-building" style="color: #10b981; font-size: 24px;"></i>'
    
    const newMarker = new mapboxgl.Marker({ element: el, draggable: false })
      .setLngLat([lng, lat])
      .addTo(mapToUse as mapboxgl.Map)
    businessMarker.value = newMarker
  }
}

const createMarker = (lng: number, lat: number, targetMap?: unknown) => {
  const existingMarker = marker.value
  if (existingMarker) {
    (existingMarker as mapboxgl.Marker).remove()
  }

  const mapToUse = targetMap || rawMap.value
  if (mapToUse) {
    const newMarker = new mapboxgl.Marker({ color: '#667eea', draggable: true })
      .setLngLat([lng, lat])
      .addTo(mapToUse as mapboxgl.Map)
    marker.value = newMarker

    // Handle marker drag
    newMarker.on('dragend', () => {
      const lngLat = newMarker.getLngLat()
      emit('update:modelValue', { lng: lngLat.lng, lat: lngLat.lat })
      reverseGeocode(lngLat.lng, lngLat.lat)
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
  if (newVal && map.value && rawMap.value) {
    createMarker(newVal.lng, newVal.lat, rawMap.value as mapboxgl.Map)
    map.value.flyTo({ center: [newVal.lng, newVal.lat], zoom: 16 })
  }
})

// Watch for external changes to businessLocation
watch(() => props.businessLocation, (newVal) => {
  if (newVal && rawMap.value) {
    createBusinessMarker(newVal.lng, newVal.lat, rawMap.value as mapboxgl.Map)
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (marker.value) {
    (marker.value as mapboxgl.Marker).remove()
  }
  if (businessMarker.value) {
    (businessMarker.value as mapboxgl.Marker).remove()
  }
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

.business-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
</style>
