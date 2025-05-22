import React, { useState } from 'react'
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
import { cilLockLocked, cilUser } from '@coreui/icons'
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
    description: '',
    specialty: '',
    subspecialty: '',
    years_experience: '',
    avatar: defaultAvatar,
    role_id: '',
    status: 'Active',
  })
  const [step, setStep] = useState(1)
  const [alert, setAlert] = useState(null)
  const navigate = useNavigate()

  const specialties = {
    Doctor: {
      MedicinaGeneral: [
        'Atención Preventiva',
        'Manejo de Enfermedades Crónicas',
        'Educación en Salud',
      ],
      Cardiología: [
        'Cardiología Intervencionista',
        'Cardiología Pediátrica',
        'Manejo de Insuficiencia Cardíaca',
      ],
      Dermatología: ['Dermatología Cosmética', 'Dermatología Pediátrica', 'Dermatopatología'],
      Neurología: [
        'Neurología Clínica',
        'Neurofisiología',
        'Manejo de Accidentes Cerebrovasculares',
      ],
      Pediatría: ['Neonatología', 'Oncología Pediátrica', 'Pediatría del Desarrollo'],
      Oncología: ['Oncología Médica', 'Oncología Radioterápica', 'Oncología Quirúrgica'],
    },
    Nurse: {
      CuidadosGenerales: [
        'Cuidado de Heridas',
        'Administración de Medicamentos',
        'Monitoreo de Signos Vitales',
      ],
      Pediatría: ['Enfermería Neonatal', 'Enfermería Escolar', 'Cuidados Críticos Pediátricos'],
      Quirúrgico: [
        'Enfermería Perioperatoria',
        'Enfermería Postoperatoria',
        'Enfermería Oncológica Quirúrgica',
      ],
      SaludComunitaria: [
        'Enfermería de Salud Pública',
        'Cuidado en el Hogar',
        'Educación Comunitaria',
      ],
      CuidadosCríticos: ['Enfermería en UCI', 'Enfermería de Emergencias', 'Enfermería de Trauma'],
    },
    Therapist: {
      Fisioterapia: [
        'Rehabilitación Ortopédica',
        'Rehabilitación Neurológica',
        'Terapia Geriátrica',
      ],
      TerapiaOcupacional: ['Terapia de la Mano', 'Rehabilitación Pediátrica', 'Terapia Vocacional'],
      TerapiaDelHabla: [
        'Terapia para Trastornos de la Voz',
        'Terapia para Trastornos de Deglución',
        'Terapia de Articulación',
      ],
      TerapiaDeportiva: [
        'Prevención de Lesiones',
        'Rehabilitación Post-Lesión',
        'Mejora del Rendimiento Deportivo',
      ],
      TerapiaMental: ['Terapia Cognitivo-Conductual', 'Terapia de Trauma', 'Manejo del Estrés'],
    },
    Administrator: {
      LiderTecnico: [
        'Gestión de Equipos de Desarrollo',
        'Planificación de Arquitectura',
        'Revisión de Código',
      ],
      Backend: [
        'Diseño de APIs RESTful',
        'Optimización de Bases de Datos',
        'Gestión de Microservicios',
      ],
      Frontend: [
        'Diseño de Interfaces de Usuario',
        'Desarrollo con Frameworks (React, Angular)',
        'Pruebas de Usabilidad',
      ],
      DevOps: [
        'Integración y Entrega Continua (CI/CD)',
        'Automatización de Infraestructura',
        'Monitoreo y Alertas',
      ],
      EstrategiaTecnológica: [
        'Definición de Roadmap Técnico',
        'Evaluación de Nuevas Tecnologías',
        'Gestión de Proyectos de Desarrollo',
      ],
    },
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
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
  const handleRegister = async () => {
    try {
      // Verificar si el correo ya existe
      const emailResponse = await fetch(`http://localhost:8000/users?email=${formData.email}`)
      const existingUsers = await emailResponse.json()

      if (existingUsers.length > 0) {
        Notifications.showAlert(setAlert, 'Email already in use.', 'danger')
        return
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(formData.password, 10)

      // Guardar los datos del usuario
      const response = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, password: hashedPassword }),
      })

      if (response.ok) {
        Notifications.showAlert(setAlert, 'Registration successful!', 'success')
        setTimeout(() => navigate('/login'), 1000)
      } else {
        Notifications.showAlert(setAlert, 'Registration failed. Please try again.', 'danger')
      }
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
              <CInputGroupText className="input-group-text">
                <CIcon icon={cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                className="form-input"
                type="password"
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
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </CInputGroup>
            <CInputGroup className="mb-3 form-step">
              <CInputGroupText>🏥</CInputGroupText>
              <CFormSelect
                className="form-select"
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
              >
                <option value="">Select type of professional</option>
                <option value="Administrator">Administrator</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Therapist">Therapist</option>
              </CFormSelect>
            </CInputGroup>
            {formData.role_id && (
              <>
                <CInputGroup className="mb-3 form-step">
                  <CInputGroupText>Specialty</CInputGroupText>
                  <CFormSelect
                    className="form-select"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Specialty</option>
                    {Object.keys(specialties[formData.role_id]).map((specialty, idx) => (
                      <option key={idx} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </CFormSelect>
                </CInputGroup>
                {formData.specialty && (
                  <CInputGroup className="mb-3 form-step">
                    <CInputGroupText>Subspecialty</CInputGroupText>
                    <CFormSelect
                      className="form-select"
                      name="subspecialty"
                      value={formData.subspecialty}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Subspecialty</option>
                      {specialties[formData.role_id][formData.specialty].map(
                        (subspecialty, idx) => (
                          <option key={idx} value={subspecialty}>
                            {subspecialty}
                          </option>
                        ),
                      )}
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
