import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './styles/UserDetails.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CFormInput,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import {
  cilPencil,
  cilSave,
  cilTrash,
  cilBan,
  cilCheckCircle,
  cilLockLocked,
  cilLockUnlocked,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
import bcrypt from 'bcryptjs'
import { useTranslation } from 'react-i18next'

import { useParams } from 'react-router-dom'

const UserDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useParams()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false })

  const [roles, setRoles] = useState([])
  const token = localStorage.getItem('authToken')

  useEffect(() => {
    fetch('https://aplication-backend-production-872f.up.railway.app/api/users/roles')
      .then((res) => res.json())
      .then(setRoles)
  }, [])
  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }
  const save = async () => {
    try {
      // Obtener datos actualizados del formulario
      const updatedFields = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phone').value.trim(),
      }

      // Enviar solicitud PUT al backend
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Añade token si es necesario
          },
          body: JSON.stringify(updatedFields),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from backend:', errorData)

        if (errorData.issues && Array.isArray(errorData.issues)) {
          // Muestra los errores específicos de validación en el frontend
          const messages = errorData.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(
            setAlert,
            errorData.message || 'Error al actualizar el usuario.',
            'danger',
          )
        }
        return
      }

      const result = await response.json()

      // Actualizar usuario en el frontend
      setUser(result.user)
      Notifications.showAlert(setAlert, '¡Cambios guardados con éxito!', 'success')
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      Notifications.showAlert(
        setAlert,
        error.message || 'Ocurrió un error al guardar los cambios.',
        'danger',
      )
    } finally {
      handleFieldsDisabled() // Asegúrate de deshabilitar los campos después de la operación
    }
  }

  // Nuevo useEffect para proteger la ruta y obtener el usuario por ID
  useEffect(() => {
    setUser(null)
    setLoading(true)

    // Obtener el ID de la URL (React Router v6+)
    let userId = null
    if (params && params['*']) {
      // Si usas rutas catch-all
      userId = params['*']
    } else if (params && params.id) {
      userId = params.id
    } else {
      // Extraer el ID del hash si es necesario
      const hash = window.location.hash
      const match = hash.match(/\/users\/(\d+)/)
      if (match) {
        userId = match[1]
      }
    }

    if (!userId && location.state && location.state.user) {
      userId = location.state.user.id
    }

    if (!userId) {
      setLoading(false)
      setUser(null)
      return
    }

    // Corregir si userId viene como 'users/69' o similar
    if (typeof userId === 'string' && userId.startsWith('users/')) {
      userId = userId.replace('users/', '')
    }

    fetch(`https://aplication-backend-production-872f.up.railway.app/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          navigate('/404')
          return null
        }
        if (!res.ok) {
          navigate('/404')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setUser(data.user ? data.user : data)
      })
      .catch(() => {
        navigate('/404')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [location, navigate, token, params])

  if (loading) return <p>Cargando usuario...</p>
  if (!user) return <p>No se encontró el usuario.</p>

  const handleChangePassword = () => {
    setShowChangePasswordModal(true)
  }

  const handlePasswordChangeSubmit = async () => {
    if (!currentPassword || !newPassword) {
      return Notifications.showAlert(setAlert, 'Todos los campos son obligatorios.', 'danger')
    }

    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/users/password/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Agrega el token si es necesario
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      )

      // Lee el cuerpo de la respuesta una sola vez
      const result = await response.json()

      if (!response.ok) {
        if (result.issues && Array.isArray(result.issues)) {
          // Errores específicos de validación de Zod
          const messages = result.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          // Otros errores generales
          Notifications.showAlert(
            setAlert,
            result.message || 'Error al cambiar la contraseña.',
            'danger',
          )
        }
        return
      }

      Notifications.showAlert(setAlert, 'La contraseña se ha actualizado correctamente.', 'success')

      // Limpia los campos y cierra el modal
      setShowChangePasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error('Error al cambiar la contraseña:', err)
      Notifications.showAlert(setAlert, 'Hubo un error al cambiar la contraseña.', 'danger')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active'

      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/users/status/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Asegúrate de incluir el token si es necesario
          },
          body: JSON.stringify({ newStatus: updatedStatus }),
        },
      )

      const result = await response.json()

      if (response.ok) {
        setUser(result.user) // Asegúrate de que `result.user` contenga los datos actualizados
        Notifications.showAlert(
          setAlert,
          `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
          'success',
        )
      } else {
        const errorMessage = result.message || 'Failed to update user status.'
        Notifications.showAlert(setAlert, errorMessage, 'danger')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      Notifications.showAlert(setAlert, 'An error occurred while updating user status.', 'danger')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/users/${user.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`, // Si usas autenticación
          },
        },
      )

      const result = await response.json()

      if (response.ok) {
        Notifications.showAlert(setAlert, result.message || 'User deleted successfully.', 'success')
        setDeleteModalVisible(false)
        navigate('/users') // Navega de regreso a la lista de usuarios
      } else {
        Notifications.showAlert(
          setAlert,
          result.message || 'Failed to delete user. Please try again.',
          'danger',
        )
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(
        setAlert,
        'An unexpected error occurred while trying to delete the user.',
        'danger',
      )
    }
  }

  const openDeleteModal = (userId) => {
    setSelectedUserId(userId)
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">User Details</h3>
        {alert && (
          <CAlert color={alert.type} className="text-center alert-fixed">
            {alert.message}
          </CAlert>
        )}
      </CCol>
      <CCol md={4}>
        <CCard>
          <CCardBody>
            <CCardTitle className="text-primary">
              {user.first_name} {user.last_name}
            </CCardTitle>
            <CCardText>
              <strong>{t('Email')}:</strong> {user.email} <br />
              <strong>{t('Role')}:</strong>{' '}
              {roles.find((r) => String(r.id) === String(user.role_id))?.name || user.role_id}{' '}
              <br />
              <strong>{t('Status')}:</strong> {user.status} <br />
              <strong>{t('Created at')}:</strong> {new Date(user.created_at).toLocaleDateString()}{' '}
              <br />
              <strong>{t('Last Updated')}:</strong> {new Date(user.updated_at).toLocaleDateString()}
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <div className="card-actions-container">
              <span className="card-actions-link change-password" onClick={handleChangePassword}>
                <CIcon icon={cilLockLocked} className="me-2" width={24} height={24} />
                {t('Change Password')}
              </span>
              <span
                className={`card-actions-link ${user.status === 'Active' ? 'deactivate-user' : 'activate-user'}`}
                onClick={() => handleToggleStatus(user.id)}
              >
                <CIcon
                  icon={user.status === 'Active' ? cilBan : cilCheckCircle}
                  className="me-2"
                  width={24}
                  height={24}
                />
                {user.status === 'Active' ? t('Deactivate User') : t('Activate User')}
              </span>
              <span
                className="card-actions-link delete-user"
                onClick={() => openDeleteModal(user.id)}
              >
                <CIcon icon={cilTrash} className="me-2" width={24} height={24} />
                {t('Delete User')}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8}>
        <CCard>
          <CCardBody>
            <CCardTitle>{t('Edit User')}</CCardTitle>
            <CFormInput
              type="text"
              id="firstName"
              floatingLabel={t('First name')}
              defaultValue={user.first_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="lastName"
              floatingLabel={t('Last name')}
              defaultValue={user.last_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="email"
              id="email"
              floatingLabel={t('Email')}
              defaultValue={user.email}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="address"
              floatingLabel={t('Address')}
              defaultValue={user.address}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="phone"
              floatingLabel={t('Phone')}
              defaultValue={user.phone}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : save}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? t('Edit User') : t('Save')}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteUser}
        title="Delete user"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

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
                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={showPasswords.current ? cilLockUnlocked : cilLockLocked} />
              </CInputGroupText>
            </CInputGroup>
            <CInputGroup>
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
    </CRow>
  )
}

export default UserDetails
