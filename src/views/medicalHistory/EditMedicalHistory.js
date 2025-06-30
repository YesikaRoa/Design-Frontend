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
import { format } from 'date-fns'

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
  const getToken = () => localStorage.getItem('authToken')
  useEffect(() => {
    const fetchMedicalHistory = async (id) => {
      try {
        const response = await fetch(`http://localhost:3000/api/medical_record/${id}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setMedicalHistory(data)
          seteditedMedicalHistory({
            ...data,
            created_at: data.created_at ? new Date(data.created_at).toISOString().slice(0, 16) : '',
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching medical history:', error)
        setLoading(false)
      }
    }

    // Eliminar uso de localStorage, siempre consulta el backend
    if (location.state?.medicalHistory?.id) {
      fetchMedicalHistory(location.state.medicalHistory.id)
    } else {
      setLoading(false)
    }
  }, [location])

  // Utilidad para detectar cambios
  const getChangedFields = (original, edited) => {
    const changed = {}
    Object.keys(edited).forEach((key) => {
      if (key === 'created_at') return // No enviar created_at
      if (key === 'attachment_image') return // No enviar el file directamente
      if (edited[key] !== original[key]) {
        changed[key] = edited[key]
      }
    })
    return changed
  }

  // Utilidad para convertir File a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const saveChanges = async () => {
    if (!medicalHistory || !medicalHistory.id) {
      Notifications.showAlert(
        setAlert,
        'Cannot save because the medical history ID is not valid.',
        'danger',
      )
      return
    }

    let changedFields = getChangedFields(medicalHistory, editedMedicalHistory)

    // Convertir imagen a base64 si es necesario
    if (editedMedicalHistory.attachment_image instanceof File) {
      changedFields.image = await fileToBase64(editedMedicalHistory.attachment_image)
    }

    // --- CORRECCIÓN FECHA ---
    // Si el usuario cambió la fecha, renombrar y convertir a Date
    if (changedFields.created_at) {
      changedFields.create_at = new Date(changedFields.created_at)
      delete changedFields.created_at
    }

    if (Object.keys(changedFields).length === 0) {
      Notifications.showAlert(setAlert, 'No changes to save.', 'info')
      return
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/medical_record/${medicalHistory.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(changedFields),
        },
      )

      if (response.ok) {
        const result = await response.json()
        const updated = result.medicalRecord ? result.medicalRecord : result
        const merged = {
          ...medicalHistory,
          ...updated,
          image: updated.image || medicalHistory.image || '',
        }
        setMedicalHistory(merged)
        seteditedMedicalHistory({
          ...merged,
          attachment_image: merged.image || '',
        })
        Notifications.showAlert(setAlert, 'Changes saved successfully!', 'success')
      } else {
        throw new Error('Error saving changes.')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteMedicalHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/medical_record/${medicalHistory.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      )
      if (response.ok) {
        Notifications.showAlert(setAlert, 'Medical history deleted successfully.', 'success', 5000)
        setTimeout(() => {
          navigate('/medicalHistory') // Redirige después de 5 segundos
        }, 5000)
      } else {
        throw new Error('Error deleting the medical history.')
      }
    } catch (error) {
      Notifications.showAlert(
        setAlert,
        'There was an error deleting the medical history.',
        'danger',
      )
    }
    setDeleteModalVisible(false)
  }

  const handleFieldsDisabled = () => {
    setFieldsDisabled((prev) => !prev)
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
              {t('Patient')}: {medicalHistory?.patient_full_name || 'N/A'}
            </CCardTitle>
            <CCardText>
              <strong>{t('Professional')}:</strong>{' '}
              {medicalHistory?.professional_full_name || 'N/A'} <br />
              <strong>{t('Date')}:</strong>{' '}
              {medicalHistory?.created_at
                ? new Date(medicalHistory.created_at).toLocaleString()
                : 'N/A'}{' '}
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
            {medicalHistory.image && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>{t('Current Image')}:</strong>
                <div>
                  <img
                    src={medicalHistory.image}
                    alt="Current"
                    style={{
                      width: 180,
                      height: 180,
                      objectFit: 'cover',
                      marginTop: 10,
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            )}
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
