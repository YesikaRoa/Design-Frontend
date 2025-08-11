import { useState } from 'react'
import axios from 'axios'

const useApi = (baseURL = 'http://localhost:3000/api') => {
  const [loading, setLoading] = useState(false)

  const request = async (method, url, body = null) => {
    setLoading(true)
    try {
      const res = await axios({ method, url: `${baseURL}${url}`, data: body })
      return { success: true, message: res.data.message || 'Operación exitosa', data: res.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error en la operación' }
    } finally {
      setLoading(false)
    }
  }

  return { request, loading }
}

export default useApi
