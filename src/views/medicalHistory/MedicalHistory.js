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
import ModalDownloadPDF from '../../components/ModalDownloadPDF'

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
import { useTranslation } from 'react-i18next'

const API_URL = 'https://aplication-backend-production-872f.up.railway.app/api/medical_record'
const getToken = () => localStorage.getItem('authToken')

const MedicalHistory = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
  const [downloadModalVisible, setDownloadModalVisible] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const ModalAddRef = useRef()

  // Mueve fetchData fuera del useEffect para que esté disponible globalmente
  const fetchData = async () => {
    try {
      // Solo obtenemos los historiales médicos del backend nuevo
      const medicalRecordsRes = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!medicalRecordsRes.ok) throw new Error('Failed to fetch data')
      const medicalRecordsData = await medicalRecordsRes.json()
      // El backend ya devuelve los nombres completos
      setMedicalHistory(medicalRecordsData)
      setFilteredMedicalHistory(medicalRecordsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'MedicalHistory') {
      // Usa directamente el objeto seleccionado
      const selectedAppointment = formData.appointment_raw

      if (!selectedAppointment || typeof selectedAppointment !== 'object') {
        console.error(
          'No se encontró la cita seleccionada o el objeto es inválido.',
          selectedAppointment,
        )
        return
      }
      // Mapeo defensivo de campos
      const patientId = Number(selectedAppointment.patient_id ?? selectedAppointment.patient?.id)
      const professionalId = Number(
        selectedAppointment.professional_id ?? selectedAppointment.professional?.id,
      )
      const appointmentId = Number(selectedAppointment.id ?? selectedAppointment.appointment_id)
      if (!patientId || !professionalId || !appointmentId) {
        console.error('Faltan campos requeridos en la cita seleccionada:', {
          patientId,
          professionalId,
          appointmentId,
          selectedAppointment,
        })
        return
      }
      // Convierte la imagen a base64 si existe y es un File o ya es base64
      let base64Image = null
      if (formData.attachment_image instanceof File) {
        base64Image = await fileToBase64(formData.attachment_image)
      } else if (
        typeof formData.attachment_image === 'string' &&
        formData.attachment_image.startsWith('data:image/')
      ) {
        base64Image = formData.attachment_image
      } else {
        base64Image = null
      }
      // Crea el nuevo historial médico
      const newMedicalHistory = {
        patient_id: patientId,
        professional_id: professionalId,
        appointment_id: appointmentId,
        general_notes: formData.general_notes || '',
        image: base64Image,
      }
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(newMedicalHistory),
        })
        if (!response.ok) throw new Error('Failed to save medical history.')
        // Notificación de éxito
        Notifications.showAlert(setAlert, 'Medical history added successfully.', 'success', 5000)
        // Espera a que el backend procese y luego recarga la lista completa
        ModalAddRef.current.close()
        await fetchData()
      } catch (error) {
        console.error('Error saving medical history:', error)
      }
    }
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

  const medicalHistorySteps = [
    {
      fields: [
        {
          name: 'appointment_id',
          label: 'ID de la Cita',
          type: 'custom',
          placeholder: 'Seleccione la cita',
          options: [], // Mapeo a customFields
        },
        {
          name: 'created_at',
          type: 'custom',
          label: 'Fecha de Creación',
          placeholder: 'Seleccione la fecha y hora',
          custom: 'created_at', // Mapeo a customFields
        },
      ],
    },
    {
      fields: [
        {
          name: 'general_notes',
          label: 'Notas Generales',
          type: 'textarea',
          placeholder: 'Ingrese notas adicionales',
        },
      ],
    },
    {
      fields: [
        {
          name: 'attachment_image',
          label: 'Adjuntar Imagen',
          type: 'file',
          placeholder: 'Cargar una imagen',
          accept: 'image/*',
        },
      ],
    },
  ]

  // Nueva función para cargar citas desde el backend con token y búsqueda
  const loadAppointments = async (inputValue = '') => {
    try {
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/appointments?search=${encodeURIComponent(inputValue)}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      )
      if (!res.ok) throw new Error('No se pudieron cargar las citas')

      const data = await res.json()

      // El value ahora es el objeto completo de la cita
      return data.map((appt) => ({
        label: `${appt.id} - Paciente: ${appt.patient_full_name} - Profesional: ${appt.professional_full_name} (${appt.reason_for_visit || 'Motivo no especificado'})`,
        value: appt, // value es el objeto completo
      }))
    } catch (error) {
      console.error('Error cargando citas:', error)
      return []
    }
  }

  // Componente seguro para hooks
  const AppointmentAsyncSelect = ({ value, onChange, placeholder }) => {
    const [selectValue, setSelectValue] = useState(null)

    useEffect(() => {
      if (value && typeof value === 'object') {
        setSelectValue({
          label: `${value.id} - Paciente: ${value.patient_full_name} - Profesional: ${value.professional_full_name} (${value.reason_for_visit || 'Motivo no especificado'})`,
          value: value.id,
          _full: value, // guardamos el objeto completo para el onChange
        })
      } else {
        setSelectValue(null)
      }
    }, [value])

    return (
      <AsyncSelect
        cacheOptions
        loadOptions={async (inputValue) => {
          const options = await loadAppointments(inputValue)
          // value: id, _full: objeto completo
          return options.map((opt) => ({
            label: opt.label,
            value: opt.value.id,
            _full: opt.value,
          }))
        }}
        defaultOptions={true}
        value={selectValue}
        onChange={(option) => {
          setSelectValue(option)
          // Pasa el id como appointment_id y el objeto completo como _selectedAppointment
          onChange(option ? option._full : null)
        }}
        placeholder={placeholder || 'Seleccione una cita'}
        isClearable
        styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
      />
    )
  }

  // Custom handlers for fields
  const customFields = {
    appointment_id: (props) => (
      <AppointmentAsyncSelect
        {...props}
        value={
          typeof props.value === 'object' ? props.value.id : props.value // Si ya es el id, úsalo directo
        }
        onChange={(option) => {
          // option es el objeto completo de la cita o null
          props.onChange(option ? option.id : '')
          if (props.setFormData) {
            props.setFormData((prev) => ({
              ...prev,
              appointment_raw: option || null,
            }))
          }
        }}
      />
    ),
    created_at: ({ value, onChange, placeholder }) => (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label="Created At"
          value={value ? new Date(value) : null}
          onChange={(newValue) => onChange(newValue ? new Date(newValue).toISOString() : '')}
          format="dd/MM/yyyy HH:mm"
          slotProps={{
            textField: {
              variant: 'standard',
              fullWidth: true,
              placeholder,
            },
          }}
        />
      </LocalizationProvider>
    ),
  }

  const addMedicalHistory = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (medicalHistory) => {
    try {
      const response = await fetch(`${API_URL}/${medicalHistory.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
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

  const handleEdit = async (medicalHistory) => {
    try {
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/medical_record/${medicalHistory.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
        },
      )
      if (res.ok) {
        const data = await res.json()
        navigate(`/medicalHistory/${medicalHistory.id}`, { state: { medicalHistory: data } })
      } else {
        navigate(`/medicalHistory/${medicalHistory.id}`, { state: { medicalHistory } })
      }
    } catch {
      navigate(`/medicalHistory/${medicalHistory.id}`, { state: { medicalHistory } })
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
      default:
        label = key.charAt(0).toUpperCase() + key.slice(1) // Capitalizar el primer carácter
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

    // Mapeo de claves de filtro a propiedades reales
    const filterKeyMap = {
      patient: 'patient_full_name',
      professional: 'professional_full_name',
    }

    const activeFilters = Object.keys(otherFilters).filter((key) => otherFilters[key].trim() !== '')

    const filtered = medicalHistory.filter((medicalHistory) => {
      const medicalHistoryDate = new Date(medicalHistory.created_at)
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
        // Usar el mapeo si existe, si no, usar la key original
        const realKey = filterKeyMap[key] || key
        const medicalHistoryValue = medicalHistory[realKey]
          ? normalizeText(medicalHistory[realKey])
          : ''
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

  // AsyncSelect para pacientes asociados al profesional logueado, usando nueva URL del backend
  const loadPatients = async (inputValue = '') => {
    try {
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/pdf/my-patients?search=${encodeURIComponent(inputValue)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      )
      if (!res.ok) throw new Error('No se pudieron cargar los pacientes')
      const data = await res.json()
      // data debe ser un array de pacientes con id y nombre completo
      const filtered = data
        .filter((patient) =>
          inputValue
            ? (patient.full_name || '').toLowerCase().includes(inputValue.toLowerCase())
            : true,
        )
        .slice(0, 5)
        .map((patient) => ({
          label: patient.full_name,
          value: patient.id,
          fullName: patient.full_name,
        }))
      return filtered
    } catch (error) {
      console.error('Error cargando pacientes:', error)
      return []
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedPatient) return
    try {
      const hasHistory = medicalHistory.some(
        (record) => record.patient_full_name === selectedPatient.label,
      )
      if (!hasHistory) {
        Notifications.showAlert(
          setAlert,
          'El paciente no tiene registro en historial médico.',
          'warning',
          5000,
        )
        return
      }
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/pdf?patient_id=${selectedPatient.value}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      )
      if (!res.ok) throw new Error('No se pudo descargar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_medico_${selectedPatient.value}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setDownloadModalVisible(false)
    } catch (error) {
      Notifications.showAlert(setAlert, 'Error al descargar el PDF.', 'danger', 5000)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addMedicalHistory()}>
          <CIcon icon={cilPlus} className="me-2" /> Add Medical History
        </CButton>
        <CButton color="secondary" className="ms-2" onClick={() => setDownloadModalVisible(true)}>
          Descargar PDF
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>{t('Medical history')}</CCardHeader>
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
                <CTableHeaderCell className="table-header">{t('Appointment')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Created at')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header avatar-header">
                  {t('Actions')}
                </CTableHeaderCell>
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
                    <CTableDataCell>{record.patient_full_name}</CTableDataCell>
                    <CTableDataCell>{record.professional_full_name}</CTableDataCell>
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
                          <CIcon icon={cilTrash} style={{ '--ci-primary-color': 'white' }} />
                        </CButton>
                        <CButton color="info" size="sm" onClick={() => handleInfo(record)}>
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
          if (selectedMedicalHistory) {
            handleDelete(selectedMedicalHistory) // Call handleDelete with the selected appointment
          }
          setVisible(false) // Close the modal after confirming
        }}
        title={t('Confirm medical history deletion')}
        message={t('Are you sure you want to delete this medical history?')}
      />

      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={t('Medical History Information')}
        content={
          selectedMedicalHistory ? (
            <div>
              <p>
                <strong>{t('Patient')}:</strong> {selectedMedicalHistory.patient_full_name}
              </p>
              <p>
                <strong>{t('Professional')}:</strong>{' '}
                {selectedMedicalHistory.professional_full_name}
              </p>
              <p>
                <strong>{t('Appointment')}:</strong> {selectedMedicalHistory.appointment_id}
              </p>
              <p>
                <strong>{t('Created at')}:</strong>{' '}
                {formatDate(selectedMedicalHistory.created_at, 'DATETIME')}
              </p>
              <p>
                <strong>{t('General notes')}:</strong>{' '}
                {selectedMedicalHistory.general_notes || 'No notes available'}
              </p>
              {selectedMedicalHistory.image ? (
                <div>
                  <strong>{t('Attached Image: ')}</strong>
                  <div>
                    <img
                      src={selectedMedicalHistory.image}
                      alt="Attached"
                      style={{ maxWidth: '100%', marginTop: '10px' }}
                    />
                  </div>
                </div>
              ) : (
                <p>{t('No image attached')}.</p>
              )}
            </div>
          ) : (
            <p>{t('No information available')}.</p>
          )
        }
      />

      <ModalAdd
        ref={ModalAddRef}
        title={t('Add new medical history')}
        steps={medicalHistorySteps}
        onFinish={handleFinish}
        purpose="MedicalHistory"
        customFields={customFields}
      />

      <ModalDownloadPDF
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        loadPatients={loadPatients}
        onDownload={handleDownloadPDF}
      />
    </>
  )
}

export default MedicalHistory
