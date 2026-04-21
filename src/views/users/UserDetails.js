import React, { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'
import { useLocation, useNavigate } from 'react-router-dom'
import '../appointments/styles/EditAppointment.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
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
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false })
  const [roles, setRoles] = useState([])
  const token = localStorage.getItem('authToken')
  const { request, loading: apiLoading } = useApi()

  useEffect(() => {
    request('get', '/users/roles').then(({ data }) => setRoles(data || []))
  }, [])

  const handleFieldsDisabled = () => setFieldsDisabled((prev) => !prev)

  const save = async () => {
    try {
      const updatedFields = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phone').value.trim(),
      }
      const { data: result, success, error: apiError } = await request(
        'put', `/users/${user.id}`, updatedFields,
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (!success) {
        if (apiError && apiError.issues && Array.isArray(apiError.issues)) {
          Notifications.showAlert(setAlert, apiError.issues.map((i) => i.message).join('\n'), 'danger')
        } else {
          Notifications.showAlert(setAlert, (apiError && apiError.message) || 'Error al actualizar el usuario.', 'danger')
        }
        return
      }
      setUser(result.user)
      Notifications.showAlert(setAlert, t('Changes saved successfully!'), 'info')
    } catch (error) {
      Notifications.showAlert(setAlert, error.message || 'Ocurrió un error al guardar los cambios.', 'danger')
    } finally {
      handleFieldsDisabled()
    }
  }

  useEffect(() => {
    setUser(null)
    setLoading(true)
    let userId = null
    if (params && params['*']) userId = params['*']
    else if (params && params.id) userId = params.id
    else {
      const hash = window.location.hash
      const match = hash.match(/\/users\/(\d+)/)
      if (match) userId = match[1]
    }
    if (!userId && location.state && location.state.user) userId = location.state.user.id
    if (!userId) { setLoading(false); setUser(null); return }
    if (typeof userId === 'string' && userId.startsWith('users/')) userId = userId.replace('users/', '')
    request('get', `/users/${userId}`, null, { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` })
      .then(({ data, status }) => {
        if (status === 403 || status === 401) { navigate('/404'); return }
        if (!data) return
        setUser(data.user ? data.user : data)
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false))
  }, [location, navigate, token, params])

  if (!user && (loading || apiLoading)) return null
  if (!user) return <p>No se encontró el usuario.</p>

  const handlePasswordChangeSubmit = async () => {
    if (!currentPassword || !newPassword) return Notifications.showAlert(setAlert, t('All fields are required.'), 'danger')
    try {
      const { success, error: apiError } = await request(
        'put', `/users/password/${user.id}`,
        { currentPassword, newPassword },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (!success) {
        if (apiError && apiError.issues && Array.isArray(apiError.issues)) {
          Notifications.showAlert(setAlert, apiError.issues.map((i) => i.message).join('\n'), 'danger')
        } else {
          Notifications.showAlert(setAlert, (apiError && apiError.message) || 'Error al cambiar la contraseña.', 'danger')
        }
        return
      }
      Notifications.showAlert(setAlert, t('Password updated successfully.'), 'info')
      setShowChangePasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      Notifications.showAlert(setAlert, t('Error updating password.'), 'danger')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      const { data: result, success, error: apiError } = await request(
        'put', `/users/status/${userId}`, { newStatus: updatedStatus },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (success) {
        setUser(result.user)
        Notifications.showAlert(setAlert, `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`, 'info')
      } else {
        Notifications.showAlert(setAlert, (apiError && apiError.message) || 'Failed to update user status.', 'danger')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, t('Error updating status.'), 'danger')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const { success, error: apiError, data: result } = await request(
        'delete', `/users/${user.id}`, null, { Authorization: `Bearer ${token}` },
      )
      if (success) {
        Notifications.showAlert(setAlert, (result && result.message) || 'User deleted successfully.', 'warning')
        setDeleteModalVisible(false)
        navigate('/users')
      } else {
        Notifications.showAlert(setAlert, (apiError && apiError.message) || 'Failed to delete user.', 'danger')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, 'An unexpected error occurred while trying to delete the user.', 'danger')
    }
  }

  const roleName = roles.find((r) => String(r.id) === String(user.role_id))?.name || user.role_id

  return (
    <CRow className="justify-content-center">
      {/* Alert — rendered at CRow level so position:fixed works correctly */}
      {alert && (
        <CAlert color={alert.type} className="alert-fixed">
          {alert.message}
        </CAlert>
      )}

      {/* Page Header */}
      <CCol md={12} className="mb-4">
        <h3 className="fw-bold text-primary-emphasis d-flex align-items-center">
          <CIcon icon={cilPencil} size="lg" className="me-2" />
          {t('Edit User')}
        </h3>
        <p className="text-muted small">{t('User Details')} #{user.id}</p>
        <hr className="my-3 opacity-10" />
      </CCol>

      {/* Sidebar */}
      <CCol lg={3}>
        <div className="sticky-lg-top" style={{ top: '1.5rem', zIndex: 10 }}>
          <CCard className="mb-3 shadow-sm border-0 overflow-hidden">
            <div className="p-1" style={{ backgroundColor: 'var(--cui-primary)' }}></div>
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-3">
                {t('User information')}
              </h6>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Full Name')}</label>
                <div className="fw-bold fs-5 text-primary-emphasis">
                  {user.first_name} {user.last_name}
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Email')}</label>
                <div className="fw-medium">{user.email}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Role')}</label>
                <div className="fw-medium">{roleName}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Status')}</label>
                <div className="fw-medium">{user.status}</div>
              </div>
              <div className="mb-1">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Created at')}</label>
                <div className="small">{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              {user.updated_at && (
                <div className="mt-2 text-muted-subtle" style={{ fontSize: '0.75rem' }}>
                  <strong>{t('Last Updated')}:</strong> {new Date(user.updated_at).toLocaleString()}
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody className="p-2 d-flex flex-column gap-1">
              <CButton
                color="secondary"
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <CIcon icon={cilLockLocked} className="me-2" />
                {t('Change Password')}
              </CButton>
              <CButton
                color={user.status === 'Active' ? 'warning' : 'success'}
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => handleToggleStatus(user.id)}
              >
                <CIcon icon={user.status === 'Active' ? cilBan : cilCheckCircle} className="me-2" />
                {user.status === 'Active' ? t('Deactivate User') : t('Activate User')}
              </CButton>
              <CButton
                color="danger"
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => setDeleteModalVisible(true)}
              >
                <CIcon icon={cilTrash} className="me-2" />
                {t('Delete User')}
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CCol>

      {/* Main Form */}
      <CCol lg={9}>
        <CForm>
          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
              <CIcon icon={cilUser} className="me-2 text-primary" size="lg" />
              <h5 className="mb-0 fw-bold">{t('Personal Information')}</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="firstName"
                    label={t('First name')}
                    defaultValue={user.first_name}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="lastName"
                    label={t('Last name')}
                    defaultValue={user.last_name}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="email"
                    id="email"
                    label={t('Email')}
                    defaultValue={user.email}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="phone"
                    label={t('Phone')}
                    defaultValue={user.phone}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={12}>
                  <CFormInput
                    type="text"
                    id="address"
                    label={t('Address')}
                    defaultValue={user.address}
                    disabled={fieldsDisabled}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 mb-5">
            {fieldsDisabled ? (
              <>
                <CButton color="secondary" variant="ghost" onClick={() => navigate('/users')}>
                  {t('Cancel')}
                </CButton>
                <CButton color="primary" onClick={handleFieldsDisabled} className="px-4">
                  <CIcon icon={cilPencil} className="me-2" />
                  {t('Edit')}
                </CButton>
              </>
            ) : (
              <>
                <CButton color="secondary" variant="outline" onClick={() => {
                  handleFieldsDisabled();
                  if (user) {
                    document.getElementById('firstName').value = user.first_name || '';
                    document.getElementById('lastName').value = user.last_name || '';
                    document.getElementById('email').value = user.email || '';
                    document.getElementById('phone').value = user.phone || '';
                    document.getElementById('address').value = user.address || '';
                  }
                }}>
                  {t('Cancel')}
                </CButton>
                <CButton color="primary" onClick={save} className="px-4 shadow-sm">
                  <CIcon icon={cilSave} className="me-2" />
                  {t('Save Changes')}
                </CButton>
              </>
            )}
          </div>
        </CForm>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteUser}
        title={t('Delete User')}
        message={t('Are you sure you want to delete this user? This action cannot be undone.')}
      />

      <CModal alignment="center" visible={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
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
                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={showPasswords.current ? cilLockUnlocked : cilLockLocked} />
              </CInputGroupText>
            </CInputGroup>
            <CInputGroup>
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
    </CRow>
  )
}

export default UserDetails
