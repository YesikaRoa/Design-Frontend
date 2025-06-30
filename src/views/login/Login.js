import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const Login = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSendPassword = async () => {
    const emailInput = document.querySelector('#email-input').value

    try {
      const response = await fetch('http://localhost:3000/api/auth/send-temporary-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error desconocido')
      }

      const { user, tempPassword } = await response.json()

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

  const handleLogin = async () => {
    const email = document.querySelector('#username-input').value
    const password = document.querySelector('#password-input').value

    if (!email || !password) {
      Notifications.showAlert(setAlert, 'Por favor, complete todos los campos.', 'danger')
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.issues && Array.isArray(data.issues)) {
          // Mostrar errores específicos de validación
          const messages = data.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          // Mostrar mensaje general
          Notifications.showAlert(setAlert, data.message || 'Error al iniciar sesión.', 'danger')
        }
        return
      }

      // Guardar token y redirigir al dashboard
      localStorage.setItem('authToken', data.token)
      window.location.href = '/#/dashboard'
      window.location.reload()
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      Notifications.showAlert(setAlert, 'Hubo un error al iniciar sesión.', 'danger')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center login-background ">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup className="some-class">
              <CCard className="p-4 ">
                <CCardBody>
                  {alert && (
                    <CAlert color={alert.type} className="text-center alert-fixed">
                      {alert.message}
                    </CAlert>
                  )}
                  <CForm>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput id="username-input" placeholder="Email" autoComplete="email" />
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
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" onClick={handleLogin}>
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton
                          color="link"
                          className="px-0"
                          onClick={() => setModalVisible(true)}
                        >
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h3>Welcome to MediPanel</h3>
                    <p>
                      "Every appointment is an opportunity to change a life. This panel will help
                      you do it with love and excellence."
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
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
        title="Recuperar Contraseña"
        message="Ingrese su correo electrónico registrado para recibir su contraseña."
        onSend={handleSendPassword}
      >
        <CFormInput
          id="email-input" // Este es el campo donde se ingresa el correo
          type="email"
          placeholder="Correo electrónico"
          required
        />
      </ModalSendInformation>
    </div>
  )
}

export default Login
