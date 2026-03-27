import React, { useEffect, useRef, useState } from 'react'
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
  CRow,
  CAlert,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilSun, cilMoon, cilLanguage } from '@coreui/icons'
import ModalSendInformation from '../../components/ModalSendInformation'
import Notifications from '../../components/Notifications'
import emailjs from 'emailjs-com'
import './styles/Login.css'
import { useTranslation } from 'react-i18next'

const eyeOpenIcon = [
  '512 512',
  "<path fill='var(--ci-primary-color, currentColor)' d='M256 112C132.3 112 48 256 48 256s84.3 144 208 144 208-144 208-144-84.3-144-208-144Zm0 256c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112Zm0-176a64 64 0 1 0 64 64 64 64 0 0 0-64-64Z'/>",
]

const eyeClosedIcon = [
  '512 512',
  "<path fill='var(--ci-primary-color, currentColor)' d='M40 80l-24 24 80.4 80.4C64.2 212.8 48 256 48 256s84.3 144 208 144c43.3 0 81.9-17.6 114.3-42.5L448 432l24-24ZM256 368c-61.9 0-112-50.1-112-112 0-17.3 3.9-33.6 10.9-48.2l149.3 149.3A111.5 111.5 0 0 1 256 368Zm0-256c-43.3 0-81.9 17.6-114.3 42.5L64 80 40 104l432 432 24-24-80.4-80.4C447.8 299.2 464 256 464 256S379.7 112 256 112Zm0 32c61.9 0 112 50.1 112 112 0 17.3-3.9 33.6-10.9 48.2L207.8 154.9A111.5 111.5 0 0 1 256 144Z'/>",
]

const Login = () => {
  const { request, loading } = useApi()
  const [modalVisible, setModalVisible] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const alertRef = useRef(null)
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
        Notifications.showAlert(setAlert, response.message || t('Error sending email.'), 'danger')
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
      Notifications.showAlert(setAlert, error.message || t('Error sending email.'), 'danger')
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
      setIsSubmitting(true)
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
        setEmail('')
        setPassword('')
        setShowPassword(false)
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
    } finally {
      setIsSubmitting(false)
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
    localStorage.setItem('i18nextLng', newLang)
  }

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (alert && alertRef.current) {
      alertRef.current.focus()
    }
  }, [alert])

  return (
    <div className="login-page-wrapper min-vh-100 d-flex align-items-center justify-content-center">
      <div className="login-background-overlay"></div>
      <CContainer>
        <CRow className="w-100 mt-3">
          <CCol className="d-flex justify-content-end">
            <div className="login-controls d-flex justify-content-end gap-2">
              <CButton
                color="light"
                variant="outline"
                className="btn-toggle shadow-sm"
                onClick={toggleLanguage}
              >
                <CIcon icon={cilLanguage} className="me-2" />
                {i18n.language === 'en' ? 'EN' : 'ES'}
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
          </CCol>
        </CRow>
        <CRow className="justify-content-center w-100 m-0">
          <CCol md={6} lg={5} xl={4} className="login-card-col">
            <CCard className="login-card border-0 shadow-lg blur-card">
              <CCardBody className={`p-4 p-md-5 login-card-body}`}>
                <div className="text-center mb-4 login-header">
                  <div className="brand-pill mb-3">
                    <span className="brand-dot"></span>
                    <span className="brand-label">MediPanel</span>
                  </div>
                  <h2 className="fw-bold mb-1">{t('Login')}</h2>
                  <p className="text-secondary mb-0">{t('Sign In to your account')}</p>
                </div>

                <CForm
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin()
                  }}
                >
                  <div className="mb-3">
                    <div className="floating-input-group">
                      <CIcon icon={cilUser} className="floating-input-icon" />
                      <CFormInput
                        id="username-input"
                        className="floating-input floating-input-email"
                        placeholder={t('Email')}
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <small className="login-input-hint">{t('Use your institutional email')}</small>
                  </div>

                  <div className="mb-4">
                    <div className="floating-input-group">
                      <CIcon icon={cilLockLocked} className="floating-input-icon" />
                      <CFormInput
                        id="password-input"
                        className="floating-input floating-input-password pe-5"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('Password')}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="floating-input-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? t('Hide password') : t('Show password')}
                      >
                        <CIcon icon={showPassword ? eyeClosedIcon : eyeOpenIcon} />
                      </button>
                    </div>
                    <small className="login-input-hint">
                      {t('Minimum 8 characters recommended')}
                    </small>
                  </div>

                  <div className="d-grid mb-3 login-primary-action">
                    <CButton
                      type="submit"
                      color="primary"
                      className="btn-login py-2 px-4 fw-semibold"
                      disabled={loading || isSubmitting}
                    >
                      {loading || isSubmitting ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                      ) : null}
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

                  <div className="text-center mt-3 login-secondary-action">
                    <p className="text-secondary small mb-3">{t("Don't have an account?")}</p>
                    <Link to="/register">
                      <CButton
                        color="primary"
                        variant="outline"
                        className="btn-register w-100 py-2"
                      >
                        {t('Register Now!')}
                      </CButton>
                    </Link>
                  </div>

                  <p className="login-footer-note mb-0 mt-3">
                    {t('Protected access')} - MediPanel {currentYear}
                  </p>
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
      {alert && (
        <CAlert
          ref={alertRef}
          color={alert.type}
          className="alert-fixed login-card-alert login-card-alert-attention mb-0"
          role="alert"
          tabIndex={-1}
        >
          {alert.message}
        </CAlert>
      )}
    </div>
  )
}

export default Login
