import React, { useState, useEffect } from 'react'
import useApi from '../../hooks/useApi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  CLink,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLockLocked,
  cilLockUnlocked,
  cilUser,
  cilEnvelopeOpen,
  cilSun,
  cilMoon,
  cilLanguage,
} from '@coreui/icons'

import { validateEmail, isStepValid, validateField } from './Validationes'

const eyeOpenIcon = [
  '512 512',
  "<path fill='var(--ci-primary-color, currentColor)' d='M256 112C132.3 112 48 256 48 256s84.3 144 208 144 208-144 208-144-84.3-144-208-144Zm0 256c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112Zm0-176a64 64 0 1 0 64 64 64 64 0 0 0-64-64Z'/>",
]

const eyeClosedIcon = [
  '512 512',
  "<path fill='var(--ci-primary-color, currentColor)' d='M40 80l-24 24 80.4 80.4C64.2 212.8 48 256 48 256s84.3 144 208 144c43.3 0 81.9-17.6 114.3-42.5L448 432l24-24ZM256 368c-61.9 0-112-50.1-112-112 0-17.3 3.9-33.6 10.9-48.2l149.3 149.3A111.5 111.5 0 0 1 256 368Zm0-256c-43.3 0-81.9 17.6-114.3 42.5L64 80 40 104l432 432 24-24-80.4-80.4C447.8 299.2 464 256 464 256S379.7 112 256 112Zm0 32c61.9 0 112 50.1 112 112 0 17.3-3.9 33.6-10.9 48.2L207.8 154.9A111.5 111.5 0 0 1 256 144Z'/>",
]

