import { useState, useCallback } from 'react'
import axios from 'axios'
//url local: http://localhost:3000/api
//url producción: aplication-backend-production-fb88.up.railway.app/api
const useApi = (baseURL = 'https://aplication-backend-production-fb88.up.railway.app/api') => {
  const [loading, setLoading] = useState(false)

  // 2. Envuelve la función en useCallback
  const request = useCallback(
    async (method, url, body = null, headers = {}) => {
      setLoading(true)
      try {
        const res = await axios({
          method,
          url: `${baseURL}${url}`,
          data: body,
          headers,
          responseType: headers.responseType || 'json',
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
      }
    },
    [baseURL],
  ) // 3. baseURL es la única dependencia lógica aquí

  return { request, loading }
}

export default useApi
