import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
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
} from '@coreui/react'
import { cilPencil, cilSave, cilTrash, cilBan, cilCheckCircle, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
import useApi from '../../hooks/useApi'

const EditPatient = () => {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const { t } = useTranslation()
  const token = localStorage.getItem('authToken')
  const { id } = useParams()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    phone: '',
    medical_data: '',
  })
  const { request } = useApi()

  const fetchPatient = async (patientId) => {
    setLoading(true)
    try {
      const res = await request('get', `/patients/${patientId}`, null, {
        Authorization: `Bearer ${token}`,
      })
      if (!res.success || !res.data) throw new Error('Error fetching patient')
      setPatient(res.data)
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

  const handleFieldsDisabled = () => setFieldsDisabled((prev) => !prev)

  const save = async () => {
    try {
      const changes = {}
      for (const key in formData) {
        if (formData[key] !== patient[key]) {
          changes[key] = formData[key]
        }
      }
      if (Object.keys(changes).length === 0) {
        Notifications.showAlert(setAlert, t('No changes to save.'), 'info')
        setFieldsDisabled(true)
        return
      }
      const resPut = await request('put', `/patients/${patient.id}`, changes, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      if (!resPut.success) {
        const errorData = resPut.error || {}
        if (errorData.issues && Array.isArray(errorData.issues)) {
          const messages = errorData.issues.map((issue) => issue.message).join('\n')
          Notifications.showAlert(setAlert, messages, 'danger')
        } else {
          Notifications.showAlert(setAlert, resPut.message || t('Error saving changes.'), 'danger')
        }
        return
      }
      const updatedPatient = resPut.data.user || resPut.data
      setPatient(updatedPatient)
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

  if (!patient && loading) return null
  if (!patient) return <p>{t('Patient not found.')}</p>

  const handleToggleStatus = async (patientId) => {
    try {
      const updatedStatus = patient.status === 'Active' ? 'Inactive' : 'Active'
      const res = await request(
        'put',
        `/patients/status/${patientId}`,
        { newStatus: updatedStatus },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (!res.success) {
        Notifications.showAlert(setAlert, 'Failed to update patient status.', 'danger')
        return
      }
      setPatient({ ...patient, status: res.data.user.status })
      Notifications.showAlert(
        setAlert,
        `Patient has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
        'info',
      )
    } catch (error) {
      Notifications.showAlert(setAlert, 'An error occurred while updating patient status.', 'danger')
    }
  }

  const handleDeletePatient = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/patients/${patient.id}`, null, headers)
      if (res.success) {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        document.body.focus()
        setDeleteModalVisible(false)
        Notifications.showAlert(setAlert, t('Patient deleted successfully.'), 'warning')
        setTimeout(() => navigate('/patients'), 150)
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
    }
  }

  return (
    <CRow className="justify-content-center">
      {/* Alert — at CRow level so position:fixed works correctly */}
      {alert && (
        <CAlert color={alert.type} className="alert-fixed">
          {alert.message}
        </CAlert>
      )}

      {/* Page Header */}
      <CCol md={12} className="mb-4">
        <h3 className="fw-bold text-primary-emphasis d-flex align-items-center">
          <CIcon icon={cilPencil} size="lg" className="me-2" />
          {t('Edit Patient')}
        </h3>
        <p className="text-muted small">{t('Patient')} #{patient.id}</p>
        <hr className="my-3 opacity-10" />
      </CCol>

      {/* Sidebar */}
      <CCol lg={3}>
        <div className="sticky-lg-top" style={{ top: '1.5rem', zIndex: 10 }}>
          <CCard className="mb-3 shadow-sm border-0 overflow-hidden">
            <div className="p-1" style={{ backgroundColor: 'var(--cui-primary)' }}></div>
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-3">
                {t('Patient Information')}
              </h6>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Full Name')}</label>
                <div className="fw-bold fs-5 text-primary-emphasis">
                  {patient.first_name} {patient.last_name}
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Email')}</label>
                <div className="fw-medium">{patient.email}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Status')}</label>
                <div className="fw-medium">{patient.status}</div>
              </div>
              <div className="mb-1">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Created at')}</label>
                <div className="small">{patient.created_at ? new Date(patient.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              {patient.updated_at && (
                <div className="mt-2 text-muted-subtle" style={{ fontSize: '0.75rem' }}>
                  <strong>{t('Last Updated')}:</strong> {new Date(patient.updated_at).toLocaleString()}
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody className="p-2 d-flex flex-column gap-1">
              <CButton
                color={patient.status === 'Active' ? 'warning' : 'success'}
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => handleToggleStatus(patient.id)}
              >
                <CIcon icon={patient.status === 'Active' ? cilBan : cilCheckCircle} className="me-2" />
                {patient.status === 'Active' ? t('Deactivate Patient') : t('Activate Patient')}
              </CButton>
              <CButton
                color="danger"
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => setDeleteModalVisible(true)}
              >
                <CIcon icon={cilTrash} className="me-2" />
                {t('Delete Patient')}
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
                    id="first_name"
                    floatingLabel={t('First name')}
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="last_name"
                    floatingLabel={t('Last name')}
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="email"
                    id="email"
                    floatingLabel={t('Email')}
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="phone"
                    floatingLabel={t('Phone')}
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={12}>
                  <CFormInput
                    type="text"
                    id="address"
                    floatingLabel={t('Address')}
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={12}>
                  <CFormInput
                    type="text"
                    id="medical_data"
                    floatingLabel={t('Medical Data')}
                    value={formData.medical_data}
                    onChange={handleInputChange}
                    disabled={fieldsDisabled}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 mb-5">
            <CButton color="secondary" variant="ghost" onClick={() => navigate('/patients')}>
              {t('Cancel')}
            </CButton>
            {fieldsDisabled ? (
              <CButton color="primary" onClick={handleFieldsDisabled} className="px-4">
                <CIcon icon={cilPencil} className="me-2" />
                {t('Edit')}
              </CButton>
            ) : (
              <div className="d-flex gap-2">
                <CButton color="secondary" variant="outline" onClick={handleFieldsDisabled}>
                  {t('Cancel')}
                </CButton>
                <CButton color="primary" onClick={save} className="px-4 shadow-sm">
                  <CIcon icon={cilSave} className="me-2" />
                  {t('Save Changes')}
                </CButton>
              </div>
            )}
          </div>
        </CForm>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        unmountOnClose={true}
        onClose={() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          setDeleteModalVisible(false)
        }}
        onConfirm={handleDeletePatient}
        title={t('Delete Patient')}
        message={t('Are you sure you want to delete this patient? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default EditPatient
