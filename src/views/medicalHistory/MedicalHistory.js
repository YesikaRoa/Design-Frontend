import React, { useEffect, useState, useRef } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import Notifications from '../../components/Notifications'
import useApi from '../../hooks/useApi'
import axios from 'axios'
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
  CCol,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilInfo, cilTrash, cilPlus } from '@coreui/icons'

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
// Decodificador JWT simple para obtener el rol
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return {}
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

const AppointmentAsyncSelect = ({ value, onChange, placeholder, colorScheme, t, request }) => {
  const [selectValue, setSelectValue] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadAppointments = async (inputValue = '') => {
    const token = localStorage.getItem('authToken')

    if (!token) {
      console.error('Error: No se encontró el token de autenticación.')
      return []
    }

    setLoading(true)
    try {
      const res = await request(
        'get',
        `/appointments?search=${encodeURIComponent(inputValue)}`,
        null,
        { Authorization: `Bearer ${token}` },
      )

      if (!res.success) {
        throw new Error(res.message || t('Could not load appointments'))
      }

      const data = res.data

      return data.map((appt) => ({
        label: `${appt.id} - Paciente: ${appt.patient_full_name} - Profesional: ${appt.professional_full_name} (${appt.reason_for_visit || 'Motivo no especificado'})`,
        value: appt,
      }))
    } catch (error) {
      console.error('Error cargando citas:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (value && typeof value === 'object') {
      setSelectValue({
        label: `${value.id} - Paciente: ${value.patient_full_name} - Profesional: ${value.professional_full_name} (${value.reason_for_visit || 'Motivo no especificado'})`,
        value: value,
      })
    } else {
      setSelectValue(null)
    }
  }, [value])

  const handleOnChange = (option) => {
    setSelectValue(option)
    onChange(option ? option.value : null)
  }

  return (
    <AsyncSelect
      cacheOptions
      loadOptions={loadAppointments}
      defaultOptions
      value={selectValue}
      onChange={handleOnChange}
      placeholder={placeholder || t('Select Appointment')}
      isClearable
      isLoading={loading}
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
  )
}

