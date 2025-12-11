import { useState, useEffect } from 'react'
import useApi from './useApi'

/* ---------- Cache en RAM por rol ---------- */
const memoryCache = {}

/* ---------- Helpers ---------- */

const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || null
  } catch {
    return null
  }
}

const loadFromSession = (role) => {
  try {
    const s = sessionStorage.getItem(`dashboardData_role_${role}`)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

const saveToSession = (role, data) => {
  try {
    sessionStorage.setItem(`dashboardData_role_${role}`, JSON.stringify(data))
  } catch {}
}

const isValidDashboard = (d) => {
  if (!d || typeof d !== 'object') return false
  if (d.attendedPatients !== undefined) return true
  if (d.appointmentsByMonth !== undefined) return true
  if (Array.isArray(d.recentPatients)) return true
  if (Array.isArray(d.patientsByCity)) return true
  return false
}

export default function useDashboard() {
  const { request } = useApi()
  const role = getRoleFromToken()

  const [dashboard, setDashboard] = useState(() => {
    if (!role) return null

    // 1) RAM cache (instantáneo)
    if (memoryCache[role] && isValidDashboard(memoryCache[role])) {
      return memoryCache[role]
    }

    // 2) sessionStorage
    const s = loadFromSession(role)
    if (s && isValidDashboard(s)) {
      memoryCache[role] = s
      return s
    }

    return null
  })

  const [loading, setLoading] = useState(() => (dashboard ? false : true))

  useEffect(() => {
    let mounted = true

    const fetchData = async (force = false) => {
      const token = localStorage.getItem('authToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      if (!force) {
        if (memoryCache[role] && isValidDashboard(memoryCache[role])) {
          setDashboard(memoryCache[role])
          setLoading(false)
          return
        }
      }

      setLoading(true)

      try {
        const res = await request('get', '/dashboard', null, headers)
        if (res?.success && res.data && mounted) {
          memoryCache[role] = res.data
          saveToSession(role, res.data)
          setDashboard(res.data)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (role) {
      fetchData(false)
    }

    return () => {
      mounted = false
    }
  }, [request, role])

  const refresh = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('get', '/dashboard', null, headers)
      if (res?.success && res.data) {
        memoryCache[role] = res.data
        saveToSession(role, res.data)
        setDashboard(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { dashboard, loading, refresh }
}
