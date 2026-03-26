import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../users/styles/UserDetails.css'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import {
  CButton,
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CFormInput,
  CSpinner,
  CAlert,
} from '@coreui/react'
import { cilPencil, cilSave, cilTrash, cilBan, cilCheckCircle } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
import useApi from '../../hooks/useApi'

const UserDetails = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedPatientId, setselectedPatientId] = useState(null)
  const { t } = useTranslation()
  const token = localStorage.getItem('authToken')
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    phone: '',
    medical_data: '',
  })
  const { request } = useApi()

  const fetchPatient = async (profId) => {
    setLoading(true)
    try {
      const res = await request('get', `/patients/${profId}`, null, {
        Authorization: `Bearer ${token}`,
      })
      if (!res.success || !res.data) throw new Error('Error fetching patient')
      setPatient(res.data)
      setUser(res.data)
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        address: res.data.address || '',
        phone: res.data.phone || '',
        medical_data: res.data.medical_data || '',
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const save = async () => {
    try {
      // Comparar campos para enviar solo los modificados (opcional, pero mejor enviar lo necesario)
      const changes = {}
      for (const key in formData) {
        if (formData[key] !== user[key]) {
          changes[key] = formData[key]
        }
      }

      if (Object.keys(changes).length === 0) {
        Notifications.showAlert(setAlert, t('No changes to save.'), 'info')
        setFieldsDisabled(true)
        return
      }

      const resPut = await request('put', `/patients/${user.id}`, changes, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })

      if (!resPut.success) {
        const errorData = resPut.error || {}
        if (errorData.issues && Array.isArray(errorData.issues)) {
          const messages = errorData.issues
            .map((issue) => issue.message)
            .join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(
            setAlert,
            resPut.message || t('Error saving changes.'),
            'danger',
          )
        }
        return
      }

      const updatedUser = resPut.data.user || resPut.data
      setUser(updatedUser)
      setPatient(updatedUser)
      Notifications.showAlert(setAlert, t('Changes saved successfully!'), 'info')
      setFieldsDisabled(true)
    } catch (error) {
      console.error('Error saving changes:', error)
      Notifications.showAlert(setAlert, t('Error saving changes.'), 'danger')
    }
  }

  useEffect(() => {
    if (id) fetchPatient(id)
  }, [id])

  if (!user && (loading)) return null
  if (!user) return <p>No se encontró el usuario.</p>

  const handleToggleStatus = async (patientId) => {
    try {
      const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      const res = await request(
        'put',
        `/patients/status/${patientId}`,
        { newStatus: updatedStatus },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (!res.success) {
        const errorData = res.data || {}
        if (errorData.issues && Array.isArray(errorData.issues)) {
          const messages = errorData.issues
            .map((issue) =>
              Array.isArray(issue.path)
                ? `${issue.path.join('.')} - ${issue.message}`
                : `${issue.path || 'unknown'} - ${issue.message}`,
            )
            .join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(
            setAlert,
            errorData.message || 'Failed to update user status.',
            'danger',
          )
        }
        return
      }
      setUser({ ...user, status: res.data.user.status })
      Notifications.showAlert(
        setAlert,
        `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
        'info',
      )
    } catch (error) {
      console.error('Error toggling user status:', error)
      Notifications.showAlert(setAlert, 'An error occurred while updating user status.', 'danger')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/patients/${user.id}`, null, headers)

      if (res.success) {
        // --- SOLUCIÓN AQUÍ ---
        // 1. Forzamos el foco fuera de la modal ANTES de cualquier cambio de estado
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        // Movemos el foco al body para asegurar que no quede nada en la modal
        document.body.focus()

        // 2. Cerramos la modal
        setDeleteModalVisible(false)

        Notifications.showAlert(setAlert, t('Patient deleted successfully.'), 'warning')

        // 3. Esperamos a que la animación de salida termine antes de navegar
        setTimeout(() => {
          navigate('/patients')
        }, 150) // Subimos un poco a 150ms
      } else {
        // ... manejo de error
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const openDeleteModal = (userId) => {
    setselectedPatientId(userId)
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">{t('Patient Details')}</h3>
        {alert && (
          <CAlert color={alert.type} className="alert-fixed">
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
                {user.status === 'Active' ? t('Deactivate Patient') : t('Activate Patient')}
              </span>
              <span
                className="card-actions-link delete-user"
                onClick={() => openDeleteModal(user.id)}
              >
                <CIcon icon={cilTrash} className="me-2" width={24} height={24} />
                {t('Delete Patient')}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8} className="space-component">
        <CCard>
          <CCardBody>
            <CCardTitle>{t('Edit Patient')}</CCardTitle>
            <CFormInput
              type="text"
              id="first_name"
              floatingLabel={t('First name')}
              value={formData.first_name}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="last_name"
              floatingLabel={t('Last name')}
              value={formData.last_name}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="email"
              id="email"
              floatingLabel={t('Email')}
              value={formData.email}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="address"
              floatingLabel={t('Address')}
              value={formData.address}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="phone"
              floatingLabel={t('Phone')}
              value={formData.phone}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="medical_data"
              floatingLabel={t('Medical Data')}
              value={formData.medical_data}
              onChange={handleInputChange}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : save}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? t('Edit') : t('Save')}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        unmountOnClose={true}
        onClose={() => {
          // Cuando el usuario cierra con la "X" o Cancelar
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          setDeleteModalVisible(false)
        }}
        onConfirm={handleDeleteUser}
        title={t('Delete User')}
        message={t('Are you sure you want to delete this user? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default UserDetails
