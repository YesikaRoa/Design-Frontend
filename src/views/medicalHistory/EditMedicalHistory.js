import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../appointments/styles/EditAppointment.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CFormInput,
  CFormTextarea,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilSave, cilTrash } from '@coreui/icons'
import Notifications from '../../components/Notifications'
import { useTranslation } from 'react-i18next'

const EditMedicalHistory = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [medicalHistory, setMedicalHistory] = useState(null)
  const [editedMedicalHistory, seteditedMedicalHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (location.state?.medicalHistory) {
      const newMedicalHistory = location.state.medicalHistory
      setMedicalHistory(newMedicalHistory)
      seteditedMedicalHistory({
        ...newMedicalHistory,
        created_at: newMedicalHistory.created_at
          ? new Date(newMedicalHistory.created_at).toISOString().slice(0, 16)
          : '',
      })
      localStorage.setItem('selectedMedicalHistory', JSON.stringify(newMedicalHistory))
    } else {
      const storedMedicalHistory = localStorage.getItem('selectedMedicalHistory')
      if (storedMedicalHistory) {
        const parsed = JSON.parse(storedMedicalHistory)
        setMedicalHistory(parsed)
        seteditedMedicalHistory({
          ...parsed,
          created_at: parsed.created_at
            ? new Date(parsed.created_at).toISOString().slice(0, 16)
            : '',
        })
      }
    }
    setLoading(false)
  }, [location])

  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const saveChanges = async () => {
    if (!medicalHistory || !medicalHistory.id) {
      console.error('The medical history ID is not valid.')
      Notifications.showAlert(
        setAlert,
        'Cannot save because the medical history ID is not valid.',
        'danger',
      )
      return
    }
    try {
      const response = await fetch(`http://localhost:8000/medical_records/${medicalHistory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedMedicalHistory),
      })
      if (response.ok) {
        const updatedmedicalHistory = await response.json()
        setMedicalHistory(updatedmedicalHistory)
        Notifications.showAlert(setAlert, 'Changes saved successfully!', 'success')
      } else {
        throw new Error('Error saving changes.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteMedicalHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/medical_records/${medicalHistory.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        Notifications.showAlert(setAlert, 'Medical history deleted successfully.', 'success', 5000)
        setTimeout(() => {
          navigate('/medicalHistory') // Redirige después de 5 segundos
        }, 5000) // Asegúrate de que coincida con la duración de la notificación
      } else {
        throw new Error('Error deleting the medical history.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(
        setAlert,
        'There was an error deleting the medical history.',
        'danger',
      )
    }
    setDeleteModalVisible(false)
  }

  if (loading) return <p>Loading medical history...</p>
  if (!medicalHistory) return <p>Medical history not found.</p>

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">{t('Edit Medical History')}</h3>
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
              {t('Patient')}: {medicalHistory.patient}
            </CCardTitle>
            <CCardText>
              <strong>{t('Professional')}:</strong> {medicalHistory.professional} <br />
              <strong>{t('Date')}:</strong> {new Date(medicalHistory.created_at).toLocaleString()}{' '}
              <br />
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <CButton
              color="danger"
              onClick={() => setDeleteModalVisible(true)}
              className="mt-2 text-center"
            >
              <CIcon icon={cilTrash} className="me-2" />
              {t('Delete medical history')}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardBody>
            <CCardTitle>{t('Edit Information')}</CCardTitle>

            <CFormInput
              type="datetime-local"
              id="created_at"
              floatingLabel={t('Created at')}
              value={editedMedicalHistory.created_at}
              onChange={(e) =>
                seteditedMedicalHistory({ ...editedMedicalHistory, created_at: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />

            <CFormTextarea
              id="general_notes"
              floatingLabel={t('General Notes')}
              value={editedMedicalHistory.general_notes}
              onChange={(e) =>
                seteditedMedicalHistory({ ...editedMedicalHistory, general_notes: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />

            <CFormInput
              type="file"
              id="attachment_image"
              label={t('Attachment Image')}
              onChange={(e) =>
                seteditedMedicalHistory({
                  ...editedMedicalHistory,
                  attachment_image: e.target.files[0],
                })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />

            <CFormInput
              type="file"
              id="attachment_document"
              label={t('Attachment Document')}
              onChange={(e) =>
                seteditedMedicalHistory({
                  ...editedMedicalHistory,
                  attachment_document: e.target.files[0],
                })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />

            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : saveChanges}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? t('Edit') : t('Save')}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <CModal
        alignment="center"
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>{t('Delete medical history')}</CModalTitle>
        </CModalHeader>
        <CModalBody>{t('Are you sure you want to delete this medical history?')}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            {t('Cancel')}
          </CButton>
          <CButton color="danger" onClick={deleteMedicalHistory}>
            {t('Delete')}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default EditMedicalHistory
