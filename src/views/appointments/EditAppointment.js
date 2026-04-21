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
  CCardHeader,
  CCol,
  CRow,
  CFormTextarea,
  CFormSelect,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilSave, cilTrash, cilCalendar, cilNotes } from '@coreui/icons'
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
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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

  const asyncSelectStyles = {
    control: (p) => ({ ...p, background: colorScheme === 'dark' ? '#23262b' : p.background }),
    singleValue: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color }),
    input: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color }),
    placeholder: (p) => ({ ...p, color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : p.color }),
    menu: (p) => ({ ...p, zIndex: 9999, background: colorScheme === 'dark' ? '#2b2f33' : p.background }),
    menuList: (p) => ({ ...p, background: colorScheme === 'dark' ? '#2b2f33' : p.background }),
    option: (p, s) => ({ ...p, background: s.isFocused ? (colorScheme === 'dark' ? '#3a3f44' : p.background) : (colorScheme === 'dark' ? '#2b2f33' : p.background), color: colorScheme === 'dark' ? '#fff' : p.color }),
  }

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
        if (parsed && parsed.city_id && !citiesArr.some((c) => String(c.id) === String(parsed.city_id))) {
          if (parsed.city_name) {
            citiesArr = [...citiesArr, { id: parsed.city_id, name: parsed.city_name }]
          } else {
            try {
              const resCity = await request('get', `/appointments/cities?search=${parsed.city_id}&limit=1`)
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

  const handleFieldsDisabled = () => setFieldsDisabled((prev) => !prev)

  const saveChanges = async () => {
    if (!appointment || !appointment.id) {
      Notifications.showAlert(setAlert, 'Cannot save because the appointment ID is not valid.', 'danger')
      return
    }
    const allowedFields = ['scheduled_at', 'status', 'notes', 'reason_for_visit', 'has_medical_record', 'city_id']
    const updates = {}
    allowedFields.forEach((field) => {
      let value = editedAppointment[field]
      if (field === 'city_id' && value !== undefined && value !== null && value !== '') value = Number(value)
      if (value !== undefined && value !== null && value !== '') updates[field] = value
    })
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('put', `/appointments/${appointment.id}`, updates, headers)
      if (res.success) {
        let fullData = null
        try {
          const resFull = await request('get', `/appointments/${appointment.id}`, null, headers)
          fullData = resFull.success && resFull.data ? resFull.data : (res.data && res.data.appointment ? res.data.appointment : null)
        } catch {
          fullData = res.data && res.data.appointment ? res.data.appointment : null
        }
        if (fullData) {
          setAppointment(fullData)
          setEditedAppointment({ ...fullData })
          localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
        }
        Notifications.showAlert(setAlert, t('Changes saved successfully!'), 'info')
      } else {
        throw new Error(res.message || 'Error saving changes.')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, t('Error saving changes.'), 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteAppointment = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/appointments/${appointment.id}`, null, headers)
      if (res.success) {
        Notifications.showAlert(setAlert, t('Appointment deleted successfully.'), 'warning', 3500)
        setTimeout(() => navigate('/appointments'), 5000)
      } else {
        throw new Error(res.message || 'Error deleting the appointment.')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, 'There was an error deleting the appointment.', 'danger')
    }
    setDeleteModalVisible(false)
  }

  const quickStatusChange = async (newStatus) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('put', `/appointments/status/${appointment.id}`, { status: newStatus }, headers)
      if (res.success) {
        let fullData = null
        try {
          const resFull = await request('get', `/appointments/${appointment.id}`, null, headers)
          fullData = resFull.success && resFull.data ? resFull.data : (res.data && res.data.appointment ? res.data.appointment : null)
        } catch {
          fullData = res.data && res.data.appointment ? res.data.appointment : null
        }
        if (fullData) {
          setAppointment(fullData)
          setEditedAppointment({ ...fullData })
          localStorage.setItem('selectedAppointment', JSON.stringify(fullData))
        }
        Notifications.showAlert(setAlert, `Status changed to ${newStatus}.`, 'success')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, 'There was an error changing the appointment status.', 'danger')
    }
  }

  if (!appointment && (loading || apiLoading)) return null
  if (!appointment) return <p>Appointment not found.</p>

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
          {t('Edit Appointment')}
        </h3>
        <p className="text-muted small">{t('Appointment')} #{appointment.id}</p>
        <hr className="my-3 opacity-10" />
      </CCol>

      {/* Sidebar */}
      <CCol lg={3}>
        <div className="sticky-lg-top" style={{ top: '1.5rem', zIndex: 10 }}>
          <CCard className="mb-3 shadow-sm border-0 overflow-hidden">
            <div className="p-1" style={{ backgroundColor: 'var(--cui-primary)' }}></div>
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-3">
                {t('Appointment Information')}
              </h6>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Patient')}</label>
                <div className="fw-bold fs-6 text-primary-emphasis">{appointment.patient_full_name}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Professional')}</label>
                <div className="fw-medium">{appointment.professional_full_name}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Date')}</label>
                <div className="small">{new Date(appointment.scheduled_at).toLocaleString()}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('City')}</label>
                <div className="fw-medium">{appointment.city_name}</div>
              </div>
              <div className="mb-2">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Status')}</label>
                <div className="fw-medium">{appointment.status}</div>
              </div>
            </CCardBody>
          </CCard>

          {/* Quick Status Change */}
          <CCard className="shadow-sm border-0 mb-3">
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-2">{t('Change Status')}</h6>
              <CFormSelect
                id="quickStatusChange"
                value={appointment.status}
                onChange={(e) => quickStatusChange(e.target.value)}
                size="sm"
              >
                <option value="pending">{t('Pending')}</option>
                <option value="confirmed">{t('Confirmed')}</option>
                <option value="canceled">{t('Canceled')}</option>
                <option value="completed">{t('Completed')}</option>
              </CFormSelect>
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
                {t('Delete Appointment')}
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CCol>

      {/* Main Form */}
      <CCol lg={9}>
        <CForm>
          {/* Section: Date & Details */}
          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
              <CIcon icon={cilCalendar} className="me-2 text-primary" size="lg" />
              <h5 className="mb-0 fw-bold">{t('Appointment Details')}</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              <CRow className="g-4">
                <CCol md={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label={t('Scheduled At')}
                      value={editedAppointment.scheduled_at ? new Date(editedAppointment.scheduled_at) : null}
                      onChange={(newValue) =>
                        setEditedAppointment({ ...editedAppointment, scheduled_at: newValue ? newValue.toISOString() : '' })
                      }
                      format="dd/MM/yyyy HH:mm"
                      slotProps={{
                        popper: { disablePortal: true, modifiers: [{ name: 'preventOverflow', enabled: true }] },
                        textField: {
                          variant: 'standard',
                          fullWidth: true,
                          disabled: fieldsDisabled,
                          InputLabelProps: { style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined } },
                          InputProps: { style: { color: colorScheme === 'dark' ? '#fff' : undefined } },
                          inputProps: { style: { color: colorScheme === 'dark' ? '#fff' : undefined } },
                        },
                      }}
                      disabled={fieldsDisabled}
                    />
                  </LocalizationProvider>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    id="status"
                    label={t('Status')}
                    value={editedAppointment.status}
                    onChange={(e) => setEditedAppointment({ ...editedAppointment, status: e.target.value })}
                    disabled={fieldsDisabled}
                  >
                    <option value="pending">{t('Pending')}</option>
                    <option value="confirmed">{t('Confirmed')}</option>
                    <option value="canceled">{t('Canceled')}</option>
                    <option value="completed">{t('Completed')}</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    id="has_medical_record"
                    label={t('Has Medical Record')}
                    value={
                      editedAppointment.has_medical_record === true || editedAppointment.has_medical_record === 'true'
                        ? 'true'
                        : editedAppointment.has_medical_record === false || editedAppointment.has_medical_record === 'false'
                        ? 'false'
                        : ''
                    }
                    onChange={(e) => setEditedAppointment({ ...editedAppointment, has_medical_record: e.target.value === 'true' })}
                    disabled={fieldsDisabled}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </CFormSelect>
                </CCol>
                <CCol md={12}>
                  <label className="form-label fw-semibold small text-uppercase text-muted mb-1">{t('City')}</label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={cities.slice(0, 5).map((city) => ({ label: city.name, value: city.id }))}
                    value={(() => {
                      const found = cities.find((city) => String(city.id) === String(editedAppointment.city_id))
                      if (found) return { label: found.name, value: found.id }
                      if (editedAppointment.city_id) return { label: `ID: ${editedAppointment.city_id}`, value: editedAppointment.city_id }
                      return null
                    })()}
                    loadOptions={async (inputValue) => {
                      if (!inputValue) return cities.slice(0, 5).map((city) => ({ label: city.name, value: city.id }))
                      try {
                        const res = await request('get', `/appointments/cities?search=${encodeURIComponent(inputValue)}&limit=10`)
                        return res.success && res.data && res.data.cities ? res.data.cities.map((city) => ({ label: city.name, value: city.id })) : []
                      } catch { return [] }
                    }}
                    onChange={async (option) => {
                      setEditedAppointment((prev) => ({ ...prev, city_id: option ? option.value : '' }))
                      if (option && !cities.some((c) => String(c.id) === String(option.value))) {
                        try {
                          const res = await request('get', `/appointments/cities?search=${encodeURIComponent(option.label)}&limit=1`)
                          if (res.success && res.data && res.data.cities && res.data.cities.length > 0) {
                            setCities((prev) => [...prev, res.data.cities[0]])
                          }
                        } catch {}
                      }
                    }}
                    placeholder={citiesLoading ? 'Cargando ciudades...' : 'Buscar ciudad...'}
                    isClearable
                    isDisabled={fieldsDisabled || citiesLoading}
                    styles={asyncSelectStyles}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Section: Notes */}
          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
              <CIcon icon={cilNotes} className="me-2 text-primary" size="lg" />
              <h5 className="mb-0 fw-bold">{t('Notes')}</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              <CRow className="g-4">
                <CCol md={6}>
                  <CFormTextarea
                    id="notes"
                    label={t('Notes')}
                    value={editedAppointment.notes || ''}
                    onChange={(e) => setEditedAppointment({ ...editedAppointment, notes: e.target.value })}
                    disabled={fieldsDisabled}
                    rows={4}
                    style={{ resize: 'none' }}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormTextarea
                    id="reason_for_visit"
                    label={t('Reason for visit')}
                    value={editedAppointment.reason_for_visit || ''}
                    onChange={(e) => setEditedAppointment({ ...editedAppointment, reason_for_visit: e.target.value })}
                    disabled={fieldsDisabled}
                    rows={4}
                    style={{ resize: 'none' }}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 mb-5">
            {fieldsDisabled ? (
              <>
                <CButton color="secondary" variant="ghost" onClick={() => navigate('/appointments')}>
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
                  if (appointment) {
                    setEditedAppointment({ ...appointment });
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

      <CModal alignment="center" visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
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
