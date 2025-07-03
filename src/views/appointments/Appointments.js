import React, { useEffect, useState, useRef } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import Notifications from '../../components/Notifications'
import AsyncSelect from 'react-select/async'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useTranslation } from 'react-i18next'

import './styles/appointments.css'
import '../users/styles/filter.css'
import '../users/styles/users.css'
import { formatDate } from '../../utils/dateUtils'

import {
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CBadge,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilInfo, cilTrash, cilPlus } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'

const Appointments = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [alert, setAlert] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [filters, setFilters] = useState({
    patient: '',
    professional: '',
    status: '',
    city: '',
    startDate: null,
    endDate: null,
  })
  const [visible, setVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const ModalAddRef = useRef()
  const token = localStorage.getItem('authToken')

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        'https://aplication-backend-production-872f.up.railway.app/api/appointments',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()

        // Transformar los datos para incluir nombres completos
        const transformedData = data.map((appointment) => ({
          ...appointment,
          patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
          professional: `${appointment.professional_first_name} ${appointment.professional_last_name}`,
          city: appointment.name, // Renombrar "name" como "city" si deseas usarlo directamente
        }))

        setAppointments(transformedData)
        setFilteredAppointments(transformedData)
      } else {
        console.error('Error fetching appointments')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const loadOptions = async (entity, inputValue) => {
    try {
      // Realiza la solicitud al endpoint del backend
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${entity}?search=${encodeURIComponent(inputValue)}&limit=5`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Incluye el token de autorización
          },
        },
      )

      // Manejo de errores HTTP
      if (!response.ok) {
        console.error(`Error al cargar ${entity}: ${response.statusText}`)
        return []
      }

      // Procesa la respuesta en formato JSON
      const data = await response.json()

      // Mapeo dinámico según la entidad
      if (entity === 'patients') {
        return data.patients.map((item) => ({
          label: `${item.first_name} ${item.last_name}`, // Combina nombres
          value: item.id, // ID del paciente
        }))
      }

      if (entity === 'professionals') {
        return data.professionals.map((item) => ({
          label: `${item.first_name} ${item.last_name}`, // Combina nombres
          value: item.id, // ID del profesional
        }))
      }

      if (entity === 'cities') {
        return data.cities.map((item) => ({
          label: `${item.name}`, // Nombre de la ciudad
          value: item.id, // ID de la ciudad
        }))
      }

      // Fallback genérico en caso de que la entidad no esté definida
      console.warn(`Entidad desconocida: ${entity}`)
      return []
    } catch (error) {
      // Captura y manejo de errores en la solicitud o procesamiento
      console.error(`Error al cargar ${entity}:`, error.message)
      return []
    }
  }

  // Modificar las funciones de carga para no incluir el token
  const loadPatients = (inputValue) => loadOptions('patients', inputValue)
  const loadProfessionals = (inputValue) => loadOptions('professionals', inputValue)
  const loadCities = (inputValue) => loadOptions('cities', inputValue)

  const customFields = {
    patient: ({ value, onChange, error, helperText, placeholder }) => (
      <AsyncSelect
        cacheOptions
        loadOptions={(inputValue) => loadPatients(inputValue)} // Sin token
        defaultOptions
        onChange={onChange}
        placeholder={placeholder || 'Buscar paciente...'}
        isClearable
        styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
      />
    ),
    professional: ({ value, onChange, error, helperText, placeholder }) => (
      <AsyncSelect
        cacheOptions
        loadOptions={(inputValue) => loadProfessionals(inputValue)} // Sin token
        defaultOptions
        onChange={onChange}
        placeholder={placeholder || 'Buscar profesional...'}
        isClearable
        styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
      />
    ),
    city_id: ({ value, onChange, error, helperText, placeholder }) => (
      <AsyncSelect
        cacheOptions
        loadOptions={(inputValue) => loadCities(inputValue)} // Sin token
        defaultOptions
        onChange={onChange}
        placeholder={placeholder || 'Buscar ciudad...'}
        isClearable
        styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
      />
    ),
    scheduled_at: ({ value, onChange, error, helperText, placeholder }) => (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label="Scheduled At"
          value={value ? new Date(value) : null}
          onChange={(newValue) => {
            onChange(newValue ? newValue.toISOString() : '')
          }}
          format="dd/MM/yyyy HH:mm"
          slotProps={{
            textField: {
              variant: 'standard',
              fullWidth: true,
              error: !!error,
              helperText,
              placeholder,
            },
          }}
        />
      </LocalizationProvider>
    ),
    has_medical_record: ({ value, onChange, placeholder }) => (
      <select
        className="form-select"
        value={
          value === true || value === 'true'
            ? 'true'
            : value === false || value === 'false'
              ? 'false'
              : ''
        }
        onChange={(e) => {
          const val = e.target.value
          if (val === 'true') onChange('true')
          else if (val === 'false') onChange('false')
          else onChange('')
        }}
        required
      >
        <option value="">{placeholder || 'Do you have a medical history?'}</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    ),
  }

  const appointmentSteps = [
    {
      // Paso 1: Selección de paciente y profesional
      fields: [
        {
          name: 'patient',
          label: 'Paciente',
          type: 'select',
          required: true,
          placeholder: 'Seleccione al paciente',
          options: [], // Usado por customFields con AsyncSelect
        },
        {
          name: 'professional',
          label: 'Profesional',
          type: 'select',
          required: true,
          placeholder: 'Seleccione al profesional',
          options: [], // Usado por customFields con AsyncSelect
        },
      ],
    },
    {
      // Paso 2: Fecha, estado y ciudad
      fields: [
        {
          name: 'scheduled_at',
          type: 'text', // o simplemente omite el type
          label: 'Fecha Programada',
          required: true,
          placeholder: 'Seleccione la fecha y hora',
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          required: true,
          options: [
            { label: 'Pendiente', value: 'pending' },
            { label: 'Confirmada', value: 'confirmed' },
            { label: 'Completada', value: 'completed' },
            { label: 'Cancelada', value: 'canceled' },
          ],
        },
        {
          name: 'city_id',
          label: 'Ciudad',
          type: 'select',
          required: true,
          options: [], // Usado por customFields con AsyncSelect
          placeholder: 'Seleccione la ciudad',
        },
      ],
    },
    {
      // Paso 3: Notas y motivo de la visita
      fields: [
        {
          name: 'notes',
          label: 'Notas',
          type: 'textarea',
          placeholder: 'Ingrese las notas',
        },
        {
          name: 'reason_for_visit',
          label: 'Motivo de la visita',
          type: 'text',
          placeholder: 'Ingrese el motivo de la visita',
        },
        {
          name: 'has_medical_record',
          label: '¿Tiene un historial médico?',
          type: 'select',
          required: true,
          options: [
            { label: 'Sí', value: 'true' },
            { label: 'No', value: 'false' },
          ],
          placeholder: '¿Tiene un historial médico?',
        },
      ],
    },
  ]

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'appointments') {
      try {
        // Construye el objeto de la nueva cita directamente desde formData
        const newAppointment = {
          scheduled_at: formData.scheduled_at,
          status: formData.status,
          notes: formData.notes || null,
          reason_for_visit: formData.reason_for_visit,
          patient_id: formData.patient, // Usamos directamente el value seleccionado
          professional_id: formData.professional, // Usamos directamente el value seleccionado
          city_id: formData.city_id, // Usamos directamente el value seleccionado
          has_medical_record: formData.has_medical_record === 'true', // Convierte de string a boolean
        }

        // Valida los datos antes de enviar la solicitud
        if (
          !newAppointment.patient_id ||
          !newAppointment.professional_id ||
          !newAppointment.city_id
        ) {
          throw new Error(
            'Datos incompletos. Asegúrate de seleccionar un paciente, profesional y ciudad válidos.',
          )
        }

        // Envía los datos al backend
        const response = await fetch(
          'https://aplication-backend-production-872f.up.railway.app/api/appointments',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAppointment),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al crear la cita.')
        }

        // Actualiza la lista de citas después de la creación
        await fetchAppointments()
        Notifications.showAlert(setAlert, 'Appointment created successfully.', 'success')
      } catch (error) {
        console.error('Error al crear la cita:', error)
        Notifications.showAlert(setAlert, 'Appointment not created.', 'danger')
      }
    }
  }

  const addAppointment = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (appointment) => {
    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Incluye el token de autorización
          },
        },
      )

      if (response.ok) {
        const data = await response.json() // Obtiene la respuesta del backend
        Notifications.showAlert(setAlert, 'Appointment deleted successfully.', 'success', 5000)

        // Actualiza los estados de citas
        setAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
        setFilteredAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete the appointment.')
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      Notifications.showAlert(setAlert, 'There was an error deleting the appointment.', 'danger')
    }
  }

  const handleInfo = (appointment) => {
    setSelectedAppointment(appointment)
    setInfoVisible(true)
  }

  const handleEdit = async (appointment) => {
    try {
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments/${appointment.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Incluye el token de autorización
          },
        },
      )
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('selectedAppointment', JSON.stringify(data))
        navigate(`/appointments/${appointment.id}`, { state: { appointment: data } })
      } else {
        // Si falla el fetch, navega con los datos originales
        navigate(`/appointments/${appointment.id}`, { state: { appointment } })
      }
    } catch {
      navigate(`/appointments/${appointment.id}`, { state: { appointment } })
    }
  }
  const dataFilter = Object.keys(filters).map((key) => {
    let label
    let type = 'text'
    let options = []

    switch (key) {
      case 'startDate':
        label = 'Fecha de Inicio'
        type = 'date' // Cambiar el tipo a 'date'
        break
      case 'endDate':
        label = 'Fecha de Fin'
        type = 'date' // Cambiar el tipo a 'date'
        break
      case 'patient':
        label = 'Paciente'
        break
      case 'professional':
        label = 'Profesional'
        break
      case 'status':
        label = 'Estado'
        type = 'select'
        options = [
          { label: 'Pendiente', value: 'pending' },
          { label: 'Confirmada', value: 'confirmed' },
          { label: 'Completada', value: 'completed' },
          { label: 'Cancelada', value: 'canceled' },
        ]
        break
      case 'city':
        label = 'Ciudad'
        break
      default:
        label = key.charAt(0).toUpperCase() + key.slice(1) // Capitalizar el primer carácter
    }

    return {
      name: key,
      label,
      placeholder: `Buscar por ${label}`,
      type,
      options,
      value:
        key === 'startDate' || key === 'endDate'
          ? filters[key] instanceof Date
            ? filters[key].toISOString().split('T')[0] // Formatear fecha para el input
            : ''
          : filters[key] || '', // Asegúrate de que el valor no sea null o undefined
      onChange: (e) => {
        const value = e.target.value
        setFilters((prev) => ({
          ...prev,
          [key]:
            key === 'startDate' || key === 'endDate' ? (value ? new Date(value) : null) : value, // Convertir a Date si es necesario
        }))
      },
    }
  })

  const normalizeText = (text) =>
    text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const handleFilter = () => {
    const { startDate, endDate, ...otherFilters } = filters

    // Mapeo de claves de filtro a propiedades reales que se muestran en la tabla
    const filterKeyMap = {
      patient: 'patient_full_name',
      professional: 'professional_full_name',
      city: 'city',
    }

    const activeFilters = Object.keys(otherFilters).filter((key) => otherFilters[key].trim() !== '')

    const filtered = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduled_at)
      const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const normalizedAppointmentDate = normalizeDate(appointmentDate)
      const normalizedStartDate = startDate ? normalizeDate(startDate) : null
      const normalizedEndDate = endDate ? normalizeDate(endDate) : null

      const startCondition = normalizedStartDate
        ? normalizedAppointmentDate >= normalizedStartDate
        : true
      const endCondition = normalizedEndDate ? normalizedAppointmentDate <= normalizedEndDate : true

      const otherConditions = activeFilters.every((key) => {
        const realKey = filterKeyMap[key] || key
        const appointmentValue = appointment[realKey] ? normalizeText(appointment[realKey]) : ''
        const filterValue = normalizeText(otherFilters[key])
        return appointmentValue.startsWith(filterValue)
      })

      return startCondition && endCondition && otherConditions
    })

    setFilteredAppointments(filtered)
  }

  const resetFilters = () => {
    const resetValues = Object.keys(filters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    setFilters(resetValues)
    setFilteredAppointments(appointments)
  }

  const getStatusBadgeColor = (status) => {
    if (!status) return 'secondary'
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'info'
      case 'completed':
        return 'success'
      case 'canceled':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addAppointment()}>
          <CIcon icon={cilPlus} className="me-2" /> {t('Add Appointment')}
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>{t('Appointments')}</CCardHeader>
        <div className="filter-container">
          <UserFilter onFilter={handleFilter} resetFilters={resetFilters} dataFilter={dataFilter} />
        </div>
        {alert && (
          <CAlert color={alert.type} className="text-center alert-fixed">
            {alert.message}
          </CAlert>
        )}
        <CCardBody>
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead className="text-nowrap">
              <CTableRow>
                <CTableHeaderCell className="table-header">{t('Patient')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Professional')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Scheduled At')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Status')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('City')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header avatar-header">
                  {t('Actions')}
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredAppointments.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    {t('No appointments available')}
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredAppointments.map((appointment, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{appointment.patient_full_name}</CTableDataCell>
                    <CTableDataCell>{appointment.professional_full_name}</CTableDataCell>
                    <CTableDataCell>
                      {formatDate(appointment.scheduled_at, 'DATETIME')}{' '}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getStatusBadgeColor(appointment.status)}>
                        {appointment.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{appointment.city}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2 justify-content-center">
                        <CButton color="primary" size="sm" onClick={() => handleEdit(appointment)}>
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment) // Set the selected appointment
                            setVisible(true) // Open the modal
                          }}
                        >
                          <CIcon icon={cilTrash} style={{ '--ci-primary-color': 'white' }} />
                        </CButton>
                        <CButton color="info" size="sm" onClick={() => handleInfo(appointment)}>
                          <CIcon icon={cilInfo} style={{ '--ci-primary-color': 'white' }} />
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <ModalDelete
        visible={visible}
        onClose={() => setVisible(false)} // Close the modal without deleting
        onConfirm={() => {
          if (selectedAppointment) {
            handleDelete(selectedAppointment) // Call handleDelete with the selected appointment
          }
          setVisible(false) // Close the modal after confirming
        }}
        title={t('Confirm appointment deletion')}
        message={t('Are you sure you want to delete this appointment?')}
      />

      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={t('Appointment Information')}
        content={
          selectedAppointment ? (
            <div>
              <p>
                <strong>{t('Patient')}:</strong> {selectedAppointment.patient_full_name}
              </p>
              <p>
                <strong>{t('Professional')}:</strong> {selectedAppointment.professional_full_name}
              </p>
              <p>
                <strong>{t('Scheduled At')}:</strong>{' '}
                {formatDate(selectedAppointment.scheduled_at, 'DATETIME')}
              </p>
              <p>
                <strong>{t('Status')}:</strong> {selectedAppointment.status}
              </p>
              <p>
                <strong>{t('City')}:</strong> {selectedAppointment.city}
              </p>
              <p>
                <strong>{t('Notes')}:</strong>{' '}
                {selectedAppointment.notes || t('No notes available')}
              </p>
              <p>
                <strong>{t('Reason for visit')}:</strong>{' '}
                {selectedAppointment.reason_for_visit || t('No notes available')}
              </p>
              <p>
                <strong>{t('Medical history')}:</strong>{' '}
                {selectedAppointment.has_medical_record ? t('Sí') : t('No')}
              </p>
            </div>
          ) : (
            <p>{t('No information available')}.</p>
          )
        }
      />

      <ModalAdd
        ref={ModalAddRef}
        title={t('Add new appointment')}
        steps={appointmentSteps}
        onFinish={handleFinish}
        purpose="appointments"
        customFields={customFields}
      />
    </>
  )
}

export default Appointments
