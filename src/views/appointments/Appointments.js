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
  const [patients, setPatients] = useState([]) // [{id, user_id, ...}]
  const [professionals, setProfessionals] = useState([]) // [{id, user_id, ...}]
  const [cities, setCities] = useState([])
  const ModalAddRef = useRef()

  // Cargar usuarios una sola vez (ya lo haces en useEffect)
  const [usersData, setUsersData] = useState([])

  const [selectedProfessional, setSelectedProfessional] = useState(null)

  // Pacientes válidos
  const loadPatients = async (inputValue) => {
    const patientUserIds = patients.map((p) => p.user_id)
    return usersData
      .filter(
        (u) =>
          String(u.role_id) === '3' &&
          patientUserIds.includes(u.id) &&
          `${u.first_name} ${u.last_name}`.toLowerCase().startsWith(inputValue.toLowerCase()),
      )
      .slice(0, 5)
      .map((u) => ({
        label: `${u.first_name} ${u.last_name}`,
        value: u.id,
      }))
  }

  // Profesionales válidos
  const loadProfessionals = async (inputValue) => {
    const professionalUserIds = professionals.map((p) => p.user_id)
    return usersData
      .filter(
        (u) =>
          String(u.role_id) === '2' &&
          professionalUserIds.includes(u.id) &&
          `${u.first_name} ${u.last_name}`.toLowerCase().startsWith(inputValue.toLowerCase()),
      )
      .slice(0, 5)
      .map((u) => ({
        label: `${u.first_name} ${u.last_name}`,
        value: u.id,
      }))
  }

  const loadCities = async (inputValue) => {
    return cities
      .filter((city) => city.name.toLowerCase().startsWith(inputValue.toLowerCase()))
      .slice(0, 5)
      .map((city) => ({
        label: city.name,
        value: city.id,
      }))
  }

  const fetchAppointments = async () => {
    try {
      const [appointmentsRes, usersRes, patientsRes, professionalsRes, citiesRes] =
        await Promise.all([
          fetch('http://localhost:8000/appointments'),
          fetch('http://localhost:8000/users'),
          fetch('http://localhost:8000/patient'),
          fetch('http://localhost:8000/professionals'),
          fetch('http://localhost:8000/city'), // <-- agrega fetch de ciudades aquí
        ])
      if (
        !appointmentsRes.ok ||
        !usersRes.ok ||
        !patientsRes.ok ||
        !professionalsRes.ok ||
        !citiesRes.ok
      ) {
        throw new Error('Failed to fetch data')
      }
      const appointmentsData = await appointmentsRes.json()
      const usersData = await usersRes.json()
      const patientsData = await patientsRes.json()
      const professionalsData = await professionalsRes.json()
      const citiesData = await citiesRes.json() // <-- ciudades aquí

      setPatients(patientsData)
      setProfessionals(professionalsData)
      setCities(citiesData) // <-- actualiza el estado

      // Usa citiesData en vez de cities (que puede estar vacío)
      const enrichedAppointments = appointmentsData.map((appointment) => {
        const patientObj = patientsData.find((p) => p.id === appointment.patient_id)
        const professionalObj = professionalsData.find((p) => p.id === appointment.professional_id)
        const patientUser = patientObj ? usersData.find((u) => u.id === patientObj.user_id) : null
        const professionalUser = professionalObj
          ? usersData.find((u) => u.id === professionalObj.user_id)
          : null
        const cityObj = citiesData.find((c) => String(c.id) === String(appointment.city_id))

        return {
          ...appointment,
          patient: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown',
          professional: professionalUser
            ? `${professionalUser.first_name} ${professionalUser.last_name}`
            : 'Unknown',
          city: cityObj ? cityObj.name : 'Unknown',
        }
      })
      setAppointments(enrichedAppointments)
      setFilteredAppointments(enrichedAppointments)
      setUsersData(usersData)
    } catch (error) {
      // Manejo de error
    }
  }
  useEffect(() => {
    fetchAppointments()
  }, [])

  const professionalSpecialty =
    selectedProfessional && usersData.length > 0
      ? usersData.find((user) => user.id.toString() === selectedProfessional.toString())
          ?.specialty || 'Not specified'
      : null

  const appointmentSteps = [
    {
      // Paso 1: Selección de paciente y profesional
      fields: [
        {
          name: 'patient',
          label: 'Patient',
          type: 'select',
          required: true,
          placeholder: 'Select patient',
          options: [], // Usado por customFields con AsyncSelect
        },
        {
          name: 'professional',
          label: 'Professional',
          type: 'select',
          required: true,
          placeholder: 'Select professional',
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
          label: 'Scheduled At',
          required: true,
          placeholder: 'Select date and time',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Completed', value: 'completed' },
            { label: 'Canceled', value: 'canceled' },
          ],
        },
        {
          name: 'city_id',
          label: 'City',
          type: 'select',
          required: true,
          options: [], // Usado por customFields con AsyncSelect
          placeholder: 'Select city',
        },
      ],
    },
    {
      // Paso 3: Notas y motivo de la visita
      fields: [
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter notes',
        },
        {
          name: 'reason_for_visit',
          label: 'Reason for visit',
          type: 'text',
          placeholder: 'Enter reason for visit',
        },
        {
          name: 'has_medical_record',
          label: 'Do you have a medical history?',
          type: 'select',
          required: true,
          options: [
            { label: 'Sí', value: 'true' },
            { label: 'No', value: 'false' },
          ],
          placeholder: 'Do you have a medical history?',
        },
      ],
    },
  ]

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'appointments') {
      const patientObj = patients.find((p) => p.user_id === formData.patient)
      const professionalObj = professionals.find((p) => p.user_id === formData.professional)

      const newAppointment = {
        scheduled_at: formData.scheduled_at,
        status: formData.status,
        notes: formData.notes,
        reason_for_visit: formData.reason_for_visit,
        patient_id: patientObj ? patientObj.id : null,
        professional_id: professionalObj ? professionalObj.id : null,
        city_id: formData.city_id,
        has_medical_record: formData.has_medical_record === 'true',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await fetch('http://localhost:8000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })
      await fetchAppointments()
    }
  }

  const addAppointment = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (appointment) => {
    try {
      const response = await fetch(`http://localhost:8000/appointments/${appointment.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        Notifications.showAlert(setAlert, 'Appointment deleted successfully.', 'success', 5000)
        setAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
        setFilteredAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
      } else {
        throw new Error('Failed to delete the appointment.')
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

  const handleEdit = (appointment) => {
    navigate(`/appointments/${appointment.id}`, { state: { appointment } })
  }
  const dataFilter = Object.keys(filters).map((key) => {
    let label
    let type = 'text'
    let options = []

    switch (key) {
      case 'startDate':
      case 'endDate':
        label = key === 'startDate' ? 'Start Date' : 'End Date'
        type = 'date' // Cambiar el tipo a 'date'
        break
      case 'patient':
        label = 'Patient'
        break
      case 'professional':
        label = 'Professional'
        break
      case 'status':
        label = 'Status'
        type = 'select'
        options = [
          { label: 'Pending', value: 'pending' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ]
        break
      case 'city':
        label = 'City'
        break
      default:
        label = key.charAt(0).toUpperCase() + key.slice(1)
    }

    return {
      name: key,
      label,
      placeholder: `Search by ${label}`,
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

    const activeFilters = Object.keys(otherFilters).filter((key) => otherFilters[key].trim() !== '')

    const filtered = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduled_at)

      // Normalizar las fechas eliminando las horas
      const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

      const normalizedAppointmentDate = normalizeDate(appointmentDate)
      const normalizedStartDate = startDate ? normalizeDate(startDate) : null
      const normalizedEndDate = endDate ? normalizeDate(endDate) : null

      const startCondition = normalizedStartDate
        ? normalizedAppointmentDate >= normalizedStartDate
        : true
      const endCondition = normalizedEndDate ? normalizedAppointmentDate <= normalizedEndDate : true

      const otherConditions = activeFilters.every((key) => {
        const appointmentValue = appointment[key] ? normalizeText(appointment[key]) : ''
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

  const customFields = {
    patient: ({ value, onChange, error, helperText, placeholder }) => (
      <AsyncSelect
        cacheOptions
        loadOptions={loadPatients}
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
        loadOptions={loadProfessionals}
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
        loadOptions={loadCities}
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

  // Supón que tienes estos datos cargados:

  useEffect(() => {
    // ...otros fetch...
    const fetchCities = async () => {
      const res = await fetch('http://localhost:8000/city')
      const data = await res.json()
      setCities(data)
    }
    fetchCities()
  }, [])

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addAppointment()}>
          <CIcon icon={cilPlus} className="me-2" /> Add Appointment
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>Appointments</CCardHeader>
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
                <CTableHeaderCell className="table-header">Patient</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Professional</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Scheduled At</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Status</CTableHeaderCell>
                <CTableHeaderCell className="table-header">City</CTableHeaderCell>
                <CTableHeaderCell className="table-header avatar-header">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredAppointments.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    No appointments available
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredAppointments.map((appointment, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{appointment.patient}</CTableDataCell>
                    <CTableDataCell>{appointment.professional}</CTableDataCell>
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
        title="Confirm appointment deletion"
        message="Are you sure you want to delete this appointment?"
      />

      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Appointment Information"
        content={
          selectedAppointment ? (
            <div>
              <p>
                <strong>Patient:</strong> {selectedAppointment.patient}
              </p>
              <p>
                <strong>Professional:</strong> {selectedAppointment.professional}
              </p>
              <p>
                <strong>Scheduled At:</strong>{' '}
                {formatDate(selectedAppointment.scheduled_at, 'DATETIME')}
              </p>
              <p>
                <strong>Status:</strong> {selectedAppointment.status}
              </p>
              <p>
                <strong>City:</strong> {selectedAppointment.city}
              </p>
              <p>
                <strong>Notes:</strong> {selectedAppointment.notes || 'No notes available'}
              </p>
              <p>
                <strong>Reason for visit:</strong>{' '}
                {selectedAppointment.reason_for_visit || 'No notes available'}
              </p>
              <p>
                <strong>Medical history:</strong>{' '}
                {selectedAppointment.has_medical_record ? 'Yes' : 'No'}
              </p>
            </div>
          ) : (
            <p>No information available.</p>
          )
        }
      />

      <ModalAdd
        ref={ModalAddRef}
        title="Add new appointment"
        steps={appointmentSteps}
        onFinish={handleFinish}
        purpose="appointments"
        customFields={customFields}
      />
    </>
  )
}

export default Appointments
