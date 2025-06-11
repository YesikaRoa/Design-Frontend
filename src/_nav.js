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
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Usuarios',
    to: '/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Profesionales',
    to: '/professionals',
    icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Pacientes',
    to: '/patients',
    icon: <CIcon icon={cilUser} className="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Citas',
    to: '/appointments',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Historial Médico',
    to: '/medicalHistory',
    icon: <CIcon icon={cilNotes} className="nav-icon" />,
  },
]

export default _nav
