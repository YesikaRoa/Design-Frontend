import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './styles/EditAppointment.css'
import AsyncSelect from 'react-select/async'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useTranslation } from 'react-i18next'

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
  CFormSelect,
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

const EditAppointment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [appointment, setAppointment] = useState(null)
  const [editedAppointment, setEditedAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (location.state?.appointment) {
      const newAppointment = location.state.appointment
      setAppointment(newAppointment)
      setEditedAppointment({ ...newAppointment })
      localStorage.setItem('selectedAppointment', JSON.stringify(newAppointment))
    } else {
      const storedAppointment = localStorage.getItem('selectedAppointment')
      if (storedAppointment) {
        const parsed = JSON.parse(storedAppointment)
        setAppointment(parsed)
        setEditedAppointment({ ...parsed })
      }
    }
    setLoading(false)
    setCitiesLoading(true)
    fetch('http://localhost:8000/city')
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => setCities([]))
      .finally(() => setCitiesLoading(false))
  }, [location])

  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const saveChanges = async () => {
    if (!appointment || !appointment.id) {
      console.error('The appointment ID is not valid.')
      Notifications.showAlert(
        setAlert,
        'Cannot save because the appointment ID is not valid.',
        'danger',
      )
      return
    }
    try {
      const response = await fetch(`http://localhost:8000/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedAppointment),
      })
      if (response.ok) {
        const updatedAppointment = await response.json()
        setAppointment(updatedAppointment)
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

  const deleteAppointment = async () => {
    try {
      const response = await fetch(`http://localhost:8000/appointments/${appointment.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        Notifications.showAlert(setAlert, 'Appointment deleted successfully.', 'success', 5000)
        setTimeout(() => {
          navigate('/appointments') // Redirige después de 5 segundos
        }, 5000) // Asegúrate de que coincida con la duración de la notificación
      } else {
        throw new Error('Error deleting the appointment.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'There was an error deleting the appointment.', 'danger')
    }
    setDeleteModalVisible(false)
  }

  if (loading) return <p>Loading appointment...</p>
  if (!appointment) return <p>Appointment not found.</p>

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">{t('Edit Appointment')}</h3>
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
              {t('Patient')}: {appointment.patient_id}
            </CCardTitle>
            <CCardText>
              <strong>{t('Professional')}:</strong> {appointment.professional_id} <br />
              <strong>{t('Status')}:</strong> {appointment.status} <br />
              <strong>{t('Date')}:</strong> {new Date(appointment.scheduled_at).toLocaleString()}{' '}
              <br />
              <strong>{t('City')}:</strong> {appointment.city} <br />
              <strong>{t('Reason for visit')}:</strong> {appointment.reason_for_visit}
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <CCardTitle className="text-primary">{t('Change Status')}</CCardTitle>
            <div className="mb-3">
              <CFormSelect
                id="quickStatusChange"
                value={appointment.status}
                onChange={async (e) => {
                  const updatedStatus = e.target.value
                  try {
                    const updatedAppointment = { ...appointment, status: updatedStatus }
                    const response = await fetch(
                      `http://localhost:8000/appointments/${appointment.id}`,
                      {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedAppointment),
                      },
                    )
                    if (response.ok) {
                      const result = await response.json()
                      setAppointment(result)
                      Notifications.showAlert(
                        setAlert,
                        `Status changed to ${updatedStatus}.`,
                        'success',
                      )
                    } else {
                      throw new Error('Error changing the appointment status.')
                    }
                  } catch (error) {
                    console.error('Error changing status:', error)
                    Notifications.showAlert(
                      setAlert,
                      'There was an error changing the appointment status.',
                      'danger',
                    )
                  }
                }}
              >
                <option value="pending">{t('Pending')}</option>
                <option value="confirmed">{t('Confirmed')}</option>
                <option value="canceled">{t('Canceled')}</option>
                <option value="completed">{t('Completed')}</option>
              </CFormSelect>
            </div>
            <CButton color="danger" onClick={() => setDeleteModalVisible(true)} className="mt-2">
              <CIcon icon={cilTrash} className="me-2" />
              Delete Appointment
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8}>
        <CCard className=" mb-4">
          <CCardBody>
            <CCardTitle>{t('Edit Information')}</CCardTitle>

            {/* Scheduled At con DateTimePicker */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label={t('Scheduled At')}
                value={
                  editedAppointment.scheduled_at ? new Date(editedAppointment.scheduled_at) : null
                }
                onChange={(newValue) =>
                  setEditedAppointment({
                    ...editedAppointment,
                    scheduled_at: newValue ? newValue.toISOString() : '',
                  })
                }
                format="dd/MM/yyyy HH:mm"
                slotProps={{
                  textField: {
                    variant: 'standard',
                    fullWidth: true,
                    className: 'mb-3',
                    disabled: fieldsDisabled,
                  },
                }}
                disabled={fieldsDisabled}
              />
            </LocalizationProvider>

            {/* Status */}
            <CFormSelect
              id="status"
              floatingLabel={t('Status')}
              value={editedAppointment.status}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, status: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="pending">{t('Pending')}</option>
              <option value="confirmed">{t('Confirmed')}</option>
              <option value="canceled">{t('Canceled')}</option>
              <option value="completed">{t('Completed')}</option>
            </CFormSelect>

            {/* City con AsyncSelect */}
            <div className="mb-3">
              <AsyncSelect
                cacheOptions
                defaultOptions={cities.slice(0, 5).map((city) => ({
                  label: city.name,
                  value: city.id,
                }))}
                value={
                  cities
                    .map((city) => ({
                      label: city.name,
                      value: city.id,
                    }))
                    .find((opt) => String(opt.value) === String(editedAppointment.city_id)) || null
                }
                loadOptions={async (inputValue) =>
                  cities
                    .filter((city) =>
                      !inputValue
                        ? true
                        : city.name.toLowerCase().startsWith(inputValue.toLowerCase()),
                    )
                    .map((city) => ({
                      label: city.name,
                      value: city.id,
                    }))
                }
                onChange={(option) =>
                  setEditedAppointment({
                    ...editedAppointment,
                    city_id: option ? option.value : '',
                  })
                }
                placeholder={citiesLoading ? 'Cargando ciudades...' : 'Buscar ciudad...'}
                isClearable
                isDisabled={fieldsDisabled || citiesLoading}
                styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
              />
            </div>

            <CFormTextarea
              id="notes"
              floatingLabel={t('Notes')}
              value={editedAppointment.notes}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, notes: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormTextarea
              id="reason_for_visit"
              floatingLabel={t('Reason for visit')}
              value={editedAppointment.reason_for_visit}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, reason_for_visit: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormSelect
              id="has_medical_record"
              floatingLabel={t('Has Medical Record')}
              value={
                editedAppointment.has_medical_record === true ||
                editedAppointment.has_medical_record === 'true'
                  ? 'true'
                  : editedAppointment.has_medical_record === false ||
                      editedAppointment.has_medical_record === 'false'
                    ? 'false'
                    : ''
              }
              onChange={(e) =>
                setEditedAppointment({
                  ...editedAppointment,
                  has_medical_record: e.target.value === 'true',
                })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="">Seleccione una opción</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </CFormSelect>
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
          <CModalTitle>{t('Delete Appointment')}</CModalTitle>
        </CModalHeader>
        <CModalBody>{t('Are you sure you want to delete this appointment?')}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            {t('Cancel')}
          </CButton>
          <CButton color="danger" onClick={deleteAppointment}>
            {t('Delete')}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default EditAppointment
