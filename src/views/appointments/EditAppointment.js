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
  CSpinner,
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
import useApi from '../../hooks/useApi'

const EditAppointment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const ds = document.documentElement.dataset.coreuiTheme
    if (ds) return ds
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onColorSchemeChange = () => {
      const ds = document.documentElement.dataset.coreuiTheme
      if (ds) setColorScheme(ds)
      else if (window.matchMedia)
        setColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    document.documentElement.addEventListener('ColorSchemeChange', onColorSchemeChange)
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    mq && mq.addEventListener && mq.addEventListener('change', onColorSchemeChange)
    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', onColorSchemeChange)
      mq && mq.removeEventListener && mq.removeEventListener('change', onColorSchemeChange)
    }
  }, [])

  const [appointment, setAppointment] = useState(null)
  const [editedAppointment, setEditedAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const token = localStorage.getItem('authToken')
  const { request, loading: apiLoading } = useApi()

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
    request('get', '/appointments/cities')
      .then(async (res) => {
        let citiesArr = res.data && res.data.cities ? res.data.cities : []
        if (
          parsed &&
          parsed.city_id &&
          !citiesArr.some((c) => String(c.id) === String(parsed.city_id))
        ) {
          if (parsed.city_name) {
            citiesArr = [...citiesArr, { id: parsed.city_id, name: parsed.city_name }]
          } else {
            try {
              const resCity = await request(
                'get',
                `/appointments/cities?search=${parsed.city_id}&limit=1`,
              )
              if (resCity.data && resCity.data.cities && resCity.data.cities.length > 0) {
                citiesArr = [...citiesArr, resCity.data.cities[0]]
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
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('put', `/appointments/${appointment.id}`, updates, headers)
      if (res.success) {
        // Después de guardar, obtener los datos completos y enriquecidos
        let fullData = null
        try {
          const resFull = await request('get', `/appointments/${appointment.id}`, null, headers)
          if (resFull.success && resFull.data) {
            fullData = resFull.data
          } else if (res.data && res.data.appointment) {
            fullData = res.data.appointment
          }
        } catch {
          if (res.data && res.data.appointment) {
            fullData = res.data.appointment
          }
        }
        if (fullData) {
          setAppointment(fullData)
          setEditedAppointment({ ...fullData })
          localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
        }
        // Actualizar cache del dashboard para reflejar cambios en la cita
        try {
          await refreshDashboard()
        } catch (e) {
          console.warn('dashboard refresh failed after saveChanges', e)
        }
        Notifications.showAlert(setAlert, '¡Cambios guardados con éxito!', 'success')
      } else {
        throw new Error(res.message || 'Error al guardar los cambios.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'Hubo un error al guardar los cambios.', 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteAppointment = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/appointments/${appointment.id}`, null, headers)
      if (res.success) {
        Notifications.showAlert(setAlert, 'Appointment deleted successfully.', 'success', 3500)
        try {
          await refreshDashboard()
        } catch (e) {
          console.warn('dashboard refresh failed after delete in edit view', e)
        }
        setTimeout(() => {
          navigate('/appointments')
        }, 5000)
      } else {
        throw new Error(res.message || 'Error deleting the appointment.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'There was an error deleting the appointment.', 'danger')
    }
    setDeleteModalVisible(false)
  }

  if (loading || apiLoading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">{t('Loading appointment...')}</span>
      </div>
    )
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
                  const headers = token ? { Authorization: `Bearer ${token}` } : {}
                  try {
                    const resStatus = await request(
                      'put',
                      `/appointments/status/${appointment.id}`,
                      { status: updatedStatus },
                      headers,
                    )
                    if (resStatus.success) {
                      let fullData = null
                      try {
                        const resFull = await request(
                          'get',
                          `/appointments/${appointment.id}`,
                          null,
                          headers,
                        )
                        if (resFull.success && resFull.data) {
                          fullData = resFull.data
                        } else if (resStatus.data && resStatus.data.appointment) {
                          fullData = resStatus.data.appointment
                        }
                      } catch {
                        if (resStatus.data && resStatus.data.appointment) {
                          fullData = resStatus.data.appointment
                        }
                      }
                      if (fullData) {
                        setAppointment(fullData)
                        setEditedAppointment({ ...fullData })
                        localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
                      }
                      // Actualizar cache del dashboard luego de cambio de estado
                      try {
                        await refreshDashboard()
                      } catch (e) {
                        console.warn('dashboard refresh failed after status change', e)
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
                  popper: {
                    disablePortal: true,
                    modifiers: [{ name: 'preventOverflow', enabled: true }],
                  },
                  textField: {
                    variant: 'standard',
                    fullWidth: true,
                    className: 'mb-3',
                    disabled: fieldsDisabled,
                    InputLabelProps: {
                      style: {
                        color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined,
                      },
                    },
                    InputProps: {
                      style: { color: colorScheme === 'dark' ? '#fff' : undefined },
                    },
                    inputProps: {
                      style: { color: colorScheme === 'dark' ? '#fff' : undefined },
                    },
                    FormHelperTextProps: {
                      style: {
                        color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined,
                      },
                    },
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
                  const headers = token ? { Authorization: `Bearer ${token}` } : {}
                  const resStatus = await request(
                    'put',
                    `/appointments/status/${appointment.id}`,
                    { status: newStatus },
                    headers,
                  )
                  if (resStatus.success) {
                    let fullData = null
                    try {
                      const resFull = await request(
                        'get',
                        `/appointments/${appointment.id}`,
                        null,
                        headers,
                      )
                      if (resFull.success && resFull.data) {
                        fullData = resFull.data
                      } else if (resStatus.data && resStatus.data.appointment) {
                        fullData = resStatus.data.appointment
                      }
                    } catch {
                      if (resStatus.data && resStatus.data.appointment) {
                        fullData = resStatus.data.appointment
                      }
                    }
                    if (fullData) {
                      setAppointment(fullData)
                      setEditedAppointment({ ...fullData })
                      localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
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
                    const res = await request(
                      'get',
                      `/appointments/cities?search=${encodeURIComponent(inputValue)}&limit=10`,
                    )
                    if (res.success && res.data && res.data.cities) {
                      return res.data.cities.map((city) => ({
                        label: city.name,
                        value: city.id,
                      }))
                    }
                    return []
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
                      const res = await request(
                        'get',
                        `/appointments/cities?search=${encodeURIComponent(option.label)}&limit=1`,
                      )
                      if (
                        res.success &&
                        res.data &&
                        res.data.cities &&
                        res.data.cities.length > 0
                      ) {
                        setCities((prev) => [...prev, res.data.cities[0]])
                      }
                    } catch {}
                  }
                }}
                placeholder={citiesLoading ? 'Cargando ciudades...' : 'Buscar ciudad...'}
                isClearable
                isDisabled={fieldsDisabled || citiesLoading}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    background: colorScheme === 'dark' ? '#23262b' : provided.background,
                    color: colorScheme === 'dark' ? '#fff' : provided.color,
                  }),
                  singleValue: (provided) => ({
                    ...provided,
                    color: colorScheme === 'dark' ? '#fff' : provided.color,
                  }),
                  input: (provided) => ({
                    ...provided,
                    color: colorScheme === 'dark' ? '#fff' : provided.color,
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : provided.color,
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    background: colorScheme === 'dark' ? '#2b2f33' : provided.background,
                  }),
                  menuList: (provided) => ({
                    ...provided,
                    background: colorScheme === 'dark' ? '#2b2f33' : provided.background,
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    background: state.isFocused
                      ? colorScheme === 'dark'
                        ? '#3a3f44'
                        : provided.background
                      : colorScheme === 'dark'
                        ? '#2b2f33'
                        : provided.background,
                    color: colorScheme === 'dark' ? '#fff' : provided.color,
                  }),
                }}
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
