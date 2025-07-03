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

// Función para obtener el role desde el localStorage
function getRoleFromToken() {
  const token = localStorage.getItem('authToken')
  if (!token) return null
  try {
    // Si el token es JWT, decodifica el payload
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role
  } catch {
    // Si el token es un JSON plano
    try {
      return JSON.parse(token).role
    } catch {
      return null
    }
  }
}

const role = getRoleFromToken()

const _nav = [
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

export default _nav