const MedicalHistory = () => {
  let token = localStorage.getItem('authToken')

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
  const [alert, setAlert] = useState(null)

  const [medicalHistory, setMedicalHistory] = useState(null)
  const [FilteredMedicalHistory, setFilteredMedicalHistory] = useState([])
  const [showEmptyMessage, setShowEmptyMessage] = useState(false)
  const emptyTimerRef = useRef(null)
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const ModalAddRef = useRef()
  // Obtener el rol del token
  const tokenPayload = token ? parseJwt(token) : {}
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const { request, loading } = useApi()
  // Mueve fetchData fuera del useEffect para que esté disponible globalmente
  const fetchData = async () => {
    try {
      const { data, success } = await request('get', '/medical_record', null, headers)

      if (!success || !data) throw new Error(t('An unexpected error occurred.'))
      setMedicalHistory(data)
      setFilteredMedicalHistory(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Evita parpadeo: muestra el mensaje "No hay registros" sólo
  // después de un pequeño retraso cuando la lista está vacía.
  useEffect(() => {
    if (emptyTimerRef.current) {
      clearTimeout(emptyTimerRef.current)
      emptyTimerRef.current = null
    }
    if (!loading && medicalHistory !== null && medicalHistory.length === 0) {
      emptyTimerRef.current = setTimeout(() => setShowEmptyMessage(true), 300)
    } else {
      setShowEmptyMessage(false)
    }
    return () => {
      if (emptyTimerRef.current) {
        clearTimeout(emptyTimerRef.current)
        emptyTimerRef.current = null
      }
    }
  }, [loading, medicalHistory])

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'MedicalHistory') {
      // Aquí usas directamente el objeto completo de la cita seleccionado
      const selectedAppointment = formData.appointment_raw

      // Validar que exista y sea un objeto válido
      if (!selectedAppointment || typeof selectedAppointment !== 'object') {
        console.error(
          'No se encontró la cita seleccionada o el objeto es inválido.',
          selectedAppointment,
        )
        return
      }

      // Mapeo defensivo para extraer los ids requeridos
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

      // Convertir la imagen adjunta a base64 si es necesario
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

      // Construir el objeto para crear el historial médico
      const newMedicalHistory = {
        patient_id: patientId,
        professional_id: professionalId,
        appointment_id: appointmentId,
        general_notes: formData.general_notes || '',
        reason_for_visit: formData.reason_for_visit || '',
        current_illness_history: formData.current_illness_history || '',
        symptoms: formData.symptoms || '',
        physical_exam: formData.physical_exam || '',
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        body_mass_index: formData.body_mass_index ? Number(formData.body_mass_index) : null,
        blood_pressure: formData.blood_pressure || '',
        heart_rate: formData.heart_rate ? Number(formData.heart_rate) : null,
        respiratory_rate: formData.respiratory_rate ? Number(formData.respiratory_rate) : null,
        temperature: formData.temperature ? Number(formData.temperature) : null,
        oxygen_saturation: formData.oxygen_saturation ? Number(formData.oxygen_saturation) : null,
        diagnosis: formData.diagnosis || '',
        differential_diagnosis: formData.differential_diagnosis || '',
        treatment: formData.treatment || '',
        treatment_plan: formData.treatment_plan || '',
        medications_prescribed: formData.medications_prescribed || '',
        laboratory_tests_requested: formData.laboratory_tests_requested || '',
        imaging_tests_requested: formData.imaging_tests_requested || '',
        test_instructions: formData.test_instructions || '',
        follow_up_date: formData.follow_up_date || null,
        evolution_notes: formData.evolution_notes || '',
        image: base64Image ? base64Image : null,
      }


      try {
        const result = await request('post', '/medical_record', newMedicalHistory, headers)
        if (!result.success) {
          console.error('API Error details:', result.error || result.message)
          throw new Error(result.message || t('Failed to save medical history.'))
        }

        Notifications.showAlert(setAlert, t('Medical history added successfully.'), 'success', 3500)
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


  const medicalHistorySteps = React.useMemo(() => [
    {
      fields: [
        {
          name: 'appointment_id',
          label: t('Appointment Id'),
          type: 'custom',
          placeholder: t('Select Appointment'),
          options: [],
        },
        {
          name: 'reason_for_visit',
          label: t('Reason for visit'),
          type: 'textarea',
          placeholder: t('Reason for visit'),
        },
        {
          name: 'weight',
          label: t('Weight'),
          type: 'number',
          placeholder: 'kg',
        },
        {
          name: 'height',
          label: t('Height'),
          type: 'number',
          placeholder: 'cm',
        },
        {
          name: 'body_mass_index',
          label: t('Body mass index'),
          type: 'number',
          placeholder: 'BMI',
        },
        {
          name: 'blood_pressure',
          label: t('Blood pressure'),
          type: 'text',
          placeholder: '120/80',
        },
        {
          name: 'heart_rate',
          label: t('Heart rate'),
          type: 'number',
          placeholder: 'bpm',
        },
        {
          name: 'respiratory_rate',
          label: t('Respiratory rate'),
          type: 'number',
          placeholder: 'bpm',
        },
        {
          name: 'temperature',
          label: t('Temperature'),
          type: 'number',
          placeholder: '°C',
        },
        {
          name: 'oxygen_saturation',
          label: t('Oxygen saturation'),
          type: 'number',
          placeholder: '%',
        },
      ],
    },
    {
      fields: [
        {
          name: 'symptoms',
          label: t('Symptoms'),
          type: 'textarea',
          placeholder: t('Symptoms'),
        },
        {
          name: 'current_illness_history',
          label: t('Current illness history'),
          type: 'textarea',
          placeholder: t('Current illness history'),
        },
        {
          name: 'physical_exam',
          label: t('Physical exam'),
          type: 'textarea',
          placeholder: t('Physical exam'),
        },
        {
          name: 'diagnosis',
          label: t('Diagnosis'),
          type: 'textarea',
          placeholder: t('Diagnosis'),
        },
        {
          name: 'differential_diagnosis',
          label: t('Differential diagnosis'),
          type: 'textarea',
          placeholder: t('Differential diagnosis'),
        },
        {
          name: 'evolution_notes',
          label: t('Evolution notes'),
          type: 'textarea',
          placeholder: t('Evolution notes'),
        },
      ],
    },
    {
      fields: [
        {
          name: 'treatment',
          label: t('Treatment'),
          type: 'textarea',
          placeholder: t('Treatment'),
        },
        {
          name: 'treatment_plan',
          label: t('Treatment plan'),
          type: 'textarea',
          placeholder: t('Treatment plan'),
        },
        {
          name: 'medications_prescribed',
          label: t('Medications prescribed'),
          type: 'textarea',
          placeholder: t('Medications prescribed'),
        },
        {
          name: 'laboratory_tests_requested',
          label: t('Laboratory tests requested'),
          type: 'textarea',
          placeholder: t('Laboratory tests requested'),
        },
        {
          name: 'imaging_tests_requested',
          label: t('Imaging tests requested'),
          type: 'textarea',
          placeholder: t('Imaging tests requested'),
        },
        {
          name: 'test_instructions',
          label: t('Test instructions'),
          type: 'textarea',
          placeholder: t('Test instructions'),
        },
        {
          name: 'follow_up_date',
          label: t('Follow up date'),
          type: 'custom',
          custom: 'follow_up_date',
        },
        {
          name: 'general_notes',
          label: t('General Notes'),
          type: 'textarea',
          placeholder: t('Enter Additional Notes'),
        },
        {
          name: 'attachment_image',
          label: t('Attach Image'),
          type: 'file',
          placeholder: t('Upload Image'),
          accept: 'image/*',
        },
      ],
    },
  ], [t]);

  const customFields = React.useMemo(() => ({
    appointment_id: (props) => (
      <AppointmentAsyncSelect
        {...props}
        colorScheme={colorScheme}
        t={t}
        request={request}
        value={typeof props.value === 'object' ? props.value.id : props.value}
        onChange={(option) => {
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
          label={t('Created at')}
          value={value ? new Date(value) : null}
          onChange={(newValue) => onChange(newValue ? new Date(newValue).toISOString() : '')}
          format="dd/MM/yyyy HH:mm"
          disablePortal
          slotProps={{
            popper: {
              disablePortal: true,
              modifiers: [{ name: 'preventOverflow', enabled: true }],
            },
            textField: {
              variant: 'standard',
              fullWidth: true,
              placeholder,
              InputLabelProps: {
                style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined },
              },
              InputProps: {
                style: { color: colorScheme === 'dark' ? '#fff' : undefined },
              },
              inputProps: {
                style: { color: colorScheme === 'dark' ? '#fff' : undefined },
              },
              FormHelperTextProps: {
                style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined },
              },
            },
          }}
          reduceAnimations
        />
      </LocalizationProvider>
    ),
    follow_up_date: ({ value, onChange, placeholder }) => (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label={t('Follow up date')}
          value={value ? new Date(value) : null}
          onChange={(newValue) => onChange(newValue ? new Date(newValue).toISOString() : '')}
          format="dd/MM/yyyy HH:mm"
          disablePortal
          slotProps={{
            popper: {
              disablePortal: true,
              modifiers: [{ name: 'preventOverflow', enabled: true }],
            },
            textField: {
              variant: 'standard',
              fullWidth: true,
              placeholder,
              InputLabelProps: {
                style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined },
              },
              InputProps: {
                style: { color: colorScheme === 'dark' ? '#fff' : undefined },
              },
              inputProps: {
                style: { color: colorScheme === 'dark' ? '#fff' : undefined },
              },
              FormHelperTextProps: {
                style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined },
              },
            },
          }}
          reduceAnimations
        />
      </LocalizationProvider>
    ),
  }), [colorScheme, t, request]);

  const addMedicalHistory = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (medicalHistory) => {
    try {
      const res = await request('delete', `/medical_record/${medicalHistory.id}`, null, headers)
      if (res.success) {
        Notifications.showAlert(
          setAlert,
          t('Medical History Deleted Successfully'),
          'success',
          3500,
        )
        setMedicalHistory((prev) => prev.filter((a) => a.id !== medicalHistory.id))
        setFilteredMedicalHistory((prev) => prev.filter((a) => a.id !== medicalHistory.id))
      } else {
        throw new Error(t('Failed To Delete Medical History'))
      }
    } catch (error) {
      console.error('Error deleting medicalHistory:', error)
      Notifications.showAlert(setAlert, t('Error Deleting Medical History'), 'danger')
    }
  }
  const handleInfo = (medicalHistory) => {
    setselectedMedicalHistory(medicalHistory)
    setInfoVisible(true)
  }

  const handleEdit = async (medicalHistory) => {
    try {
      const res = await request('get', `/medical_record/${medicalHistory.id}`, null, headers)

      if (res.success && res.data) {
        navigate(`/medicalHistory/${medicalHistory.id}`, { state: { medicalHistory: res.data } })
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
        label = t('Start Date')
        type = 'date' // Cambiar el tipo a 'date'
        break
      case 'endDate':
        label = t('End Date')
        type = 'date' // Cambiar el tipo a 'date'
        break
      case 'patient':
        label = t('Patient')
        break
      case 'professional':
        label = t('Professional')
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

    const filtered = (medicalHistory || []).filter((medicalHistory) => {
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
    setFilteredMedicalHistory(medicalHistory || [])
  }

  // AsyncSelect para pacientes asociados al profesional logueado, usando nueva URL del backend
  const loadPatients = async (inputValue = '') => {
    try {
      const { data, success } = await request(
        'get',
        `/pdf/my-patients?search=${encodeURIComponent(inputValue)}`,
        null,
        headers,
      )
      if (!success || !Array.isArray(data)) throw new Error(t('Could not load patients'))
      const filtered = data
        .filter((patient) =>
          inputValue
            ? (patient.full_name || '').toLowerCase().includes(inputValue.toLowerCase())
            : true,
        )
        .slice(0, 5)
        .map((patient) => ({
          label: `${patient.full_name}`,
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
    if (!selectedPatient || isDownloadingPdf) return

    try {
      setIsDownloadingPdf(true)
      const hasHistory = medicalHistory.some(
        (record) => record.patient_id === selectedPatient.value,
      )

      if (!hasHistory) {
        Notifications.showAlert(setAlert, t('Patient Has No Medical Record'), 'warning', 3500)
        return
      }

      // Usando el hook en lugar de axios:
      const { data, success } = await request(
        'GET',
        `/pdf?patient_id=${selectedPatient.value}`,
        null,
        {
          Authorization: `Bearer ${token}`,
          responseType: 'blob', // <<--- clave para PDF
        },
      )

      if (!success) {
        Notifications.showAlert(setAlert, t('error Downloading PDF'), 'danger', 3500)
        return
      }

      // Crear el archivo descargable
      const blob = data
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
      Notifications.showAlert(setAlert, t('An unexpected error occurred.'), 'danger', 3500)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addMedicalHistory()}>
          <CIcon icon={cilPlus} className="me-2" /> {t('Add Medical History')}
        </CButton>
        {/* Mostrar botón de descargar solo si el rol NO es 1 (no admin) */}
        {tokenPayload.role !== 1 && (
          <CButton
            color="secondary"
            className="ms-2"
            onClick={() => setDownloadModalVisible(true)}
            disabled={isDownloadingPdf}
          >
            {t('Download PDF')}
          </CButton>
        )}
      </div>

      <CCard className="mb-4">
        <CCardHeader>{t('Medical history')}</CCardHeader>
        <div className="filter-container">
          <UserFilter onFilter={handleFilter} resetFilters={resetFilters} dataFilter={dataFilter} />
        </div>
        {alert && (
          <CAlert color={alert.type} className="alert-fixed">
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
              {/* 1. Muestra el Skeleton Loader si loading es true */}
              {medicalHistory === null ||
                (loading && (!medicalHistory || medicalHistory.length === 0)) ||
                (!showEmptyMessage && FilteredMedicalHistory.length === 0) ? (
                // Simula 5 filas de carga
                Array.from({ length: 5 }).map((_, index) => (
                  <CTableRow key={index}>
                    {/* Renderizamos 5 celdas individuales para mantener el ancho de las columnas */}
                    {Array.from({ length: 5 }).map((_, cellIndex) => (
                      <CTableDataCell key={cellIndex}>
                        <div className="skeleton-row" style={{ height: '24px', margin: '10px 0' }}></div>
                      </CTableDataCell>
                    ))}
                  </CTableRow>
                ))
              ) : FilteredMedicalHistory.length === 0 ? (
                // 2. Muestra "No appointments available" si no hay datos
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    {t('No Medical History Available')}
                  </CTableDataCell>
                </CTableRow>
              ) : (
                // 3. Muestra los datos si loading es false y hay registros
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
            <div className={`medical-history-info-modal ${colorScheme === 'dark' ? 'text-light' : 'text-dark'}`}>
              {/* Header Info Banner */}
              <div
                className="info-banner mb-4 p-3 rounded"
                style={{
                  backgroundColor: colorScheme === 'dark' ? 'rgba(56, 73, 219, 0.15)' : 'rgba(56, 73, 219, 0.05)',
                  border: `1px solid ${colorScheme === 'dark' ? 'rgba(56, 73, 219, 0.3)' : 'rgba(56, 73, 219, 0.1)'}`,
                }}
              >
                <CRow className="align-items-center">
                  <CCol md={6}>
                    <div className="mb-2">
                      <label className="small text-uppercase fw-bold text-muted d-block">{t('Patient')}</label>
                      <span className="fs-5 fw-bold text-primary">{selectedMedicalHistory.patient_full_name}</span>
                    </div>
                    <div>
                      <label className="small text-uppercase fw-bold text-muted d-block">{t('Professional')}</label>
                      <span className="fw-medium">{selectedMedicalHistory.professional_full_name}</span>
                    </div>
                  </CCol>
                  <CCol md={6} className="text-md-end">
                    <div className="mb-2">
                      <label className="small text-uppercase fw-bold text-muted d-block">{t('Appointment')}</label>
                      <CBadge color="primary" shape="rounded-pill">#{selectedMedicalHistory.appointment_id}</CBadge>
                    </div>
                    <div>
                      <label className="small text-uppercase fw-bold text-muted d-block">{t('Date')}</label>
                      <span className="small">{formatDate(selectedMedicalHistory.created_at, 'DATETIME')}</span>
                    </div>
                  </CCol>
                </CRow>
              </div>

              {/* General Notes Section */}
              {selectedMedicalHistory.general_notes && (
                <div className="mb-4">
                  <h6 className="text-primary border-bottom pb-2 mb-2 d-flex align-items-center">
                    <CIcon icon={cilInfo} className="me-2" />
                    {t('General notes')}
                  </h6>
                  <p className="px-2 text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {selectedMedicalHistory.general_notes}
                  </p>
                </div>
              )}

              {/* Clinical & Diagnosis Grid */}
              <CRow className="mb-4 g-4">
                <CCol md={6}>
                  <div className="h-100 p-3 rounded" style={{ backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <h6 className="text-primary fw-bold mb-3">{t('Clinical History')}</h6>

                    {[
                      { label: t('Reason for visit'), value: selectedMedicalHistory.reason_for_visit },
                      { label: t('Symptoms'), value: selectedMedicalHistory.symptoms },
                      { label: t('Current illness history'), value: selectedMedicalHistory.current_illness_history, fullWidth: true },
                      { label: t('Physical exam'), value: selectedMedicalHistory.physical_exam, fullWidth: true },
                    ].map((item, idx) => (
                      <div key={idx} className="mb-3 ps-1">
                        <label className="d-block small text-muted text-uppercase fw-semibold mb-1">{item.label}</label>
                        <div className="fw-medium">
                          {item.value || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="h-100 p-3 rounded" style={{ backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <h6 className="text-primary fw-bold mb-3">{t('Diagnosis & Treatment')}</h6>

                    {[
                      { label: t('Diagnosis'), value: selectedMedicalHistory.diagnosis },
                      { label: t('Differential diagnosis'), value: selectedMedicalHistory.differential_diagnosis },
                      { label: t('Treatment'), value: selectedMedicalHistory.treatment },
                      { label: t('Treatment plan'), value: selectedMedicalHistory.treatment_plan },
                      { label: t('Medications prescribed'), value: selectedMedicalHistory.medications_prescribed },
                    ].map((item, idx) => (
                      <div key={idx} className="mb-3 ps-1">
                        <label className="d-block small text-muted text-uppercase fw-semibold mb-1">{item.label}</label>
                        <div className="fw-medium">
                          {item.value || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CCol>
              </CRow>

              {/* Vital Signs Grid - PREMIUM DESIGN */}
              <div
                className="vitals-container mb-4 p-4 rounded"
                style={{
                  backgroundColor: colorScheme === 'dark' ? 'rgba(56, 73, 219, 0.1)' : 'rgba(56, 73, 219, 0.03)',
                  border: `1px solid ${colorScheme === 'dark' ? 'rgba(56, 73, 219, 0.2)' : 'rgba(56, 73, 219, 0.1)'}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h6 className="text-primary fw-bold mb-4 text-center text-uppercase ls-1">{t('Vital Signs')}</h6>
                <CRow className="row-cols-2 row-cols-md-4 g-4">
                  {[
                    { label: t('Weight'), value: selectedMedicalHistory.weight, unit: 'kg' },
                    { label: t('Height'), value: selectedMedicalHistory.height, unit: 'cm' },
                    { label: t('BMI'), value: selectedMedicalHistory.body_mass_index },
                    { label: t('BP'), value: selectedMedicalHistory.blood_pressure },
                    { label: t('Heart Rate'), value: selectedMedicalHistory.heart_rate, unit: 'bpm' },
                    { label: t('RR'), value: selectedMedicalHistory.respiratory_rate, unit: 'bpm' },
                    { label: t('Temp'), value: selectedMedicalHistory.temperature, unit: '°C' },
                    { label: t('O2 Sat'), value: selectedMedicalHistory.oxygen_saturation, unit: '%' },
                  ].map((vital, idx) => (
                    <CCol key={idx}>
                      <div className="vital-card text-center">
                        <div className="small text-uppercase fw-bold mb-1" style={{ fontSize: '0.66rem', color: colorScheme === 'dark' ? 'rgba(255,255,255,0.5)' : '#6c757d' }}>{vital.label}</div>
                        <div className={`fs-5 fw-bold ${colorScheme === 'dark' ? 'text-white' : 'text-primary-emphasis'}`}>
                          {vital.value ? `${vital.value}${vital.unit ? ` ${vital.unit}` : ''}` : '-'}
                        </div>
                      </div>
                    </CCol>
                  ))}
                </CRow>
              </div>

              {/* Tests & Evolution */}
              <div className="p-3 rounded border" style={{ borderColor: 'rgba(56, 73, 219, 0.1)' }}>
                <h6 className="text-primary fw-bold mb-3">{t('Tests & Evolution')}</h6>
                <CRow>
                  <CCol md={7}>
                    {[
                      { label: t('Laboratory tests requested'), value: selectedMedicalHistory.laboratory_tests_requested },
                      { label: t('Imaging tests requested'), value: selectedMedicalHistory.imaging_tests_requested },
                      { label: t('Test instructions'), value: selectedMedicalHistory.test_instructions },
                    ].map((item, idx) => (
                      <div key={idx} className="mb-3">
                        <label className="small fw-bold text-muted">{item.label}:</label>
                        <div className="text-muted small ps-2">{item.value || t('None')}</div>
                      </div>
                    ))}
                  </CCol>
                  <CCol md={5} className="border-start">
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">{t('Follow up date')}:</label>
                      <div className="ps-2 fw-medium">{selectedMedicalHistory.follow_up_date ? formatDate(selectedMedicalHistory.follow_up_date, 'DATE') : 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">{t('Evolution notes')}:</label>
                      <div className="text-muted small ps-2">{selectedMedicalHistory.evolution_notes || t('None')}</div>
                    </div>
                    <div className="mt-4 pt-2 border-top small text-muted">
                      <strong>{t('Updated at')}:</strong> {selectedMedicalHistory.updated_at ? formatDate(selectedMedicalHistory.updated_at, 'DATETIME') : 'N/A'}
                    </div>
                  </CCol>
                </CRow>
              </div>

              {selectedMedicalHistory.image && (
                <div className="mt-4 border-top pt-3 text-center">
                  <h6 className="text-primary mb-3 text-start">{t('Attached Image')}:</h6>
                  <img
                    src={selectedMedicalHistory.image}
                    alt="Medical Record"
                    className="img-fluid rounded shadow-lg border"
                    style={{ maxHeight: '350px', cursor: 'zoom-in', transition: 'transform 0.2s' }}
                    onClick={() => window.open(selectedMedicalHistory.image, '_blank')}
                  />
                </div>
              )}
            </div>
          ) : null
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
        onClose={() => {
          setDownloadModalVisible(false)
          setSelectedPatient(null)
        }}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        loadPatients={loadPatients}
        onDownload={handleDownloadPDF}
        isDownloading={isDownloadingPdf}
      />
    </>
  )
}

export default MedicalHistory
