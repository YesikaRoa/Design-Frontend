import { useState, useCallback } from 'react'
import axios from 'axios'
//url local: http://localhost:3000/api
//url producción:https://aplication-backend-production-628d.up.railway.app/api

let activeRequests = 0

const useApi = (baseURL = 'https://aplication-backend-production-628d.up.railway.app/api') => {
  const [loading, setLoading] = useState(false)

  // 2. Envuelve la función en useCallback
  const request = useCallback(
    async (method, url, body = null, headers = {}) => {
      setLoading(true)
      activeRequests++
      document.body.classList.add('loading-global')

      try {
        const { responseType, ...httpHeaders } = headers
        const res = await axios({
          method,
          url: `${baseURL}${url}`,
          data: body,
          headers: httpHeaders,
          responseType: responseType || 'json',
        })

        const payload = res.data && res.data.data ? res.data.data : res.data
        return { success: true, message: res.data.message || 'Operación exitosa', data: payload }
      } catch (error) {
        console.error('API request error:', error.response || error)
        return {
          success: false,
          message: error.response?.data?.message || 'Error en la operación',
          error: error.response?.data || null,
        }
      } finally {
        setLoading(false)
        activeRequests = Math.max(0, activeRequests - 1)
        if (activeRequests === 0) {
          document.body.classList.remove('loading-global')
        }
      }
    },
    [baseURL],
  ) // 3. baseURL es la única dependencia lógica aquí

  return { request, loading }
}

export default useApi
