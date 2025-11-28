import { useMemo } from 'react'

const useRole = () => {
  const token = localStorage.getItem('authToken')

  const role = useMemo(() => {
    if (!token) return null

    try {
      // Decodificar JWT
      const payload = JSON.parse(atob(token.split('.')[1]))

      return payload.role || null
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }, [token])

  return role
}

export default useRole
