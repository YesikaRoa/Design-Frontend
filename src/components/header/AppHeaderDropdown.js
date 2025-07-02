import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CToast,
  CToastBody,
  CToastHeader,
  CButton,
} from '@coreui/react'
import { cilUser, cilExitToApp } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import './style/header.css'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const avatar = useSelector((state) => state.avatar)
  const defaultAvatar = '/avatar.png'

  const [tokenExpiring, setTokenExpiring] = useState(false)
  const [counter, setCounter] = useState(15)
  const [timerId, setTimerId] = useState(null) // ID del intervalo para detenerlo

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      fetch('https://aplication-backend-production-872f.up.railway.app/api/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al obtener los datos del perfil')
          }
          return response.json()
        })
        .then((data) => {
          dispatch({ type: 'setAvatar', avatar: data.avatar }) // Actualiza Redux
        })
        .catch((error) => console.error('Error al obtener los datos del perfil:', error))
    }
  }, [dispatch])

  const handleTokenRenewal = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      const res = await fetch(
        'https://aplication-backend-production-872f.up.railway.app/api/auth/renew-token',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) throw new Error('Failed to renew token')

      const data = await res.json()
      localStorage.setItem('authToken', data.token)

      // Reinicia el estado y detén el contador
      setTokenExpiring(false)
      setCounter(15)
      clearInterval(timerId) // Detén el intervalo
    } catch (error) {
      console.error('Error renewing token:', error)
    }
  }

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const { exp } = JSON.parse(atob(token.split('.')[1]))
      const timeLeft = exp * 1000 - Date.now()

      if (timeLeft <= 15000 && !tokenExpiring) {
        setTokenExpiring(true)
        setCounter(Math.floor(timeLeft / 1000))

        // Inicia un intervalo para manejar el contador
        const id = setInterval(() => {
          setCounter((prevCounter) => prevCounter - 1)
        }, 1000)
        setTimerId(id) // Guarda el ID del intervalo
      }
    }

    const interval = setInterval(checkTokenExpiration, 1000)

    return () => clearInterval(interval)
  }, [tokenExpiring])

  useEffect(() => {
    if (counter <= 0 && tokenExpiring) {
      clearInterval(timerId) // Detén el intervalo si el contador llega a 0
      localStorage.removeItem('authToken')
      navigate('/login')
    }
  }, [counter, tokenExpiring, timerId, navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar || defaultAvatar} size="md" />
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
      {tokenExpiring && (
        <CToast className="custom-toast" animation={true} autohide={false} visible={true}>
          <CToastHeader closeButton>
            <div className="fw-bold me-auto">Session Expiration</div>
          </CToastHeader>
          <CToastBody>
            <div className="toast-content">
              <p>Your session will expire in {counter} seconds.</p>
              <CButton
                color="primary"
                onClick={handleTokenRenewal}
                className="renew-session-button"
              >
                Keep Session Active
              </CButton>
            </div>
          </CToastBody>
        </CToast>
      )}
    </CDropdown>
  )
}

export default AppHeaderDropdown