const Register = () => {
  const defaultAvatar = '/avatar.png'
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
  const { t, i18n } = useTranslation()
  const [errors, setErrors] = useState({})

  const [professionalTypes, setProfessionalTypes] = useState([])

  const [specialtiesData, setSpecialtiesData] = useState([])

  const { request, loading: apiLoading } = useApi()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

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
    const fetchProfessionalTypes = async () => {
      try {
        const { data } = await request('get', '/auth/professional-types')
        setProfessionalTypes(data || [])
      } catch (error) {
        console.error('Error fetching professional types:', error)
      }
    }
    const fetchspecialties = async () => {
      try {
        const { data } = await request('get', '/auth/specialties')
        setSpecialtiesData(data || [])
      } catch (error) {
        console.error('Error fetching specialties:', error)
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
            avatar: reader.result,
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

    const errorMessage = validateField(name, value, t)
    setErrors((prev) => ({ ...prev, [name]: errorMessage }))
  }

  const handleNext = () => {
    if (alert?.visible) return

    if (!formData.email) {
      Notifications.showAlert(setAlert, t('Complete all fields to continue.'), 'warning')
      return
    }

    if (!validateEmail(formData.email)) {
      Notifications.showAlert(setAlert, t('Please enter a valid email address.'), 'danger')
      return
    }

    if (isStepValid(step, formData)) {
      setStep((prev) => prev + 1)
    } else {
      Notifications.showAlert(setAlert, t('Complete all fields to continue.'), 'warning')
    }
  }

  const handlePrevious = () => {
    if (step > 1) setStep((prevStep) => prevStep - 1)
  }
  // ...existing code...
  const handleRegister = async () => {
    try {
      if (!formData.avatar.startsWith('data:image/')) {
        Notifications.showAlert(setAlert, t('Invalid avatar format.'), 'danger')
        return
      }
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        phone: formData.phone,
        birth_date: formData.birth_date,
        gender: formData.gender,
        avatar: formData.avatar,
        role_id: 3,
        status: 'Active',
        professional_type_id: Number(formData.professional_type),
        biography: formData.biography,
        years_of_experience: Number(formData.years_experience),
        specialty_ids: [Number(formData.specialty), Number(formData.subspecialty)].filter(Boolean),
      }
      const { success, error: apiError } = await request('post', '/auth/register', payload, {
        'Content-Type': 'application/json',
      })
      if (!success) {
        if (apiError && apiError.issues && Array.isArray(apiError.issues)) {
          const messages = apiError.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(
            setAlert,
            (apiError && apiError.message) || t('An unexpected error occurred.'),
            'danger',
          )
        }
        return
      }
      Notifications.showAlert(setAlert, t('Registration successful!'), 'success')
      setTimeout(() => navigate('/login'), 1000)
    } catch (error) {
      console.error('Error:', error)
      Notifications.showAlert(setAlert, t('An unexpected error occurred.'), 'danger')
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="mb-3">
              <div className="floating-input-group">
                <CIcon icon={cilUser} className="floating-input-icon" />
                <CFormInput
                  className="floating-input"
                  placeholder={t('First name')}
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      first_name: validateField('first_name', formData.first_name, t),
                    }))
                  }
                />
              </div>
              {errors.first_name && <small className="text-danger">{errors.first_name}</small>}
            </div>
            <div className="mb-3">
              <div className="floating-input-group">
                <CIcon icon={cilUser} className="floating-input-icon" />
                <CFormInput
                  className="floating-input"
                  placeholder={t('Last name')}
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      last_name: validateField('last_name', formData.last_name, t),
                    }))
                  }
                />
              </div>
              {errors.last_name && <small className="text-danger">{errors.last_name}</small>}
            </div>
            <div className="mb-3">
              <div className="floating-input-group">
                <CIcon icon={cilEnvelopeOpen} className="floating-input-icon" />
                <CFormInput
                  className="floating-input"
                  placeholder={t('Email')}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      email: validateField('email', formData.email, t),
                    }))
                  }
                />
              </div>
              {errors.email && <small className="text-danger">{errors.email}</small>}
            </div>
            <div className="mb-4">
              <div className="floating-input-group">
                <CIcon icon={cilLockLocked} className="floating-input-icon" />
                <CFormInput
                  className="floating-input pe-5"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('Password')}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      password: validateField('password', formData.password, t),
                    }))
                  }
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
              {errors.password && <small className="text-danger">{errors.password}</small>}
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">📍</span>
                <CFormInput
                  className="floating-input"
                  placeholder={t('Address')}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      address: validateField('address', formData.address, t),
                    }))
                  }
                />
              </div>
              {errors.address && <small className="text-danger">{errors.address}</small>}
            </div>

            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">📞</span>
                <CFormInput
                  className="floating-input"
                  placeholder={t('Phone')}
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      phone: validateField('phone', formData.phone, t),
                    }))
                  }
                />
              </div>
              {errors.phone && <small className="text-danger">{errors.phone}</small>}
            </div>

            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">🎂</span>
                <CFormInput
                  className="floating-input"
                  type="date"
                  placeholder="Birth Date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      birth_date: validateField('birth_date', formData.birth_date, t),
                    }))
                  }
                />
              </div>
              {errors.birth_date && <small className="text-danger">{errors.birth_date}</small>}
            </div>

            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">⚧</span>
                <CFormSelect
                  className="floating-input"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      gender: validateField('gender', formData.gender, t),
                    }))
                  }
                >
                  <option value="">{t('Select Gender')}</option>
                  <option value="F">F</option>
                  <option value="M">M</option>
                </CFormSelect>
              </div>
              {errors.gender && <small className="text-danger">{errors.gender}</small>}
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">📝</span>
                <CFormInput
                  className="floating-input"
                  placeholder={t('Biography')}
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            {/* Tipo de profesional */}
            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">👤</span>
                <CFormSelect
                  className="floating-input"
                  name="professional_type"
                  value={formData.professional_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('Select type of professional')}</option>
                  {professionalTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </div>
            {formData.professional_type && (
              <>
                <div className="mb-3">
                  <div className="floating-input-group">
                    <span className="floating-input-icon">🩺</span>
                    <CFormSelect
                      className="floating-input"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                    >
                      <option value="">{t('-- No specialty --')}</option>
                      {specialties.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="floating-input-group">
                    <span className="floating-input-icon">🔬</span>
                    <CFormSelect
                      className="floating-input"
                      name="subspecialty"
                      value={formData.subspecialty}
                      onChange={handleInputChange}
                      disabled={!formData.specialty}
                    >
                      <option value="">{t('-- No subspecialty --')}</option>
                      {subspecialties.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>
              </>
            )}
            <div className="mb-3">
              <div className="floating-input-group">
                <span className="floating-input-icon">📅</span>
                <CFormInput
                  className="floating-input"
                  type="number"
                  placeholder={t('Years of Experience')}
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleInputChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      years_experience: validateField(
                        'years_experience',
                        formData.years_experience,
                        t,
                      ),
                    }))
                  }
                />
              </div>
              {errors.years_experience && (
                <small className="text-danger">{errors.years_experience}</small>
              )}
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="register-page-wrapper min-vh-100 d-flex align-items-center justify-content-center">
      <div className="register-background-overlay"></div>

      <CContainer>
        <CRow className="w-100 mt-3">
          <CCol className="d-flex justify-content-end">
            <div className="register-controls d-flex justify-content-end gap-2">
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
          <CCol md={9} lg={7} xl={6} className="register-card-col">
            <CCard className="register-card border-0 shadow-lg blur-card">
              <CCardBody className={`p-4 p-md-5 register-card-body}`}>
                <div className="text-center mb-4 register-header">
                  <div className="brand-pill mb-3">
                    <span className="brand-dot"></span>
                    <span className="brand-label">MediPanel</span>
                  </div>
                  <h2 className="fw-bold mb-1">{t('Register')}</h2>
                  <p className="text-secondary mb-0">{t('Create your account')}</p>
                </div>

                <div className="steps-indicator mb-4">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className="step-item" key={index}>
                      <div className={`step-circle ${index + 1 === step ? 'active' : ''}`}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <CForm
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (step < 3) handleNext()
                    else handleRegister()
                  }}
                >
                  {renderStep()}

                  <div className="d-flex justify-content-between mt-4 register-primary-action">
                    {step > 1 && (
                      <CButton color="secondary" onClick={handlePrevious}>
                        {t('Previous')}
                      </CButton>
                    )}
                    {step === 1 && (
                      <CLink
                        style={{
                          color: 'var(--cui-primary)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        onClick={() => navigate('/login')}
                      >
                        {t('Go to login')}
                      </CLink>
                    )}
                    {step < 3 ? (
                      <CButton color="primary" onClick={handleNext}>
                        {t('Next')}
                      </CButton>
                    ) : (
                      <CButton color="success" onClick={handleRegister} disabled={apiLoading}>
                        {apiLoading ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : null}
                        {t('Register')}
                      </CButton>
                    )}
                  </div>
                </CForm>

                <p className="register-footer-note mb-0 mt-4">
                  {t('Protected access')} - MediPanel {currentYear}
                </p>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
      {alert && (
        <CAlert
          color={alert.type}
          className="alert-fixed register-card-alert register-card-alert-attention mb-3"
          role="alert"
        >
          {alert.message}
        </CAlert>
      )}
    </div>
  )
}

export default Register
