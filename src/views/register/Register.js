import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Notifications from '../../components/Notifications'
import './styles/Register.css'

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
    role_id: '',
    status: 'Active',
  })
  const [step, setStep] = useState(1)
  const [alert, setAlert] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const [professionalTypes, setProfessionalTypes] = useState([])

  const [specialtiesData, setSpecialtiesData] = useState([])

  useEffect(() => {
    const fetchProfessionalTypes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/professional-types')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        setProfessionalTypes(data)
      } catch (error) {
        console.error('Error fetching professional types:', error)
      }
    }

    const fetchspecialties = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/specialties')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        setSpecialtiesData(data)
      } catch (error) {
        console.error('Error fetching professional types:', error)
      }
    }
    const convertDefaultAvatarToBase64 = async () => {
      try {
        const response = await fetch(defaultAvatar)
        const blob = await response.blob()

        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData((prevData) => ({
            ...prevData,
            avatar: reader.result, // Base64 string
          }))
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error converting default avatar to Base64:', error)
      }
    }

    convertDefaultAvatarToBase64()
    fetchProfessionalTypes()

    fetchspecialties()
  }, [])

  // Filtrar especialidades y subespecialidades según el tipo devuelto por el backend
  const specialties = specialtiesData.filter((s) => s.type === 'specialty')
  const subspecialties = specialtiesData.filter((s) => s.type === 'subspecialty')

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
      if (!formData.avatar.startsWith('data:image/')) {
        Notifications.showAlert(setAlert, 'Invalid avatar format.', 'danger')
        return
      }

      // Consolidar todos los datos en un único payload
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        phone: formData.phone,
        birth_date: formData.birth_date,
        gender: formData.gender,
        avatar: formData.avatar, // Base64 string
        role_id: 3, // ID del rol (Asegúrate de usar el correcto para "Profesional")
        status: 'Active',
        professional_type_id: Number(formData.professional_type),
        biography: formData.biography,
        years_of_experience: Number(formData.years_experience),
        specialty_ids: [Number(formData.specialty), Number(formData.subspecialty)].filter(Boolean),
      }

      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from backend:', errorData)

        if (errorData.issues && Array.isArray(errorData.issues)) {
          // Muestra los errores específicos de validación en el frontend
          const messages = errorData.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(setAlert, errorData.message || 'Registration failed.', 'danger')
        }
        return
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
                placeholder="First Name"
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
                placeholder="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>@</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Email"
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
                placeholder="Password"
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
                placeholder="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>📞</CInputGroupText>
              <CFormInput
                className="form-input"
                placeholder="Phone"
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
                placeholder="Birth Date"
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
                <option value="">Select Gender</option>
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
                placeholder="biography"
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
                placeholder="Years of Experience"
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
                    {step < 3 ? (
                      <CButton color="primary" onClick={handleNext}>
                        Next
                      </CButton>
                    ) : (
                      <CButton color="success" onClick={handleRegister}>
                        Register
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
