import React, { useEffect, useState } from 'react'

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
import bcrypt from 'bcryptjs'
import './styles/Profile.css' // Asegúrate de que la ruta sea correcta
import Notifications from '../../components/Notifications'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [alert, setAlert] = useState(null)

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Simula la ruta de la imagen cargada
      const newImagePath = `src/assets/images/avatars/${file.name}`
      console.log('Nueva ruta de la imagen:', newImagePath)
      setSelectedImage(newImagePath) // Guarda la nueva ruta

      // Actualiza la imagen en el servidor inmediatamente
      const updatedData = { ...formData, avatar: newImagePath }
      fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al actualizar la imagen en el servidor')
          }
          return response.json()
        })
        .then((data) => {
          console.log('Imagen actualizada en el servidor:', data)
          setUser(data) // Actualiza el estado del usuario con los datos del servidor
        })
        .catch((error) => console.error('Error al guardar la imagen:', error))
    }
  }

  useEffect(() => {
    const userId = localStorage.getItem('userId') // Obtén el ID del usuario autenticado
    if (!userId) {
      console.error('No user ID found in localStorage')
      return
    }

    // Fetch user data from the API
    fetch(`http://localhost:8000/users/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setUser(data)
        setFormData(data) // Initialize form data with user data
      })
      .catch((error) => console.error('Error fetching user data:', error))
  }, [])

  useEffect(() => {
    if (selectedImage) {
      console.log('Imagen seleccionada actualizada:', selectedImage)
    }
  }, [selectedImage])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSaveChanges = () => {
    const updatedData = { ...formData, avatar: selectedImage || user.avatar }
    console.log('Datos enviados al servidor:', updatedData)

    fetch(`http://localhost:8000/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        console.log('Estado de la respuesta:', response.status)
        return response.json()
      })
      .then((data) => {
        console.log('Respuesta del servidor:', data)
        setUser(data) // Actualiza el estado con los datos del servidor
        setModalVisible(false) // Cierra el modal después de guardar
      })
      .catch((error) => console.error('Error al guardar los cambios:', error))
  }

  if (!user) {
    return <div>Loading...</div>
  }
  const handleChangePassword = () => {
    setShowChangePasswordModal(true)
  }

  const handlePasswordChangeSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Notifications.showAlert(setAlert, 'Todos los campos son obligatorios.', 'danger')
    }
    if (newPassword !== confirmPassword) {
      return Notifications.showAlert(setAlert, 'Las contraseñas nuevas no coinciden.', 'warning')
    }

    try {
      const res = await fetch(`http://localhost:8000/users/${user.id}`)
      if (!res.ok) throw new Error('Usuario no encontrado.')

      const dbUser = await res.json()

      // Compara la contraseña ingresada con la almacenada (encriptada)
      const passwordMatch = await bcrypt.compare(currentPassword, dbUser.password)

      if (!passwordMatch) {
        return Notifications.showAlert(setAlert, 'La contraseña actual es incorrecta.', 'danger')
      }

      // Encripta la nueva contraseña antes de actualizarla
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // Actualiza la contraseña en la base de datos
      const updateRes = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dbUser, password: hashedNewPassword }),
      })

      if (!updateRes.ok) throw new Error('Error al actualizar la contraseña.')

      Notifications.showAlert(setAlert, 'La contraseña se ha actualizado correctamente.', 'success')

      // Limpia los campos y cierra el modal
      setShowChangePasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      Notifications.showAlert(setAlert, 'Hubo un error al cambiar la contraseña.', 'danger')
    }
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
              <p>{user.role_id}</p>
            </div>
          </div>

          <CContainer>
            <CRow className="space-component">
              <CCol md={6} className="d-flex align-items-stretch">
                <CCard className="inner-card">
                  <CCardBody>
                    <CCardTitle>Personal Information</CCardTitle>
                    <CListGroup flush>
                      <CListGroupItem>
                        <strong>Email:</strong> {user.email}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Phone:</strong> {user.phone}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Address:</strong> {user.address}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Birth Date:</strong> {user.birth_date}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Gender:</strong> {user.gender}
                      </CListGroupItem>
                    </CListGroup>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={6} className="d-flex align-items-stretch">
                <CCard className="inner-card">
                  <CCardBody>
                    <CCardTitle>Professional Information</CCardTitle>
                    <CListGroup flush>
                      <CListGroupItem>
                        <strong>Description:</strong> {user.description}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Specialty:</strong> {user.specialty}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Subspecialty:</strong> {user.subspecialty}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Years experience:</strong> {user.years_experience}
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
                onClick={() => setModalVisible(true)}
              >
                <CIcon icon={cilPencil} className="me-2" />
                Edit Information
              </CButton>
              <CButton
                color="primary"
                className="change-password-btn mx-2"
                style={{ width: 'auto' }}
                onClick={handleChangePassword}
              >
                <CIcon icon={cilLockLocked} className="me-2" width={17} height={17} />
                Change Password
              </CButton>
            </CRow>
          </CContainer>

          <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
            <CModalHeader>
              <CModalTitle>Edit Information</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <CFormInput
                type="text"
                name="first_name"
                label={<strong>First Name:</strong>}
                value={formData.first_name || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="last_name"
                label={<strong>Last Name:</strong>}
                value={formData.last_name || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="email"
                name="email"
                label={<strong>Email:</strong>}
                value={formData.email || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="phone"
                label={<strong>Phone:</strong>}
                value={formData.phone || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="address"
                label={<strong>Address:</strong>}
                value={formData.address || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="description"
                label={<strong>Description:</strong>}
                value={formData.description || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="specialty"
                label={<strong>Specialty:</strong>}
                value={formData.specialty || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="text"
                name="subspecialty"
                label={<strong>Subspecialty:</strong>}
                value={formData.subspecialty || ''}
                onChange={handleInputChange}
              />
              <CFormInput
                type="number"
                name="years_experience"
                label={<strong>Years of Experience:</strong>}
                value={formData.years_experience || ''}
                onChange={handleInputChange}
              />
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setModalVisible(false)}>
                <CIcon icon={cilExitToApp} className="me-2" />
                Close
              </CButton>
              <CButton color="primary" onClick={handleSaveChanges}>
                <CIcon icon={cilSave} className="me-2" />
                Save Changes
              </CButton>
            </CModalFooter>
          </CModal>
          <CModal
            alignment="center"
            visible={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
          >
            <CModalHeader>
              <CModalTitle>Change Password</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <CForm>
                <CInputGroup className="mb-2">
                  <CFormInput
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder="Current password"
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
                    placeholder="New password"
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
                    placeholder="Confirm new password"
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
                Cancel
              </CButton>
              <CButton color="primary" onClick={handlePasswordChangeSubmit}>
                Change Password
              </CButton>
            </CModalFooter>
          </CModal>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default Profile
