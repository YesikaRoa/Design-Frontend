import { useState } from 'react'
import axios from 'axios'
//url local: http://localhost:3000/api
//url producción: https://aplication-backend-production-7932.up.railway.app/api
const useApi = (baseURL = 'https://aplication-backend-production-7932.up.railway.app/api') => {
  const [loading, setLoading] = useState(false)

  const request = async (method, url, body = null, headers = {}) => {
    setLoading(true)
    try {
      const res = await axios({ method, url: `${baseURL}${url}`, data: body, headers })

      // Si el backend envía la entidad en res.data.data mantenemos compatibilidad,
      // en caso contrario devolvemos res.data directamente.
      const payload = res.data && res.data.data ? res.data.data : res.data
      return { success: true, message: res.data.message || 'Operación exitosa', data: payload }
    } catch (error) {
      // Loguear el error para facilitar debugging en cliente
      console.error('API request error:', error.response || error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error en la operación',
        // Incluimos el body de la respuesta del servidor para que el cliente
        // pueda mostrar detalles de validación (issues, fields, etc.)
        error: error.response?.data || null,
      }
    } finally {
      setLoading(false)
    }
  }

  return { request, loading }
}

export default useApi
