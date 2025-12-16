import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import useApi from '../../hooks/useApi'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilLockUnlocked } from '@coreui/icons'
import ModalSendInformation from '../../components/ModalSendInformation'
import Notifications from '../../components/Notifications'
import emailjs from 'emailjs-com'
import './styles/Login.css'
import { useTranslation } from 'react-i18next'

const Login = () => {
  const { request, loading } = useApi()
  const [modalVisible, setModalVisible] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Estados controlados para inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')

  const handleSendPassword = async () => {
    if (!recoveryEmail) {
      Notifications.showAlert(setAlert, 'Por favor, ingrese su correo.', 'danger')
      return
    }

    try {
      const response = await request('POST', '/auth/send-temporary-password', {
        email: recoveryEmail,
      })
      if (!response.success) {
        Notifications.showAlert(
          setAlert,
          response.message || 'Hubo un error al enviar el correo.',
          'danger',
        )
        return
      }

      const { user, tempPassword } = response.data

      // Enviar correo con Email.js
      const templateParams = {
        to_email: user.email,
        to_name: `${user.first_name} ${user.last_name}`,
        password: tempPassword,
        from_name: 'MediPanel',
      }

      await emailjs.send('service_tedn2sc', 'template_sjjfyk7', templateParams, '7Sv0ctCgjuz0NoPk3')

      Notifications.showAlert(
        setAlert,
        'La contraseña temporal ha sido enviada a su correo.',
        'success',
      )
      setModalVisible(false)
    } catch (error) {
      Notifications.showAlert(
        setAlert,
        error.message || 'Hubo un error al enviar el correo.',
        'danger',
      )
    }
  }

  // Helper para obtener el ID del token (puedes moverlo a un archivo de helpers si lo necesitas en más sitios)
  const getUserIdFromToken = (token) => {
    try {
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.id || null
    } catch {
      return null
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Notifications.showAlert(setAlert, 'Por favor, complete todos los campos.', 'danger')
      return
    }

    try {
      const response = await request('POST', '/auth/login', { email, password })
      if (!response.success) {
        if (response.data?.issues?.length) {
          const messages = response.data.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(
            setAlert,
            response.message || 'Error al iniciar sesión.',
            'danger',
          )
        }
        return
      }

      const token = response.data.token
      localStorage.setItem('authToken', token)
      sessionStorage.clear()

      window.location.href = '/#/dashboard'
      window.location.reload()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      Notifications.showAlert(setAlert, 'Hubo un error al iniciar sesión.', 'danger')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center login-background">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup className="some-class">
              <CCard className="p-4">
                <CCardBody>
                  {alert && (
                    <CAlert color={alert.type} className="text-center alert-fixed">
                      {alert.message}
                    </CAlert>
                  )}
                  <CForm
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleLogin()
                    }}
                  >
                    <h1>{t('Login')}</h1>
                    <p className="text-body-secondary">{t('Sign In to your account')}</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="username-input"
                        placeholder={t('Email')}
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('Password')}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {t('Login')}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton
                          color="link"
                          className="px-0"
                          onClick={() => setModalVisible(true)}
                        >
                          {t('Forgot password?')}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-4">
                <CCardBody className="text-center">
                  <div>
                    <h2>{t('Welcome to MediPanel')}</h2>
                    <p className="whit">
                      {t(
                        '"Every appointment is an opportunity to change a life. This panel will help you do it with love and excellence."',
                      )}
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        {t('Register Now!')}
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      <ModalSendInformation
        visible={modalVisible}
        setVisible={setModalVisible}
        title={t('Recover Password')}
        message={t('Please enter your registered email to receive your password.')}
        onSend={handleSendPassword}
      >
        <CFormInput
          id="email-input"
          type="email"
          placeholder={t('Email')}
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          required
        />
      </ModalSendInformation>
    </div>
  )
}

export default Login
