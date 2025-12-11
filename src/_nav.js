import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilClipboard,
  cilEducation,
  cilUser,
  cilNotes,
} from '@coreui/icons'
import { CNavItem } from '@coreui/react'

// Obtiene role dinámicamente
function getRoleFromToken() {
  const token = localStorage.getItem('authToken')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role
  } catch {
    return null
  }
}

export default function getNavConfig() {
  const role = getRoleFromToken()

  return [
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    ...(role === 1
      ? [
          {
            component: CNavItem,
            name: 'Users',
            to: '/users',
            icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
          },
          {
            component: CNavItem,
            name: 'Professionals',
            to: '/professionals',
            icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
          },
        ]
      : []),
    {
      component: CNavItem,
      name: 'Patients',
      to: '/patients',
      icon: <CIcon icon={cilUser} className="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Appointments',
      to: '/appointments',
      icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Medical History',
      to: '/medicalHistory',
      icon: <CIcon icon={cilNotes} className="nav-icon" />,
    },
  ]
}
