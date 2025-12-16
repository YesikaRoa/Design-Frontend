import { useState, useEffect } from 'react'
import useApi from './useApi'

/* ---------- Cache en RAM por usuario ---------- */
const memoryCacheByUser = {}

/* ---------- Helpers JWT ---------- */

const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload?.id ?? null
  } catch {
    return null
  }
}

/* ---------- SessionStorage ---------- */

const loadFromSession = (userId) => {
  try {
    const raw = sessionStorage.getItem(`dashboardData_user_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saveToSession = (userId, data) => {
  try {
    sessionStorage.setItem(`dashboardData_user_${userId}`, JSON.stringify(data))
  } catch {}
}

const isValidDashboard = (data) => {
  return (
    data &&
    typeof data === 'object' &&
    (data.attendedPatients !== undefined ||
      Array.isArray(data.recentPatients) ||
      Array.isArray(data.appointmentsByMonth))
  )
}

/* ---------- Hook ---------- */

export default function useDashboard() {
  const { request } = useApi()
  const userId = getUserIdFromToken()

  const [dashboard, setDashboard] = useState(() => {
    if (!userId) return null

    // 1️⃣ RAM
    const ram = memoryCacheByUser[userId]
    if (isValidDashboard(ram)) return ram

    // 2️⃣ SessionStorage
    const session = loadFromSession(userId)
    if (isValidDashboard(session)) {
      memoryCacheByUser[userId] = session
      return session
    }

    return null
  })

  const [loading, setLoading] = useState(!dashboard)

  useEffect(() => {
    if (!userId || dashboard) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchDashboard = async () => {
      setLoading(true)

      try {
        const token = localStorage.getItem('authToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const res = await request('get', '/dashboard', null, headers)

        if (!cancelled && res?.success && res.data) {
          memoryCacheByUser[userId] = res.data
          saveToSession(userId, res.data)
          setDashboard(res.data)
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [userId, request]) // ❗ NO dashboard aquí

  const refresh = async () => {
    if (!userId) return

    delete memoryCacheByUser[userId]
    sessionStorage.removeItem(`dashboardData_user_${userId}`)

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('get', '/dashboard', null, headers)

      if (res?.success && res.data) {
        memoryCacheByUser[userId] = res.data
        saveToSession(userId, res.data)
        setDashboard(res.data)
      }
    } catch (err) {
      console.error('Error refreshing dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  return { dashboard, loading, refresh }
}
