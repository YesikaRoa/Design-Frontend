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

const UserDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

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

  useEffect(() => {
    fetch('http://localhost:8000/role')
      .then((res) => res.json())
      .then(setRoles)
  }, [])
  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const normalizeNameForURL = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const save = async () => {
    try {
      const getResponse = await fetch(`http://localhost:8000/users/${user.id}`)
      if (!getResponse.ok) throw new Error('Error al obtener los datos actuales del usuario.')
      const currentUser = await getResponse.json()

      const updatedFields = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
      }

      const updatedUser = { ...currentUser, ...updatedFields }

      const putResponse = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })

      if (putResponse.ok) {
        const result = await putResponse.json()
        setUser(result)
        Notifications.showAlert(setAlert, 'Changes successfully saved!', 'success')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }

    handleFieldsDisabled()
  }

  useEffect(() => {
    setUser(null)
    setLoading(true)

    if (location.state && location.state.user) {
      const newUser = location.state.user
      setUser(newUser)
      localStorage.setItem('selectedUser', JSON.stringify(newUser))

      const firstName = newUser.first_name.split(' ')[0]
      const normalizedFirstName = normalizeNameForURL(firstName)
      navigate(`/users/${normalizedFirstName}`, { replace: true })
    } else {
      const storedUser = localStorage.getItem('selectedUser')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      setLoading(false)
    }
  }, [location, navigate])

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
    } catch (err) {
      console.error(err)
      Notifications.showAlert(setAlert, 'Hubo un error al cambiar la contraseña.', 'danger')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      const updatedUser = { ...user, status: updatedStatus }

      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result)
        Notifications.showAlert(
          setAlert,
          `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
          'success',
        )
      } else {
        Notifications.showAlert(setAlert, 'Failed to update user status.', 'danger')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      Notifications.showAlert(setAlert, 'An error occurred while updating user status.', 'danger')
    }
  }

  const handleDeleteUser = async () => {
    try {
      // 1. Eliminar usuario
      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'DELETE',
      })

      // 2. Eliminar en cascada según el rol
      if (user.role_id === '2') {
        // Eliminar professional y sus especialidades
        const profRes = await fetch(`http://localhost:8000/professionals?user_id=${user.id}`)
        const professionals = await profRes.json()
        for (const prof of professionals) {
          // Eliminar TODOS los professional_specialty relacionados a este professional
          const specRes = await fetch(
            `http://localhost:8000/professional_specialty?professional_id=${prof.id}`,
          )
          const specialties = await specRes.json()
          // ...existing code...
          if (Array.isArray(specialties)) {
            await Promise.all(
              specialties.map((s) =>
                fetch(`http://localhost:8000/professional_specialty/${s.id}`, {
                  method: 'DELETE',
                }),
              ),
            )
          }
          // ...existing code...
          // Eliminar professional
          await fetch(`http://localhost:8000/professionals/${prof.id}`, { method: 'DELETE' })
        }
      } else if (user.role_id === '3') {
        // Eliminar TODOS los patient relacionados
        const patRes = await fetch(`http://localhost:8000/patient?user_id=${user.id}`)
        const patients = await patRes.json()
        if (Array.isArray(patients)) {
          for (const p of patients) {
            await fetch(`http://localhost:8000/patient/${p.id}`, { method: 'DELETE' })
          }
        }
        // NO elimines professional_specialty aquí, no corresponde a un patient
      }

      if (response.ok) {
        Notifications.showAlert(setAlert, 'User has been deleted successfully.', 'success')
        setDeleteModalVisible(false)
        navigate('/users')
      } else {
        Notifications.showAlert(setAlert, 'Failed to delete user.', 'danger')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(setAlert, 'An error occurred while deleting the user.', 'danger')
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
