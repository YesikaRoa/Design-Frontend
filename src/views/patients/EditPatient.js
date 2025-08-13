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
  const [medicalData, setMedicalData] = useState('')

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
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const save = async () => {
    try {
      // Obtener los datos actuales del usuario
      const resGet = await request('get', `/patients/${user.id}`, null, {
        Authorization: `Bearer ${token}`,
      })
      if (!resGet.success || !resGet.data)
        throw new Error('Error al obtener los datos actuales del usuario.')
      const currentData = resGet.data
      // Extraer valores del formulario
      const updatedFields = {
        first_name: document.getElementById('firstName').value || null,
        last_name: document.getElementById('lastName').value || null,
        email: document.getElementById('email').value || null,
        address: document.getElementById('address').value || null,
        phone: document.getElementById('phone').value || null,
        medical_data: medicalData || null,
      }
      // Comparar campos actualizados con datos actuales para enviar solo los modificados
      const changes = {}
      for (const key in updatedFields) {
        if (updatedFields[key] && updatedFields[key] !== currentData[key]) {
          changes[key] = updatedFields[key]
        }
      }
      // Validar si hay cambios
      if (Object.keys(changes).length === 0) {
        Notifications.showAlert(setAlert, 'No se realizaron cambios.', 'info')
        return
      }
      // Enviar datos al backend
      const resPut = await request('put', `/patients/${user.id}`, changes, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      if (!resPut.success) {
        const errorData = resPut.data || {}
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
            errorData.message || 'Error al guardar los cambios.',
            'danger',
          )
        }
        return
      }
      setUser(resPut.data.user)
      Notifications.showAlert(setAlert, 'Cambios guardados exitosamente.', 'success')
    } catch (error) {
      console.error('Error saving changes:', error)
      Notifications.showAlert(setAlert, 'Hubo un error al guardar los cambios.', 'danger')
    }
    handleFieldsDisabled()
  }

  useEffect(() => {
    if (id) fetchPatient(id)
  }, [id])

  if (loading) return <p>Cargando usuario...</p>
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
        'success',
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
        Notifications.showAlert(setAlert, 'Paciente eliminado con éxito.', 'success')
        setDeleteModalVisible(false)
        navigate('/patients')
      } else {
        const errorData = res.data || {}
        Notifications.showAlert(
          setAlert,
          errorData.message || 'No se pudo eliminar el Paciente.',
          'danger',
        )
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(setAlert, 'Ocurrió un error al eliminar el paciente', 'danger')
    }
  }

  const openDeleteModal = (userId) => {
    setselectedPatientId(userId)
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">Patient Details</h3>
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
            <CFormInput
              type="text"
              id="medicalData"
              floatingLabel={t('Medical Data')}
              defaultValue={user.medical_data}
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
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteUser}
        title={t('Delete user')}
        message={t('Are you sure you want to delete this user? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default UserDetails
