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
  CSpinner,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CCardHeader
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilInfo, cilTrash, cilPlus, cilSave, cilX, cilHeart, cilNotes, cilImage, cilListHighPriority } from '@coreui/icons'
import Notifications from '../../components/Notifications'
import useApi from '../../hooks/useApi'
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
  const getToken = () => localStorage.getItem('authToken')
  const { request, loading: apiLoading } = useApi()
  useEffect(() => {
    const fetchMedicalHistory = async (id) => {
      const { data, success } = await request('get', `/medical_record/${id}`, null, {
        Authorization: `Bearer ${getToken()}`,
      })
      if (success && data) {
        setMedicalHistory(data)
        seteditedMedicalHistory({
          ...data,
          follow_up_date: data.follow_up_date
            ? new Date(data.follow_up_date).toISOString().slice(0, 16)
            : '',
        })
      }
      setLoading(false)
    }
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
        t('Cannot save because the medical history ID is not valid.'),
        'danger',
      )
      return
    }

    let changedFields = getChangedFields(medicalHistory, editedMedicalHistory)

    // Convertir imagen a base64 si es necesario
    if (editedMedicalHistory.attachment_image instanceof File) {
      changedFields.image = await fileToBase64(editedMedicalHistory.attachment_image)
    }

    // --- CORRECCIÓN TIPOS DE DATOS ---
    const numericFields = [
      'weight',
      'height',
      'body_mass_index',
      'heart_rate',
      'respiratory_rate',
      'temperature',
      'oxygen_saturation',
    ]

    numericFields.forEach((field) => {
      if (changedFields[field] !== undefined) {
        changedFields[field] = changedFields[field] ? Number(changedFields[field]) : null
      }
    })

    // --- CORRECCIÓN FECHA ---
    if (changedFields.follow_up_date) {
      changedFields.follow_up_date = new Date(changedFields.follow_up_date)
    }

    if (Object.keys(changedFields).length === 0) {
      Notifications.showAlert(setAlert, t('No changes to save.'), 'info')
      return
    }

    const { data, success } = await request(
      'put',
      `/medical_record/${medicalHistory.id}`,
      changedFields,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    )
    if (success && data) {
      const updated = data.medicalRecord ? data.medicalRecord : data
      const merged = {
        ...medicalHistory,
        ...updated,
        image: updated.image || medicalHistory.image || '',
      }
      setMedicalHistory(merged)
      seteditedMedicalHistory({
        ...merged,
        follow_up_date: merged.follow_up_date
          ? new Date(merged.follow_up_date).toISOString().slice(0, 16)
          : '',
        attachment_image: merged.image || '',
      })
      Notifications.showAlert(setAlert, t('Changes saved successfully!'), 'info')
    } else {
      Notifications.showAlert(setAlert, t('Error saving changes.'), 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteMedicalHistory = async () => {
    const { success } = await request('delete', `/medical_record/${medicalHistory.id}`, null, {
      Authorization: `Bearer ${getToken()}`,
    })
    if (success) {
      Notifications.showAlert(setAlert, t('Medical History Deleted Successfully'), 'warning', 3500)
      setTimeout(() => {
        navigate('/medicalHistory')
      }, 5000)
    } else {
      Notifications.showAlert(
        setAlert,
        t('Failed to delete the medical history.'),
        'danger',
      )
    }
    setDeleteModalVisible(false)
  }

  const handleFieldsDisabled = () => {
    setFieldsDisabled((prev) => !prev)
  }

  if (!medicalHistory && (loading || apiLoading)) return null // Prevent crash if no data yet but still loading basic info
  if (!medicalHistory) return <p>{t('Medical history not found.')}</p>

  return (
    <CRow className="justify-content-center edit-medical-history-page">
      <CCol md={12} className="mb-4">
        <h3 className="fw-bold text-primary-emphasis d-flex align-items-center">
          <CIcon icon={cilPencil} size="lg" className="me-2" />
          {t('Edit Medical History')}
        </h3>
        <p className="text-muted small">{t('Medical history')}: #{medicalHistory.id}</p>
        <hr className="my-3 opacity-10" />
      </CCol>

      {/* Sidebar Info Card */}
      <CCol lg={3}>
        <div className="sticky-lg-top" style={{ top: '1.5rem', zIndex: 10 }}>
          <CCard className="mb-3 shadow-sm border-0 overflow-hidden">
            <div className="p-1" style={{ backgroundColor: 'var(--cui-primary)' }}></div>
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-3">{t('Patient Information')}</h6>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Patient')}</label>
                <div className="fw-bold fs-5 text-primary-emphasis">{medicalHistory?.patient_full_name}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Professional')}</label>
                <div className="fw-medium">{medicalHistory?.professional_full_name}</div>
              </div>
              <div className="mb-1">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Created at')}</label>
                <div className="small">{medicalHistory?.created_at ? new Date(medicalHistory.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              {medicalHistory?.updated_at && (
                <div className="mt-2 text-muted-subtle" style={{ fontSize: '0.75rem' }}>
                  <strong>{t('Last Updated')}:</strong> {new Date(medicalHistory.updated_at).toLocaleString()}
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody className="p-2">
              <CButton
                color="danger"
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => setDeleteModalVisible(true)}
              >
                <CIcon icon={cilTrash} className="me-2" />
                {t('Delete medical history')}
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CCol>

      {/* Main Form Content */}
      <CCol lg={9}>
        {alert && (
          <CAlert color={alert.type} className="alert-fixed">
            {alert.message}
          </CAlert>
        )}

        <CForm className="medical-history-form">
            {/* Section 1: Clinical History */}
            <CCard className="mb-4 shadow-sm border-0">
              <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
                <CIcon icon={cilNotes} className="me-2 text-primary" size="lg" />
                <h5 className="mb-0 fw-bold">{t('Clinical History')}</h5>
              </CCardHeader>
              <CCardBody className="p-4">
                <CRow className="g-4">
                  <CCol md={6}>
                    <CFormTextarea
                      label={t('Reason for visit')}
                      value={editedMedicalHistory.reason_for_visit || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, reason_for_visit: e.target.value })}
                      disabled={fieldsDisabled}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormTextarea
                      label={t('Symptoms')}
                      value={editedMedicalHistory.symptoms || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, symptoms: e.target.value })}
                      disabled={fieldsDisabled}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Current illness history')}
                      value={editedMedicalHistory.current_illness_history || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, current_illness_history: e.target.value })}
                      disabled={fieldsDisabled}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Physical exam')}
                      value={editedMedicalHistory.physical_exam || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, physical_exam: e.target.value })}
                      disabled={fieldsDisabled}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Section 2: Vital Signs */}
            <CCard className="mb-4 shadow-sm border-0 overflow-hidden">
              <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
                <CIcon icon={cilHeart} className="me-2 text-primary" size="lg" />
                <h5 className="mb-0 fw-bold">{t('Vital Signs')}</h5>
              </CCardHeader>
              <div style={{ backgroundColor: 'rgba(56, 73, 219, 0.03)', margin: '0 24px 24px 24px', borderRadius: '12px' }}>
                <CCardBody className="p-4">
                  <CRow className="g-3">
                    {[
                      { name: 'weight', label: t('Weight'), unit: 'kg' },
                      { name: 'height', label: t('Height'), unit: 'cm' },
                      { name: 'body_mass_index', label: t('BMI') },
                      { name: 'blood_pressure', label: t('BP'), type: 'text' },
                      { name: 'heart_rate', label: t('Heart Rate'), unit: 'bpm' },
                      { name: 'respiratory_rate', label: t('RR'), unit: 'bpm' },
                      { name: 'temperature', label: t('Temp'), unit: '°C' },
                      { name: 'oxygen_saturation', label: t('O2 Sat'), unit: '%' },
                    ].map((field) => (
                      <CCol xs={6} md={3} key={field.name}>
                        <CFormInput
                          type={field.type || "number"}
                          label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                          value={editedMedicalHistory[field.name] || ''}
                          onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, [field.name]: e.target.value })}
                          disabled={fieldsDisabled}
                          size="sm"
                        />
                      </CCol>
                    ))}
                  </CRow>
                </CCardBody>
              </div>
            </CCard>

            {/* Section 3: Diagnosis & Treatment */}
            <CCard className="mb-4 shadow-sm border-0">
              <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
                <CIcon icon={cilListHighPriority} className="me-2 text-primary" size="lg" />
                <h5 className="mb-0 fw-bold">{t('Diagnosis & Treatment')}</h5>
              </CCardHeader>
              <CCardBody className="p-4">
                <CRow className="g-4">
                  <CCol md={6}>
                    <CFormTextarea
                      label={t('Diagnosis')}
                      value={editedMedicalHistory.diagnosis || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, diagnosis: e.target.value })}
                      disabled={fieldsDisabled}
                      className="fw-bold"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormTextarea
                      label={t('Differential diagnosis')}
                      value={editedMedicalHistory.differential_diagnosis || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, differential_diagnosis: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Treatment')}
                      value={editedMedicalHistory.treatment || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, treatment: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Treatment plan')}
                      value={editedMedicalHistory.treatment_plan || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, treatment_plan: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Medications prescribed')}
                      value={editedMedicalHistory.medications_prescribed || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, medications_prescribed: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Section 4: Tests & Follow-up */}
            <CCard className="mb-4 shadow-sm border-0">
              <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
                <CIcon icon={cilInfo} className="me-2 text-primary" size="lg" />
                <h5 className="mb-0 fw-bold">{t('Tests & Evolution')}</h5>
              </CCardHeader>
              <CCardBody className="p-4">
                <CRow className="g-4">
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Laboratory tests requested')}
                      value={editedMedicalHistory.laboratory_tests_requested || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, laboratory_tests_requested: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Imaging tests requested')}
                      value={editedMedicalHistory.imaging_tests_requested || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, imaging_tests_requested: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Test instructions')}
                      value={editedMedicalHistory.test_instructions || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, test_instructions: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormInput
                      type="datetime-local"
                      label={t('Follow up date')}
                      value={editedMedicalHistory.follow_up_date || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, follow_up_date: e.target.value })}
                      className="mb-3"
                      disabled={fieldsDisabled}
                    />
                  </CCol>
                  <CCol md={12}>
                    <CFormTextarea
                      label={t('Evolution notes')}
                      value={editedMedicalHistory.evolution_notes || ''}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, evolution_notes: e.target.value })}
                      disabled={fieldsDisabled}
                      style={{ resize: 'none' }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Section 5: Additional & Image */}
            <CCard className="mb-5 shadow-sm border-0">
              <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
                <CIcon icon={cilImage} className="me-2 text-primary" size="lg" />
                <h5 className="mb-0 fw-bold">{t('Additional Data')}</h5>
              </CCardHeader>
              <CCardBody className="p-4">
                <CFormTextarea
                  id="general_notes"
                  label={t('General Notes')}
                  value={editedMedicalHistory.general_notes || ''}
                  onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, general_notes: e.target.value })}
                  className="mb-4"
                  disabled={fieldsDisabled}
                  style={{ resize: 'none' }}
                />

                <CRow className="align-items-start g-4">
                  <CCol md={6}>
                    <CFormInput
                      type="file"
                      id="attachment_image"
                      label={t('Upload Image')}
                      onChange={(e) => seteditedMedicalHistory({ ...editedMedicalHistory, attachment_image: e.target.files[0] })}
                      disabled={fieldsDisabled}
                      className="mb-2"
                    />
                  </CCol>
                  {medicalHistory.image && (
                    <CCol md={6} className="text-center">
                      <label className="d-block small text-muted text-uppercase fw-bold mb-2">{t('Current Image')}</label>
                      <div
                        className="img-preview-container rounded border shadow-sm p-1 d-inline-block bg-white translate-hover"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.open(medicalHistory.image, '_blank')}
                      >
                        <img src={medicalHistory.image} alt={t('Current')} className="img-fluid rounded" style={{ maxHeight: '200px' }} />
                      </div>
                    </CCol>
                  )}
                </CRow>
              </CCardBody>
            </CCard>

            {/* Form Actions */}
            <div className="d-flex justify-content-end gap-2 mb-5">
              {fieldsDisabled ? (
                <>
                  <CButton color="secondary" variant="ghost" onClick={() => navigate('/medicalHistory')}>
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
                    if (medicalHistory) {
                      seteditedMedicalHistory({
                        ...medicalHistory,
                        follow_up_date: medicalHistory.follow_up_date
                          ? new Date(medicalHistory.follow_up_date).toISOString().slice(0, 16)
                          : '',
                      });
                    }
                  }}>
                    {t('Cancel')}
                  </CButton>
                  <CButton color="primary" onClick={saveChanges} className="px-4 shadow-sm">
                    <CIcon icon={cilSave} className="me-2" />
                    {t('Save Changes')}
                  </CButton>
                </>
              )}
            </div>
        </CForm>
      </CCol>

      {/* Delete Modal */}
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
