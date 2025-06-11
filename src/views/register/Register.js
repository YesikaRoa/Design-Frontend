import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Notifications from '../../components/Notifications'
import './styles/Register.css'
import bcrypt from 'bcryptjs'

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
  CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilLockUnlocked, cilUser } from '@coreui/icons'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import { validateEmail, isStepValid } from './Validationes'

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    birth_date: '',
    gender: '',
    biography: '',
    specialty: '',
    subspecialty: '',
    years_experience: '',
    avatar: defaultAvatar,
    role_id: 'Professional',
    status: 'Active',
  })
  const [step, setStep] = useState(1)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const [professionalTypes, setProfessionalTypes] = useState([])
  const [specialtiesData, setSpecialtiesData] = useState([])
  useEffect(() => {
    // Cargar tipos de profesional
    fetch('http://localhost:8000/professional_type')
      .then((res) => res.json())
      .then((data) => setProfessionalTypes(data))
    // Cargar especialidades
    fetch('http://localhost:8000/specialty')
      .then((res) => res.json())
      .then((data) => setSpecialtiesData(data))
  }, [])

  // Filtrar especialidades y subespecialidades según selección
  const specialties = specialtiesData.filter((s) => !s.parent_id)
  const subspecialties = specialtiesData.filter(
    (s) => s.parent_id && s.parent_id === Number(formData.specialty),
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      ...(name === 'professional_type' && { specialty: '', subspecialty: '' }),
      ...(name === 'specialty' && { subspecialty: '' }),
    }))
  }

  const handleNext = () => {
    if (isStepValid(step, formData)) {
      setStep((prevStep) => prevStep + 1)
    } else {
      Notifications.showAlert(setAlert, 'Complete all fields to continue.', 'warning')
    }
  }

  const handlePrevious = () => {
    if (step > 1) setStep((prevStep) => prevStep - 1)
  }
  // ...existing code...
  const handleRegister = async () => {
    try {
      // 1. Verificar si el correo ya existe
      const emailResponse = await fetch(`http://localhost:8000/users?email=${formData.email}`)
      const existingUsers = await emailResponse.json()
      if (existingUsers.length > 0) {
        Notifications.showAlert(setAlert, 'Email already in use.', 'danger')
        return
      }

      // 2. Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(formData.password, 10)

      // 3. Crear usuario
      const now = new Date().toISOString()
      // ...existing code...
      const userPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: hashedPassword,
        address: formData.address,
        phone: formData.phone,
        birth_date: formData.birth_date,
        gender: formData.gender,
        avatar: formData.avatar, // solo si tu tabla user tiene avatar
        role_id: 2, // o el id correspondiente
        status: 'Active',
        created_at: now,
        updated_at: now,
      }
      // ...existing code...
      const userRes = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      })
      if (!userRes.ok) {
        Notifications.showAlert(setAlert, 'User creation failed.', 'danger')
        return
      }
      const user = await userRes.json()

      // 4. Crear profesional
      const professionalPayload = {
        user_id: user.id,
        professional_type_id: Number(formData.professional_type), // Debe ser el id, ajusta si es necesario
        biography: formData.biography,
        years_of_experience: Number(formData.years_experience),
        created_at: now,
      }
      const profRes = await fetch('http://localhost:8000/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professionalPayload),
      })
      if (!profRes.ok) {
        Notifications.showAlert(setAlert, 'Professional creation failed.', 'danger')
        return
      }
      const professional = await profRes.json()

      // 5. Registrar especialidad principal
      if (formData.specialty) {
        await fetch('http://localhost:8000/professional_specialty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialty_id: Number(formData.specialty),
            professional_id: professional.id,
          }),
        })
      }
      // 6. Registrar subespecialidad si existe
      if (formData.subspecialty) {
        await fetch('http://localhost:8000/professional_specialty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialty_id: Number(formData.subspecialty),
            professional_id: professional.id,
          }),
        })
      }

      Notifications.showAlert(setAlert, 'Registration successful!', 'success')
      setTimeout(() => navigate('/login'), 1000)
    } catch (error) {
      console.error('Error:', error)
      Notifications.showAlert(setAlert, 'An error occurred. Please try again later.', 'danger')
    }
  }

  const handleBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      Notifications.showAlert(setAlert, 'Please enter a valid email address.', 'danger')
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText className="input-group-text">
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Primer nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText className="input-group-text">
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Apellido"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>@</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Correo electrónico"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                type="email"
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText
                style={{ cursor: 'pointer' }}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <CIcon icon={showPassword ? cilLockUnlocked : cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </CInputGroup>
          </>
        )
      case 2:
        return (
          <>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>📍</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Dirección"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>📞</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>🎂</CInputGroupText>
              <CFormInput
                className="form-input"
                type="date"
                placeholder="Fecha de nacimiento"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>⚧</CInputGroupText>
              <CFormSelect
                className="form-select"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Seleccione género</option>
                <option value="F">F</option>
                <option value="M">M</option>
              </CFormSelect>
            </CInputGroup>
          </>
        )
      case 3:
        return (
          <>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>📝</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Biografía"
                name="biography"
                value={formData.biography}
                onChange={handleInputChange}
              />
            </CInputGroup>
            {/* Tipo de profesional */}
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>👤</CInputGroupText>
              <CFormSelect
                className="form-select"
                name="professional_type"
                value={formData.professional_type}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione tipo de profesional</option>
                {professionalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </CFormSelect>
            </CInputGroup>
            {formData.professional_type && (
              <>
                <CInputGroup className="mb-3 form-step">
                  <CInputGroupText>Especialidad</CInputGroupText>
                  <CFormSelect
                    className="form-select"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccione especialidad</option>
                    {specialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CInputGroup>
                {formData.specialty && (
                  <CInputGroup className="mb-3 form-step">
                    <CInputGroupText>Subespecialidad</CInputGroupText>
                    <CFormSelect
                      className="form-select"
                      name="subspecialty"
                      value={formData.subspecialty}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione subespecialidad</option>
                      {subspecialties.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CInputGroup>
                )}
              </>
            )}
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>📅</CInputGroupText>
              <CFormInput
                className="form-input"
                type="number"
                placeholder="Años de experiencia"
                name="years_experience"
                value={formData.years_experience}
                onChange={handleInputChange}
              />
            </CInputGroup>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center Register-background">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm>
                  <h1 className="text-center">Register</h1>
                  <div className="steps-indicator">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div className="step-item" key={index}>
                        <div className={`step-circle ${index + 1 === step ? 'active' : ''}`}>
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {alert && (
                    <CAlert color={alert.type} className="text-center alert-fixed">
                      {alert.message}
                    </CAlert>
                  )}
                  {renderStep()}

                  <div className="d-flex justify-content-between mt-3">
                    {step > 1 && (
                      <CButton color="secondary" onClick={handlePrevious}>
                        Previous
                      </CButton>
                    )}
                    {step === 1 && (
                      <CButton
                        color="light"
                        className="text-primary"
                        onClick={() => navigate('/login')}
                      >
                        Ir a inicio de sesión
                      </CButton>
                    )}
                    {step < 3 ? (
                      <CButton color="primary" onClick={handleNext}>
                        Siguiente
                      </CButton>
                    ) : (
                      <CButton color="success" onClick={handleRegister}>
                        Regístrate
                      </CButton>
                    )}
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
