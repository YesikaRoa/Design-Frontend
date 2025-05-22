import React, { useEffect, useState, useRef } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import Notifications from '../../components/Notifications'

import '../appointments/styles/appointments.css'
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

const MedicalHistory = () => {
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [medicalHistory, setMedicalHistory] = useState([])
  const [appointments, setAppointments] = useState([])
  const [FilteredMedicalHistory, setFilteredMedicalHistory] = useState([])
  const [filters, setFilters] = useState({
    patient: '',
    professional: '',
    startDate: null,
    endDate: null,
  })
  const [visible, setVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [selectedMedicalHistory, setselectedMedicalHistory] = useState(null)
  const ModalAddRef = useRef()
  const [userMap, setUserMap] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching data...')
      try {
        const [appointmentsRes, medicalRecordsRes, usersRes] = await Promise.all([
          fetch('http://localhost:8000/appointments'),
          fetch('http://localhost:8000/medical_records'),
          fetch('http://localhost:8000/users'), // Endpoint de usuarios
        ])

        if (!appointmentsRes.ok || !medicalRecordsRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const appointmentsData = await appointmentsRes.json()
        const medicalRecordsData = await medicalRecordsRes.json()
        const usersData = await usersRes.json()

        // Filtrar usuarios con roles profesionales
        const professionalRoles = ['Doctor', 'Therapist', 'Nurse']
        const professionals = usersData.filter((user) => professionalRoles.includes(user.role_id))

        // Crear un mapa de IDs de usuarios a sus nombres y especialidades
        const userMapData = usersData.reduce((acc, user) => {
          acc[user.id] = {
            name: `${user.first_name} ${user.last_name}`,
            specialty: user.specialty || 'Especialidad no definida',
          }
          return acc
        }, {})
        setUserMap(userMapData)

        const enrichedAppointments = appointmentsData.map((appt) => ({
          ...appt,
          patientName: userMapData[appt.patient]?.name || 'Paciente no identificado',
          professionalName: userMapData[appt.professional]?.name || 'Profesional no identificado',
        }))

        // Enriquecer los registros médicos con información de usuarios
        const enrichedMedicalRecords = medicalRecordsData.map((record) => {
          const professional = userMapData[record.professional_id] || {
            name: 'Profesional no identificado',
            specialty: 'Especialidad no definida',
          }

          return {
            ...record,
            patient: userMapData[record.patient_id]?.name || 'Paciente no identificado',
            professional: professional.name,
            professional_specialty: professional.specialty,
          }
        })

        setAppointments(enrichedAppointments)
        setMedicalHistory(enrichedMedicalRecords) // Actualizar historial médico enriquecido
        setFilteredMedicalHistory(enrichedMedicalRecords) // Filtro inicial
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'MedicalHistory') {
      const selectedAppointment = appointments.find((appt) => appt.id === formData.appointment_id)

      if (!selectedAppointment) {
        console.error('No se encontró la cita seleccionada.')
        return
      }

      const newMedicalHistory = {
        ...formData,
        id: String(Date.now()),
        created_at: formData.created_at,
        appointment_id: formData.appointment_id,
        patient_id: selectedAppointment.patient,
        professional_id: selectedAppointment.professional,
        general_notes: formData.general_notes || '',
        attachment_image_url:
          formData.attachment_image instanceof File
            ? URL.createObjectURL(formData.attachment_image)
            : null,
        attachment_document_url:
          formData.attachment_document instanceof File
            ? URL.createObjectURL(formData.attachment_document)
            : null,
      }

      try {
        const response = await fetch('http://localhost:8000/medical_records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMedicalHistory),
        })

        if (!response.ok) {
          throw new Error('Failed to save medical history.')
        }

        const savedMedicalHistory = await response.json()

        const enrichedRecord = {
          ...savedMedicalHistory,
          patient: userMap[savedMedicalHistory.patient_id]?.name || 'Paciente no identificado',
          professional:
            userMap[savedMedicalHistory.professional_id]?.name || 'Profesional no identificado',
          professional_specialty:
            userMap[savedMedicalHistory.professional_id]?.specialty || 'Especialidad no definida',
        }

        setMedicalHistory((prev) => [...prev, enrichedRecord])
        setFilteredMedicalHistory((prev) => [...prev, enrichedRecord])

        ModalAddRef.current.close()
      } catch (error) {
        console.error('Error saving medical history:', error)
      }
    }
  }
  const appointmentIdOptions = appointments.map((appt) => ({
    label: `${appt.id} - Patient: ${appt.patientName} - Professional: ${appt.professionalName} - ${appt.reason_for_visit || 'Motivo no especificado'} (${appt.scheduled_at || 'Sin fecha'})`,
    value: appt.id,
  }))

  const medicalHistorySteps = [
    {
      fields: [
        {
          name: 'appointment_id',
          label: 'Appointment ID',
          type: 'select',
          placeholder: 'Select appointment',
          options: appointmentIdOptions,
          required: true,
        },
        {
          name: 'created_at',
          type: 'datetime-local',
          label: 'Created at',
          placeholder: 'Select date and time',
          required: true,
        },
      ],
    },
    {
      fields: [
        {
          name: 'general_notes',
          label: 'General notes',
          type: 'textarea',
          placeholder: 'Enter additional notes',
        },
      ],
    },
    {
      fields: [
        {
          name: 'attachment_image',
          label: 'Attach Image',
          type: 'file',
          placeholder: 'Upload an image',
          accept: 'image/*',
        },
        {
          name: 'attachment_document',
          label: 'Attach Document',
          type: 'file',
          placeholder: 'Upload a document',
          accept: '.pdf, .doc, .docx, .txt',
        },
      ],
    },
  ]

  const addMedicalHistory = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (medicalHistory) => {
    try {
      const response = await fetch(`http://localhost:8000/medical_records/${medicalHistory.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        Notifications.showAlert(setAlert, 'medicalHistory deleted successfully.', 'success', 5000)
        setMedicalHistory((prev) => prev.filter((a) => a.id !== medicalHistory.id))
        setFilteredMedicalHistory((prev) => prev.filter((a) => a.id !== medicalHistory.id))
      } else {
        throw new Error('Failed to delete the medicalHistory.')
      }
    } catch (error) {
      console.error('Error deleting medicalHistory:', error)
      Notifications.showAlert(setAlert, 'There was an error deleting the medicalHistory.', 'danger')
    }
  }
  const handleInfo = (medicalHistory) => {
    setselectedMedicalHistory(medicalHistory)
    setInfoVisible(true)
  }

  const handleEdit = (medicalHistory) => {
    navigate(`/medicalHistory/${medicalHistory.id}`, { state: { medicalHistory } })
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

    const filtered = medicalHistory.filter((medicalHistory) => {
      const medicalHistoryDate = new Date(medicalHistory.created_at)

      // Normalizar las fechas eliminando las horas
      const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

      const normalizedMedicalHistoryDate = normalizeDate(medicalHistoryDate)
      const normalizedStartDate = startDate ? normalizeDate(startDate) : null
      const normalizedEndDate = endDate ? normalizeDate(endDate) : null

      const startCondition = normalizedStartDate
        ? normalizedMedicalHistoryDate >= normalizedStartDate
        : true
      const endCondition = normalizedEndDate
        ? normalizedMedicalHistoryDate <= normalizedEndDate
        : true

      const otherConditions = activeFilters.every((key) => {
        const medicalHistoryValue = medicalHistory[key] ? normalizeText(medicalHistory[key]) : ''
        const filterValue = normalizeText(otherFilters[key])
        return medicalHistoryValue.startsWith(filterValue)
      })

      return startCondition && endCondition && otherConditions
    })

    setFilteredMedicalHistory(filtered)
  }

  const resetFilters = () => {
    const resetValues = Object.keys(filters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    setFilters(resetValues)
    setFilteredMedicalHistory(medicalHistory)
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addMedicalHistory()}>
          <CIcon icon={cilPlus} className="me-2" /> Add Medical History
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>Medical History</CCardHeader>
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
                <CTableHeaderCell className="table-header">Specialty</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Appointment</CTableHeaderCell>
                <CTableHeaderCell className="table-header">created_at</CTableHeaderCell>
                <CTableHeaderCell className="table-header avatar-header">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {FilteredMedicalHistory.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    No appointments available
                  </CTableDataCell>
                </CTableRow>
              ) : (
                FilteredMedicalHistory.map((record, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{record.patient}</CTableDataCell>
                    <CTableDataCell>{record.professional}</CTableDataCell>
                    <CTableDataCell>{record.professional_specialty}</CTableDataCell>
                    <CTableDataCell>{record.appointment_id}</CTableDataCell>
                    <CTableDataCell>{formatDate(record.created_at, 'DATETIME')}</CTableDataCell>
                    <CTableDataCell>
                      {/* Actions */}
                      <div className="d-flex gap-2 justify-content-center">
                        <CButton color="primary" size="sm" onClick={() => handleEdit(record)}>
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setselectedMedicalHistory(record)
                            setVisible(true)
                          }}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                        <CButton color="info" size="sm" onClick={() => handleInfo(record)}>
                          <CIcon icon={cilInfo} />
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
          if (selectedMedicalHistory) {
            handleDelete(selectedMedicalHistory) // Call handleDelete with the selected appointment
          }
          setVisible(false) // Close the modal after confirming
        }}
        title="Confirm medical history deletion"
        message="Are you sure you want to delete this medical history?"
      />

      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Medical History Information"
        content={
          selectedMedicalHistory ? (
            <div>
              <p>
                <strong>Patient:</strong> {selectedMedicalHistory.patient}
              </p>
              <p>
                <strong>Professional:</strong> {selectedMedicalHistory.professional}
              </p>
              <p>
                <strong>Specialty:</strong> {selectedMedicalHistory.professional_specialty || 'N/A'}
              </p>
              <p>
                <strong>Appointment:</strong> {selectedMedicalHistory.appointment_id}
              </p>
              <p>
                <strong>Created At:</strong> {selectedMedicalHistory.created_at}
              </p>
              <p>
                <strong>General notes:</strong>{' '}
                {selectedMedicalHistory.general_notes || 'No notes available'}
              </p>
              {selectedMedicalHistory.attachment_image_url ? (
                <div>
                  <strong>Attached Image:</strong>
                  <img
                    src={selectedMedicalHistory.attachment_image_url}
                    alt="Attached"
                    style={{ maxWidth: '100%', marginTop: '10px' }}
                  />
                </div>
              ) : (
                <p>No image attached.</p>
              )}
              {selectedMedicalHistory.attachment_document_url ? (
                <div>
                  <strong>Attached Document:</strong>
                  <a
                    href={selectedMedicalHistory.attachment_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: '10px' }}
                  >
                    View Document
                  </a>
                </div>
              ) : (
                <p>No document attached.</p>
              )}
            </div>
          ) : (
            <p>No information available.</p>
          )
        }
      />

      <ModalAdd
        ref={ModalAddRef}
        title="Add new medical history"
        steps={medicalHistorySteps}
        onFinish={handleFinish}
        purpose="MedicalHistory"
      />
    </>
  )
}

export default MedicalHistory
