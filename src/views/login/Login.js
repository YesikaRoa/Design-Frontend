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
import { cilLockLocked, cilUser } from '@coreui/icons'
import ModalSendInformation from '../../components/ModalSendInformation'
import Notifications from '../../components/Notifications'
import emailjs from 'emailjs-com'
import './styles/Login.css'

const Login = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [alert, setAlert] = useState(null)
  const navigate = useNavigate()

  const handleSendPassword = async () => {
    const emailInput = document.querySelector('#email-input').value

    // Validar que el campo sea un email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailInput)) {
      Notifications.showAlert(setAlert, 'Por favor, ingrese un correo válido.', 'danger')
      return
    }

    try {
      // Obtener datos del usuario desde db.json
      const response = await fetch(`http://localhost:8000/users?email=${emailInput}`)
      const users = await response.json()

      if (users.length === 0) {
        Notifications.showAlert(setAlert, 'El correo no está registrado.', 'danger')
        return
      }
      if (users.length > 1) {
        Notifications.showAlert(
          setAlert,
          'Hay múltiples cuentas con este correo. Contacte al soporte.',
          'danger',
        )
        return
      }

      const user = users[0]

      // Enviar correo con Email.js
      const templateParams = {
        to_email: user.email, // Correo del destinatario
        to_name: `${user.first_name} ${user.last_name}`, // Nombre completo del destinatario
        password: user.password, // Contraseña del usuario
        from_name: 'MediPanel', // Nombre del remitente
      }

      await emailjs.send(
        'service_tedn2sc', // Reemplaza con tu Service ID
        'template_sjjfyk7', // Reemplaza con tu Template ID
        templateParams,
        '7Sv0ctCgjuz0NoPk3', // Reemplaza con tu Public Key
      )

      Notifications.showAlert(setAlert, 'La contraseña ha sido enviada a su correo.', 'success')
      setModalVisible(false)
    } catch (error) {
      console.error('Error al enviar el correo:', error)
      Notifications.showAlert(setAlert, 'Hubo un error al enviar el correo.', 'danger')
    }
  }

  const handleLogin = async () => {
    const username = document.querySelector('#username-input').value
    const password = document.querySelector('#password-input').value

    if (!username || !password) {
      Notifications.showAlert(setAlert, 'Por favor, complete todos los campos.', 'danger')
      return
    }

    try {
      // Obtener datos del usuario desde db.json
      const response = await fetch(`http://localhost:8000/users?email=${username}`)
      const users = await response.json()

      if (users.length === 0) {
        Notifications.showAlert(setAlert, 'No tienes una cuenta registrada.', 'danger')
        return
      }

      const user = users[0]

      if (user.password !== password) {
        Notifications.showAlert(setAlert, 'Contraseña incorrecta.', 'danger')
        return
      }

      // Si las credenciales son correctas, redirigir al dashboard
      if (user.password === password) {
        localStorage.setItem('authToken', 'your-auth-token') // Guarda un token de autenticación
        localStorage.setItem('userId', user.id)
        navigate('/') // Redirige al layout principal
        return
      }
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
                    <div className="mb-3">
                      <CAlert color={alert.type} className="text-center">
                        {alert.message}
                      </CAlert>
                    </div>
                  )}
                  <CForm>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="username-input"
                        placeholder="Username"
                        autoComplete="username"
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="password-input"
                        type="password"
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
