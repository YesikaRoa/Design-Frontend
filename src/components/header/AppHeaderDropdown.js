import React, { useEffect, useState } from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilUser, cilExitToApp } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'

const AppHeaderDropdown = () => {
  const navigate = useNavigate() // Inicializa useNavigate
  const [avatar, setAvatar] = useState(null) // Estado para almacenar el avatar del usuario

  useEffect(() => {
    const userId = localStorage.getItem('userId') // Obtén el ID del usuario desde localStorage
    if (userId) {
      // Realiza una solicitud para obtener los datos del usuario
      fetch(`http://localhost:8000/users/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          setAvatar(data.avatar) // Actualiza el estado con la URL del avatar
        })
        .catch((error) => console.error('Error al obtener los datos del usuario:', error))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken') // Elimina el token de autenticación
    localStorage.removeItem('userId') // Elimina el ID del usuario
    navigate('/login') // Redirige al login
  }

  const handleProfileClick = () => {
    navigate('/profile') // Redirige a la ruta del perfil
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar || 'default-avatar.jpg'} size="md" />{' '}
        {/* Muestra un avatar por defecto si no hay avatar */}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownItem onClick={handleProfileClick}>
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout}>
          <CIcon icon={cilExitToApp} className="me-2" />
          Sign out
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
