import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import useApi from '../../hooks/useApi'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilLockUnlocked, cilSun, cilMoon, cilLanguage } from '@coreui/icons'
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
      Notifications.showAlert(setAlert, t('Please enter your email.'), 'danger')
      return
    }

    try {
      const response = await request('POST', '/auth/send-temporary-password', {
        email: recoveryEmail,
      })
      if (!response.success) {
        Notifications.showAlert(
          setAlert,
          response.message || t('Error sending email.'),
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
        t('The temporary password has been sent to your email.'),
        'success',
      )
      setModalVisible(false)
    } catch (error) {
      Notifications.showAlert(
        setAlert,
        error.message || t('Error sending email.'),
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
      Notifications.showAlert(setAlert, t('Complete all fields to continue.'), 'danger')
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
            response.message || t('An unexpected error occurred.'),
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
      Notifications.showAlert(setAlert, t('An unexpected error occurred.'), 'danger')
    }
  }

  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const { i18n } = useTranslation()

  const toggleTheme = () => {
    const newMode = colorMode === 'dark' ? 'light' : 'dark'
    setColorMode(newMode)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="login-page-wrapper min-vh-100 d-flex align-items-center justify-content-center">
      <div className="login-background-overlay"></div>

      <div className="login-controls top-0 end-0 p-3 position-absolute d-flex gap-2">
        <CButton
          color="light"
          variant="outline"
          className="btn-toggle shadow-sm"
          onClick={toggleLanguage}
        >
          <CIcon icon={cilLanguage} className="me-2" />
          {i18n.language === 'en' ? 'ES' : 'EN'}
        </CButton>
        <CButton
          color="light"
          variant="outline"
          className="btn-toggle shadow-sm"
          onClick={toggleTheme}
        >
          <CIcon icon={colorMode === 'dark' ? cilSun : cilMoon} />
        </CButton>
      </div>

      <CContainer>
        <CRow className="justify-content-center w-100 m-0">
          <CCol md={5} lg={4} xl={4}>
            <CCard className="login-card border-0 shadow-lg blur-card">
              <CCardBody className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <span className="fs-1 fw-bold text-primary" style={{ letterSpacing: '-1px' }}>MediPanel</span>
                  </div>
                  <h2 className="fw-bold">{t('Login')}</h2>
                  <p className="text-secondary">{t('Sign In to your account')}</p>
                </div>

                {alert && (
                  <CAlert color={alert.type} className="mb-4">
                    {alert.message}
                  </CAlert>
                )}

                <CForm
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin()
                  }}
                >
                  <div className="mb-3">
                    <CInputGroup className="custom-input-group">
                      <CInputGroupText className="bg-transparent border-end-0">
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="username-input"
                        className="border-start-0 ps-0"
                        placeholder={t('Email')}
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </CInputGroup>
                  </div>

                  <div className="mb-4">
                    <CInputGroup className="custom-input-group">
                      <CInputGroupText
                        className="bg-transparent border-end-0"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="password-input"
                        className="border-start-0 ps-0"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('Password')}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>
                  </div>

                  <div className="d-grid mb-3">
                    <CButton
                      type="submit"
                      color="primary"
                      className="btn-login py-2 px-4 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                      {t('Login')}
                    </CButton>
                  </div>

                  <div className="text-center">
                    <CButton
                      color="link"
                      className="text-decoration-none text-secondary p-0"
                      onClick={() => setModalVisible(true)}
                    >
                      {t('Forgot password?')}
                    </CButton>
                  </div>

                  <hr className="my-4 opacity-25" />

                  <div className="text-center mt-3">
                    <p className="text-secondary small mb-3">{t("Don't have an account?")}</p>
                    <Link to="/register">
                      <CButton color="primary" variant="outline" className="btn-register w-100 py-2">
                        {t('Register Now!')}
                      </CButton>
                    </Link>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
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
