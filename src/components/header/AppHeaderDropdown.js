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
import useApi from '../../hooks/useApi'
import { useTranslation } from 'react-i18next'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const avatar = useSelector((state) => state.avatar)
  const defaultAvatar = '/avatar.png'
  const { t } = useTranslation()

  const [tokenExpiring, setTokenExpiring] = useState(false)
  const [counter, setCounter] = useState(15)
  const [timerId, setTimerId] = useState(null) // ID del intervalo para detenerlo

  const { request } = useApi()
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      request('get', '/profile', null, { Authorization: `Bearer ${token}` })
        .then((res) => {
          if (!res.success || !res.data) {
            throw new Error('Error al obtener los datos del perfil')
          }
          dispatch({ type: 'setAvatar', avatar: res.data.avatar })
        })
        .catch((error) => console.error('Error al obtener los datos del perfil:', error))
    }
  }, [dispatch])

  const handleTokenRenewal = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return
    try {
      const res = await request('post', '/auth/renew-token', null, {
        Authorization: `Bearer ${token}`,
      })
      if (!res.success || !res.data || !res.data.token) throw new Error('Failed to renew token')
      localStorage.setItem('authToken', res.data.token)
      setTokenExpiring(false)
      setCounter(15)
      clearInterval(timerId)
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

      localStorage.clear()
      navigate('/login')
    }
  }, [counter, tokenExpiring, timerId, navigate])

  const handleLogout = () => {
    if (timerId) {
      clearInterval(timerId)
      setTimerId(null)
    }

    // Limpiar todo el localStorage
    localStorage.clear()

    dispatch({ type: 'resetAvatar' })

    navigate('/login', { replace: true })
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
          {t('Profile')}
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout}>
          <CIcon icon={cilExitToApp} className="me-2" />
          {t('Sign out')}
        </CDropdownItem>
      </CDropdownMenu>
      {tokenExpiring && (
        <CToast className="custom-toast" animation={true} autohide={false} visible={true}>
          <CToastHeader closeButton>
            <div className="fw-bold me-auto">Session Expiration</div>
          </CToastHeader>
          <CToastBody>
            <div className="toast-content">
              <p>
                {t('Your session will expire in')} {counter} {t('seconds')}.
              </p>
              <CButton
                color="primary"
                onClick={handleTokenRenewal}
                className="renew-session-button"
              >
                {t('Keep Session Active')}
              </CButton>
            </div>
          </CToastBody>
        </CToast>
      )}
    </CDropdown>
  )
}

export default AppHeaderDropdown
