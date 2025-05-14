import React, { useEffect, useState, useRef } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import Notifications from '../../components/Notifications'

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
  const [addVisible, setAddVisible] = useState(false)
  const ModalAddRef = useRef()

  const appointmentSteps = [
    {
      fields: [
        {
          name: 'patient',
          label: 'Patient',
          placeholder: 'Enter patient name',
          required: true,
        },
        {
          name: 'professional',
          label: 'Professional',
          placeholder: 'Enter professional name',
          required: true,
        },
        {
          name: 'scheduled_at',
          type: 'datetime-local',
          label: 'Scheduled At',
          placeholder: 'Select date and time',
          required: true,
        },
      ],
    },
    {
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Completed', value: 'completed' },
            { label: 'Canceled by patient', value: 'Canceled by patient' },
            { label: 'Canceled by professional', value: 'Canceled by professional' },
          ],
        },
        {
          name: 'city',
          label: 'City',
          type: 'select',
          required: true,
          options: [
            { label: 'San Cristóbal', value: 'San Cristóbal' },
            { label: 'Táriba', value: 'Táriba' },
            { label: 'La Fría', value: 'La Fría' },
            { label: 'San Antonio del Táchira', value: 'San Antonio del Táchira' },
            { label: 'Rubio', value: 'Rubio' },
            { label: 'La Grita', value: 'La Grita' },
          ],
        },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: [
            { label: 'Consulta médica', value: 'Consulta médica' },
            { label: 'Rehabilitación', value: 'Rehabilitación' },
            { label: 'Emergencias', value: 'Emergencias' },
            { label: 'Prevención', value: 'Prevención' },
            { label: 'Atención de enfermería', value: 'Atención de enfermería' },
            { label: 'Especialidad médica', value: 'Especialidad médica' },
          ],
        },
        {
          name: 'specialty',
          label: 'Specialty',
          type: 'select',
          required: true,
          options: [
            { label: 'Pediatría', value: 'Pediatría' },
            { label: 'Fisioterapia', value: 'Fisioterapia' },
            { label: 'Medicina Intensiva', value: 'Medicina Intensiva' },
            { label: 'Medicina General', value: 'Medicina General' },
            { label: 'Terapia Ocupacional', value: 'Terapia Ocupacional' },
            { label: 'Enfermería', value: 'Enfermería' },
            { label: 'Dermatología', value: 'Dermatología' },
          ],
        },
      ],
    },
    {
      fields: [
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter additional notes',
        },
        {
          name: 'pathology',
          label: 'Pathology',
          placeholder: 'Enter pathology (if any)',
        },
        {
          name: 'reason_for_visit',
          label: 'Reason for visit',
          placeholder: 'Enter reason for visit',
        },
      ],
    },
  ]
  const handleFinish = async (purpose, formData) => {
    if (purpose === 'appointments') {
      const newAppointment = {
        ...formData,
        id: String(Date.now()), // Generate a temporary unique ID
        scheduled_at: formData.scheduled_at,
        status: formData.status || 'pending',
        city: formData.city || '',
        notes: formData.notes || '',
        pathology: formData.pathology || '',
        reason_for_visit: formData.reason_for_visit || '',
      }

      // Simulate a backend call
      const response = await fetch('http://localhost:8000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })

      const savedAppointment = await response.json()

      setAppointments((prev) => [...prev, savedAppointment])
      setFilteredAppointments((prev) => [...prev, savedAppointment])
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
          { label: 'Canceled by patient', value: 'Canceled by patient' },
          { label: 'Canceled by professional', value: 'Canceled by professional' },
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

  useEffect(() => {
    fetch('http://localhost:8000/appointments')
      .then((res) => res.json())
      .then((data) => {
        setAppointments(data)
        setFilteredAppointments(data)
      })
  }, [])

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'info'
      case 'completed':
        return 'success'
      case 'canceled by patient':
        return 'danger'
      case 'canceled by professional':
        return 'dark'
      default:
        return 'secondary'
    }
  }

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
          <div className="mb-3">
            <CAlert
              color={alert.type}
              className="text-center"
              style={{
                maxWidth: '400px',
                margin: '0 auto',
                fontSize: '14px',
                padding: '5px',
              }}
            >
              {alert.message}
            </CAlert>
          </div>
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
                <strong>Scheduled At:</strong> {selectedAppointment.scheduled_at}
              </p>
              <p>
                <strong>Status:</strong> {selectedAppointment.status}
              </p>
              <p>
                <strong>City:</strong> {selectedAppointment.city}
              </p>
              <p>
                <strong>Category:</strong> {selectedAppointment.category}
              </p>
              <p>
                <strong>Specialty:</strong> {selectedAppointment.specialty}
              </p>
              <p>
                <strong>Pathology:</strong>{' '}
                {selectedAppointment.pathology || 'No pathology available'}
              </p>
              <p>
                <strong>Notes:</strong> {selectedAppointment.notes || 'No notes available'}
              </p>
              <p>
                <strong>Reason for visit:</strong>{' '}
                {selectedAppointment.reason_for_visit || 'No notes available'}
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
      />
    </>
  )
}

export default Appointments
