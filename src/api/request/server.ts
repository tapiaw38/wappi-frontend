import axios, { type AxiosInstance } from 'axios'

export const server = (config?: { baseURL?: string; timeout?: number }): AxiosInstance => {
  const instance = axios.create({
    baseURL: config?.baseURL || import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8082',
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
      console.error('Auth API Error:', error.response?.data || error.message)
      return Promise.reject(error)
    }
  )

  return instance
}
