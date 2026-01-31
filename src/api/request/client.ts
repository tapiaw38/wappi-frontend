import axios, { type AxiosInstance } from 'axios'

export const client = (config?: { baseURL?: string; timeout?: number }): AxiosInstance => {
  const instance = axios.create({
    baseURL: config?.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:8080',
    timeout: config?.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      console.error('API Error:', error.response?.data || error.message)
      return Promise.reject(error)
    }
  )

  return instance
}
