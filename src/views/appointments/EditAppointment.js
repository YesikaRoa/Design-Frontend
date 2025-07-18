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
  const token = localStorage.getItem('authToken')

  useEffect(() => {
    setLoading(true)
    const storedAppointment = localStorage.getItem('selectedAppointment')
    let parsed = null
    if (storedAppointment) {
      parsed = JSON.parse(storedAppointment)
      setAppointment(parsed)
      setEditedAppointment({ ...parsed })
    } else if (location.state?.appointment) {
      const newAppointment = location.state.appointment
      parsed = newAppointment
      setAppointment(newAppointment)
      setEditedAppointment({ ...newAppointment })
      localStorage.setItem('selectedAppointment', JSON.stringify(newAppointment))
    }
    setLoading(false)

    setCitiesLoading(true)
    fetch('https://aplication-backend-production-872f.up.railway.app/api/appointments/cities')
      .then((res) => res.json())
      .then(async (data) => {
        let citiesArr = data.cities || []
        // Si hay una cita cargada y su city_id no está en el array, agregarla usando city_name si existe
        if (
          parsed &&
          parsed.city_id &&
          !citiesArr.some((c) => String(c.id) === String(parsed.city_id))
        ) {
          if (parsed.city_name) {
            citiesArr = [...citiesArr, { id: parsed.city_id, name: parsed.city_name }]
          } else {
            try {
              const resCity = await fetch(
                `https://aplication-backend-production-872f.up.railway.app/api/appointments/cities?search=${parsed.city_id}&limit=1`,
              )
              const dataCity = await resCity.json()
              if (dataCity.cities && dataCity.cities.length > 0) {
                citiesArr = [...citiesArr, dataCity.cities[0]]
              }
            } catch {}
          }
        }
        setCities(citiesArr)
      })
      .catch(() => setCities([]))
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
    // Solo enviar los campos permitidos por el schema
    const allowedFields = [
      'scheduled_at',
      'status',
      'notes',
      'reason_for_visit',
      'has_medical_record',
      'city_id',
    ]
    const updates = {}
    allowedFields.forEach((field) => {
      let value = editedAppointment[field]
      if (field === 'city_id' && value !== undefined && value !== null && value !== '') {
        value = Number(value)
      }
      if (value !== undefined && value !== null && value !== '') {
        updates[field] = value
      }
    })
    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updates),
        },
      )

      if (response.ok) {
        // Después de guardar, obtener los datos completos y enriquecidos
        const updated = await response.json()
        try {
          const res = await fetch(
            `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          )
          if (res.ok) {
            const fullData = await res.json()
            setAppointment(fullData)
            setEditedAppointment({ ...fullData })
            localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
          } else {
            setAppointment(updated.appointment)
            setEditedAppointment({ ...updated.appointment })
            localStorage.setItem('selectedAppointment', JSON.stringify(updated.appointment))
          }
        } catch {
          setAppointment(updated.appointment)
          setEditedAppointment({ ...updated.appointment })
          localStorage.setItem('selectedAppointment', JSON.stringify(updated.appointment))
        }
        Notifications.showAlert(setAlert, '¡Cambios guardados con éxito!', 'success')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al guardar los cambios.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'Hubo un error al guardar los cambios.', 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteAppointment = async () => {
    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        },
      )
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
              {t('Patient')}: {appointment.patient_full_name}
            </CCardTitle>
            <CCardText>
              <strong>{t('Professional')}:</strong> {appointment.professional_full_name} <br />
              <strong>{t('Status')}:</strong> {appointment.status} <br />
              <strong>{t('Date')}:</strong> {new Date(appointment.scheduled_at).toLocaleString()}{' '}
              <br />
              <strong>{t('City')}:</strong> {appointment.city_name} <br />
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
                    const response = await fetch(
                      `https://aplication-backend-production-872f.up.railway.app/api/appointments/status/${appointment.id}`,
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ status: updatedStatus }),
                      },
                    )
                    if (response.ok) {
                      const data = await response.json()
                      // Obtener datos enriquecidos tras el cambio de status
                      try {
                        const res = await fetch(
                          `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
                          {
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                          },
                        )
                        if (res.ok) {
                          const fullData = await res.json()
                          setAppointment(fullData)
                          setEditedAppointment({ ...fullData })
                          localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
                        } else {
                          setAppointment(data.appointment)
                          setEditedAppointment({ ...data.appointment })
                          localStorage.setItem(
                            'selectedAppointment',
                            JSON.stringify(data.appointment),
                          )
                        }
                      } catch {
                        setAppointment(data.appointment)
                        setEditedAppointment({ ...data.appointment })
                        localStorage.setItem(
                          'selectedAppointment',
                          JSON.stringify(data.appointment),
                        )
                      }
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
                className="mb-3"
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
              onChange={async (e) => {
                const newStatus = e.target.value
                setEditedAppointment({ ...editedAppointment, status: newStatus })
                if (!fieldsDisabled) return // Solo guardar si está en modo edición
                try {
                  const response = await fetch(
                    `https://aplication-backend-production-872f.up.railway.app/api/appointments/status/${appointment.id}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ status: newStatus }),
                    },
                  )
                  if (response.ok) {
                    const data = await response.json()
                    // Obtener datos enriquecidos tras el cambio de status
                    try {
                      const res = await fetch(
                        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
                        {
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      )
                      if (res.ok) {
                        const fullData = await res.json()
                        setAppointment(fullData)
                        setEditedAppointment({ ...fullData })
                        localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
                      } else {
                        setAppointment(data.appointment)
                        setEditedAppointment({ ...data.appointment })
                        localStorage.setItem(
                          'selectedAppointment',
                          JSON.stringify(data.appointment),
                        )
                      }
                    } catch {
                      setAppointment(data.appointment)
                      setEditedAppointment({ ...data.appointment })
                      localStorage.setItem('selectedAppointment', JSON.stringify(data.appointment))
                    }
                    Notifications.showAlert(setAlert, 'Status updated successfully.', 'success')
                  } else {
                    throw new Error('Error updating status.')
                  }
                } catch (error) {
                  Notifications.showAlert(
                    setAlert,
                    'There was an error updating the status.',
                    'danger',
                  )
                }
              }}
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
                value={(() => {
                  // Buscar la ciudad seleccionada en el array cities
                  const found = cities.find(
                    (city) => String(city.id) === String(editedAppointment.city_id),
                  )
                  if (found) {
                    return { label: found.name, value: found.id }
                  }
                  // Si no está en cities pero hay city_id, mostrar solo el id
                  if (editedAppointment.city_id) {
                    return {
                      label: `ID: ${editedAppointment.city_id}`,
                      value: editedAppointment.city_id,
                    }
                  }
                  return null
                })()}
                loadOptions={async (inputValue) => {
                  if (!inputValue) {
                    return cities.slice(0, 5).map((city) => ({
                      label: city.name,
                      value: city.id,
                    }))
                  }
                  try {
                    const res = await fetch(
                      `https://aplication-backend-production-872f.up.railway.app/api/appointments/cities?search=${encodeURIComponent(
                        inputValue,
                      )}&limit=10`,
                    )
                    const data = await res.json()
                    return (data.cities || []).map((city) => ({
                      label: city.name,
                      value: city.id,
                    }))
                  } catch {
                    return []
                  }
                }}
                onChange={async (option) => {
                  setEditedAppointment((prev) => ({
                    ...prev,
                    city_id: option ? option.value : '',
                  }))
                  // Si la ciudad seleccionada no está en cities, la agregamos
                  if (option && !cities.some((c) => String(c.id) === String(option.value))) {
                    try {
                      const res = await fetch(
                        `https://aplication-backend-production-872f.up.railway.app/api/appointments/cities?search=${encodeURIComponent(
                          option.label,
                        )}&limit=1`,
                      )
                      const data = await res.json()
                      if (data.cities && data.cities.length > 0) {
                        setCities((prev) => [...prev, data.cities[0]])
                      }
                    } catch {}
                  }
                }}
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
