import React, { useEffect, useState, useRef } from 'react'

import {
  CCard,
  CCardBody,
  CCardTitle,
  CListGroup,
  CListGroupItem,
  CButton,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CContainer,
  CRow,
  CCol,
  CForm,
  CInputGroup,
  CInputGroupText,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilPencil, cilExitToApp, cilLockLocked, cilLockUnlocked } from '@coreui/icons'
import Select from 'react-select'
import { useTranslation } from 'react-i18next'
import './styles/Profile.css'
import Notifications from '../../components/Notifications'
import { formatDate } from '../../utils/dateUtils'
import { useDispatch } from 'react-redux'
import useApi from '../../hooks/useApi'

const Profile = () => {
  // Decodificador JWT simple (no seguro para producción, pero suficiente para frontend)
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
      return {}
    }
  }
  // Estados principales
  const [user, setUser] = useState(null)
  const [professionalType, setProfessionalType] = useState(null)
  const [professional, setProfessional] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [alert, setAlert] = useState(null)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  // Formulario de edición
  const [modalVisible, setModalVisible] = useState(false)
  const [formData, setFormData] = useState({})

  // Password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Select specialties & subspecialties
  const [specialtiesData, setSpecialtiesData] = useState([])
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [selectedSubspecialties, setSelectedSubspecialties] = useState([])

  // Leer token del localStorage
  const authToken = localStorage.getItem('authToken')
  // Decodificar el token para obtener el rol
  const tokenPayload = authToken ? parseJwt(authToken) : {}

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  }
  const { request, loading: apiLoading } = useApi()

  // Obtener perfil al cargar
  useEffect(() => {
    if (!authToken) return

    const fetchProfile = async () => {
      try {
        const res = await request('get', '/profile', null, headers)
        if (!res.success || !res.data) throw new Error('Error fetching profile')
        const data = res.data
        setUser(data)
        setProfessionalType(data.professional_type ? { name: data.professional_type } : null)
        setProfessional({
          biography: data.biography,
          years_of_experience: data.years_of_experience,
        })
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          biography: data.biography,
          years_experience: data.years_of_experience,
          specialty: data.specialties || '',
          subspecialty: data.subspecialties || '',
        })
        if (Array.isArray(data.specialties)) {
          setSelectedSpecialties(data.specialties.map((s) => ({ label: s.name, value: s.id })))
        }
        if (Array.isArray(data.subspecialties)) {
          setSelectedSubspecialties(
            data.subspecialties.map((s) => ({ label: s.name, value: s.id })),
          )
        }
      } catch (error) {
        Notifications.showAlert(setAlert, 'Error loading profile', 'danger')
      }
    }
    fetchProfile()
  }, [authToken])

  const getSpecialtyNames = () => {
    return selectedSpecialties.map((s) => s.label).join(', ') || '-'
  }

  const getSubspecialtyNames = () => {
    return selectedSubspecialties.map((s) => s.label).join(', ') || '-'
  }

  // Cargar opciones de specialties y subspecialties para los selects

  useEffect(() => {
    const fetchspecialties = async () => {
      try {
        const res = await request('get', '/auth/specialties', null, headers)
        if (!res.success || !res.data) throw new Error('Error fetching specialties')
        setSpecialtiesData(res.data)
      } catch (error) {
        console.error('Error fetching specialties:', error)
      }
    }
    fetchspecialties()
  }, [authToken])

  // Funciones auxiliares para mostrar nombres
  const specialtyOptions = specialtiesData
    .filter((item) => item.type === 'specialty')
    .map((item) => ({ value: item.id, label: item.name }))

  const subspecialtyOptions = specialtiesData
    .filter((item) => item.type === 'subspecialty')
    .map((item) => ({ value: item.id, label: item.name }))

  // Manejador para inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Editar info (abre modal)
  const handleEditInformation = () => setModalVisible(true)

  // Cambiar password (abre modal)
  const handleChangePassword = () => setShowChangePasswordModal(true)

  // Guardar cambios perfil
  const handleSaveChanges = async () => {
    try {
      // Combinar specialties y subspecialties
      const combinedSpecialties = [
        ...selectedSpecialties.map((s) => s.value),
        ...selectedSubspecialties.map((s) => s.value),
      ]

      // Solo enviar campos modificados respecto al usuario original
      const userData = {}
      if (formData.first_name !== user.first_name) userData.first_name = formData.first_name
      if (formData.last_name !== user.last_name) userData.last_name = formData.last_name
      if (formData.email !== user.email) userData.email = formData.email
      if (formData.phone !== user.phone) userData.phone = formData.phone
      if (formData.address !== user.address) userData.address = formData.address
      if (formData.birth_date !== user.birth_date) userData.birth_date = formData.birth_date
      if (formData.gender !== user.gender) userData.gender = formData.gender
      if (formData.status !== user.status) userData.status = formData.status

      // Detectar si es admin (role === 1) usando el token decodificado
      const isAdmin = tokenPayload.role === 1

      // Solo construir professionalData si NO es admin y hay datos profesionales
      let professionalData = null
      if (!isAdmin && professional) {
        professionalData = {}
        if (
          formData.biography !== undefined &&
          formData.biography !== null &&
          formData.biography !== professional?.biography &&
          formData.biography !== ''
        ) {
          professionalData.biography = formData.biography
        }
        if (
          formData.years_experience !== undefined &&
          formData.years_experience !== null &&
          Number(formData.years_experience) !== Number(professional?.years_of_experience)
        ) {
          professionalData.years_of_experience = Number(formData.years_experience)
        }
        if (
          Array.isArray(combinedSpecialties) &&
          JSON.stringify(combinedSpecialties) !==
            JSON.stringify([
              ...(Array.isArray(user.specialties) ? user.specialties.map((s) => s.id) : []),
              ...(Array.isArray(user.subspecialties) ? user.subspecialties.map((s) => s.id) : []),
            ])
        ) {
          professionalData.specialties = combinedSpecialties
        }
        // Si no hay cambios en professionalData, dejarlo como null
        if (Object.keys(professionalData).length === 0) professionalData = null
      }

      // No enviar objetos vacíos
      const payload = {}
      if (Object.keys(userData).length > 0) payload.userData = userData
      if (professionalData) payload.professionalData = professionalData

      if (Object.keys(payload).length === 0) {
        Notifications.showAlert(setAlert, 'No hay cambios para guardar', 'info')
        return
      }

      // 1. Actualizar con PUT
      const res = await request('put', '/profile', payload, headers)
      if (!res.success) {
        const errorMessage = res.message || 'Error al actualizar algún campo del perfil.'
        Notifications.showAlert(setAlert, errorMessage, 'danger')
        console.error('Error updating profile:', res.data) // Opcional: loguea los datos del error si existen
        return
      }
      Notifications.showAlert(setAlert, 'Perfil actualizado con éxito', 'success')
      setModalVisible(false)
      const profileRes = await request('get', '/profile', null, headers)
      if (!profileRes.success || !profileRes.data) {
        Notifications.showAlert(
          setAlert,
          'Perfil actualizado, pero hubo un error al obtener la nueva información.',
          'danger',
        )
        console.error('Error fetching profile after update:', profileRes.message)
        return
      }
      const updatedProfile = profileRes.data

      // 4. Actualizar todos los estados con la info completa
      setUser(updatedProfile)
      setProfessionalType(
        updatedProfile.professional_type ? { name: updatedProfile.professional_type } : null,
      )
      setProfessional(
        updatedProfile.biography || updatedProfile.years_of_experience
          ? {
              biography: updatedProfile.biography,
              years_of_experience: updatedProfile.years_of_experience,
            }
          : null,
      )
      setSelectedSpecialties(
        Array.isArray(updatedProfile.specialties)
          ? updatedProfile.specialties.map((s) => ({ label: s.name, value: s.id }))
          : [],
      )
      setSelectedSubspecialties(
        Array.isArray(updatedProfile.subspecialties)
          ? updatedProfile.subspecialties.map((s) => ({ label: s.name, value: s.id }))
          : [],
      )
      setFormData({
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
        biography: updatedProfile.biography,
        years_experience: updatedProfile.years_of_experience,
        specialty: updatedProfile.specialties || '',
        subspecialty: updatedProfile.subspecialties || '',
      })
      setSelectedImage(null) // Limpia preview de avatar
    } catch (error) {
      Notifications.showAlert(setAlert, 'Error al actualizar perfil', 'danger')
      console.error(error)
    }
  }

  // Manejo subida de imagen (solo preview y guardamos base64 para enviar)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result
      setSelectedImage(base64Image) // Muestra la imagen en preview localmente (si aplica)

      try {
        const res = await request('put', '/profile', { userData: { avatar: base64Image } }, headers)
        if (!res.success || !res.data) {
          throw new Error('Failed to update avatar')
        }
        const updatedUser = res.data
        dispatch({ type: 'setAvatar', avatar: updatedUser.avatar })
        if (!updatedUser.avatar) {
          console.error('Avatar no encontrado en la respuesta del backend')
        }
        Notifications.showAlert(setAlert, 'Avatar actualizado con éxito', 'success')
      } catch (error) {
        console.error('Error al actualizar avatar:', error)
        Notifications.showAlert(setAlert, 'Error al actualizar avatar', 'danger')
      }
    }

    reader.readAsDataURL(file)
  }

  // Cambiar contraseña
  const handlePasswordChangeSubmit = async () => {
    try {
      const res = await request(
        'put',
        '/profile/password',
        { currentPassword, newPassword, confirmPassword },
        headers,
      )
      if (!res.success) {
        const errorData = res.data || {}
        console.error('Error response from backend:', errorData)
        let errorMessage = ''
        if (errorData.issues && Array.isArray(errorData.issues)) {
          errorMessage = errorData.issues.map((issue) => issue.message).join('\n')
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else {
          errorMessage = 'Error desconocido al cambiar contraseña.'
        }
        Notifications.showAlert(setAlert, errorMessage, 'danger')
        return
      }
      Notifications.showAlert(setAlert, 'Contraseña actualizada con éxito', 'success')
      setShowChangePasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error inesperado:', error)
      Notifications.showAlert(setAlert, 'Error al cambiar contraseña', 'danger')
    }
  }
  if (!user) {
    return (
      <div className="contain">
        <div className="spinner"></div>
        <p className="text">Cargando perfil</p>
      </div>
    )
  }

  return (
    <CCard className="space-component">
      <CCardBody>
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-container">
                <img
                  src={selectedImage || user.avatar}
                  alt="User Avatar"
                  className="avatar-image"
                />
                <CButton
                  color="light"
                  className="edit-avatar-button"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <CIcon icon={cilPencil} />
                </CButton>
                {alert && (
                  <CAlert color={alert.type} className="text-center alert-fixed">
                    {alert.message}
                  </CAlert>
                )}
                <input
                  type="file"
                  id="file-input"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <div className="profile-name">
              <h2>{`${user.first_name} ${user.last_name}`}</h2>
              <p>{professionalType ? professionalType.name : ''}</p>
            </div>
          </div>

          <CContainer>
            <CRow className="space-component">
              <CCol md={6} className="d-flex align-items-stretch">
                <CCard className="inner-card">
                  <CCardBody>
                    <CCardTitle>{t('Personal Information')}</CCardTitle>
                    <CListGroup flush>
                      <CListGroupItem>
                        <strong>{t('Email')}:</strong> {user.email}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Phone')}:</strong> {user.phone}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Address')}:</strong> {user.address}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Birth Date')}:</strong> <strong>{t('Birth Date')}:</strong>{' '}
                        {formatDate(user.birth_date, 'DATE')}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Gender')}:</strong> {user.gender}
                      </CListGroupItem>
                    </CListGroup>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={6} className="d-flex align-items-stretch">
                <CCard className="inner-card">
                  <CCardBody>
                    <CCardTitle>{t('Professional Information')}</CCardTitle>
                    <CListGroup flush>
                      <CListGroupItem>
                        <strong>{t('Type')}:</strong>{' '}
                        {professionalType ? professionalType.name : '-'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Biography')}:</strong>{' '}
                        {professional?.biography ? professional.biography : '-'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Years of experience')}:</strong>{' '}
                        {professional?.years_of_experience ? professional.years_of_experience : '-'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Specialties')}:</strong> {getSpecialtyNames()}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>{t('Subspecialties')}:</strong> {getSubspecialtyNames()}
                      </CListGroupItem>
                    </CListGroup>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
            <CRow className="space-component d-flex justify-content-center">
              <CButton
                color="primary"
                className="update-button mx-2"
                style={{ width: 'auto' }}
                onClick={handleEditInformation}
              >
                <CIcon icon={cilPencil} className="me-2" />
                {t('Edit Information')}
              </CButton>
              <CButton
                color="primary"
                className="change-password-btn mx-2"
                style={{ width: 'auto' }}
                onClick={handleChangePassword}
              >
                <CIcon icon={cilLockLocked} className="me-2" width={17} height={17} />
                {t('Change Password')}
              </CButton>
            </CRow>
          </CContainer>

          {/* Modal Editar Información */}
          <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
            <CModalHeader>
              <CModalTitle>{t('Edit Information')}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <CFormInput
                type="text"
                name="first_name"
                label={<strong>{t('First name')}:</strong>}
                value={formData.first_name ?? ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="last_name"
                label={<strong>{t('Last name')}:</strong>}
                value={formData.last_name ?? ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="email"
                name="email"
                label={<strong>{t('Email')}:</strong>}
                value={formData.email ?? ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="phone"
                label={<strong>{t('Phone')}:</strong>}
                value={formData.phone ?? ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="address"
                label={<strong>{t('Address')}:</strong>}
                value={formData.address ?? ''}
                onChange={handleInputChange}
              />
              {/* Mostrar campos profesionales solo si NO es admin */}
              {tokenPayload.role !== 1 && (
                <>
                  <CFormInput
                    className="mb-2"
                    type="text"
                    name="biography"
                    label={<strong>{t('Biography')}:</strong>}
                    value={
                      formData.biography === null || formData.biography === undefined
                        ? ''
                        : formData.biography
                    }
                    onChange={handleInputChange}
                  />
                  <Select
                    isMulti
                    name="specialty"
                    options={specialtyOptions}
                    value={selectedSpecialties}
                    onChange={(selected) => setSelectedSpecialties(selected)}
                    className="mb-2"
                    classNamePrefix="react-select"
                    placeholder="Selecciona especialidades"
                  />
                  <Select
                    isMulti
                    name="subspecialty"
                    options={subspecialtyOptions}
                    value={selectedSubspecialties}
                    onChange={(selected) => setSelectedSubspecialties(selected)}
                    className="mb-2"
                    classNamePrefix="react-select"
                    placeholder="Selecciona subespecialidades"
                  />
                  <CFormInput
                    type="number"
                    name="years_experience"
                    label={<strong>{t('Years of Experience')}:</strong>}
                    value={
                      formData.years_experience != null &&
                      formData.years_experience !== '' &&
                      !Number.isNaN(Number(formData.years_experience))
                        ? String(formData.years_experience)
                        : ''
                    }
                    onChange={handleInputChange}
                  />
                </>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setModalVisible(false)}>
                <CIcon icon={cilExitToApp} className="me-2" />
                {t('Close')}
              </CButton>
              <CButton color="primary" onClick={handleSaveChanges}>
                <CIcon icon={cilSave} className="me-2" />
                {t('Save Changes')}
              </CButton>
            </CModalFooter>
          </CModal>

          {/* Modal Cambiar Contraseña */}
          <CModal
            alignment="center"
            visible={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
          >
            <CModalHeader>
              <CModalTitle>{t('Change Password')}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <CForm>
                <CInputGroup className="mb-2">
                  <CFormInput
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder={t('Current password')}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <CInputGroupText
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={showPasswords.current ? cilLockUnlocked : cilLockLocked} />
                  </CInputGroupText>
                </CInputGroup>
                <CInputGroup className="mb-2">
                  <CFormInput
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder={t('New password')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <CInputGroupText
                    onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={showPasswords.new ? cilLockUnlocked : cilLockLocked} />
                  </CInputGroupText>
                </CInputGroup>
                <CInputGroup>
                  <CFormInput
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder={t('Confirm new password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <CInputGroupText
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={showPasswords.confirm ? cilLockUnlocked : cilLockLocked} />
                  </CInputGroupText>
                </CInputGroup>
              </CForm>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setShowChangePasswordModal(false)}>
                {t('Cancel')}
              </CButton>
              <CButton color="primary" onClick={handlePasswordChangeSubmit}>
                {t('Change Password')}
              </CButton>
            </CModalFooter>
          </CModal>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default Profile
