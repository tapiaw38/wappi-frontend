import axios from 'axios'

const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:8008'

export const paymentClient = axios.create({
  baseURL: PAYMENT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

paymentClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Payment API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
