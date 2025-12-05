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
  const [medicalHistory, setMedicalHistory] = useState([])
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
  // Obtener el rol del token
  const tokenPayload = token ? parseJwt(token) : {}
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const { request, loading } = useApi()
  // Mueve fetchData fuera del useEffect para que esté disponible globalmente
  const fetchData = async () => {
    try {
      const { data, success } = await request('get', '/medical_record', null, headers)

      if (!success || !data) throw new Error('Failed to fetch data')
      setMedicalHistory(data)
      setFilteredMedicalHistory(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
        image: base64Image ? base64Image : null,
      }

      try {
        const { success } = await request('post', '/medical_record', newMedicalHistory, headers)
        if (!success) throw new Error('Failed to save medical history.')

        Notifications.showAlert(setAlert, 'Medical history added successfully.', 'success', 5000)
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

  const AppointmentAsyncSelect = ({ value, onChange, placeholder }) => {
    const { request, loading } = useApi() // Llamamos al hook aquí
    const [selectValue, setSelectValue] = useState(null)

    const loadAppointments = async (inputValue = '') => {
      const token = localStorage.getItem('authToken')

      if (!token) {
        console.error('Error: No se encontró el token de autenticación.')
        return []
      }

      try {
        const res = await request(
          'get',
          `/appointments?search=${encodeURIComponent(inputValue)}`,
          null,
          { Authorization: `Bearer ${token}` },
        )

        if (!res.success) {
          throw new Error(res.message || 'No se pudieron cargar las citas')
        }

        const data = res.data

        // Retornamos el formato esperado directamente
        return data.map((appt) => ({
          label: `${appt.id} - Paciente: ${appt.patient_full_name} - Profesional: ${appt.professional_full_name} (${appt.reason_for_visit || 'Motivo no especificado'})`,
          value: appt, // value es el objeto completo, como querías
        }))
      } catch (error) {
        console.error('Error cargando citas:', error)
        return []
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
      onChange(option ? option.value : null) // Devuelve el objeto completo
    }

    return (
      <AsyncSelect
        cacheOptions
        loadOptions={loadAppointments}
        defaultOptions
        value={selectValue}
        onChange={handleOnChange}
        placeholder={placeholder || 'Seleccione una cita'}
        isClearable
        isLoading={loading} // Usas el estado de carga del hook para mostrar el spinner
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
          disablePortal
          slotProps={{
            popper: {
              disablePortal: true, // ✅ fuerza que el popper viva DENTRO del modal
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
  }

  const addMedicalHistory = () => {
    ModalAddRef.current.open()
  }

  const handleDelete = async (medicalHistory) => {
    try {
      const res = await request('delete', `/medical_record/${medicalHistory.id}`, null, headers)
      if (res.success) {
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
      const { data, success } = await request(
        'get',
        `/pdf/my-patients?search=${encodeURIComponent(inputValue)}`,
        null,
        headers,
      )
      if (!success || !Array.isArray(data)) throw new Error('No se pudieron cargar los pacientes')
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
        Notifications.showAlert(setAlert, 'Error al descargar el PDF.', 'danger', 5000)
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
      Notifications.showAlert(setAlert, 'Error al descargar el PDF.', 'danger', 5000)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addMedicalHistory()}>
          <CIcon icon={cilPlus} className="me-2" /> Add Medical History
        </CButton>
        {/* Mostrar botón de descargar solo si el rol NO es 1 (no admin) */}
        {tokenPayload.role !== 1 && (
          <CButton color="secondary" className="ms-2" onClick={() => setDownloadModalVisible(true)}>
            Descargar PDF
          </CButton>
        )}
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
              {/* 1. Muestra el Skeleton Loader si loading es true */}
              {loading ? (
                // Simula 5 filas de carga
                Array.from({ length: 5 }).map((_, index) => (
                  <CTableRow key={index}>
                    {/* ColSpan es 5 para cubrir todas las columnas de esta tabla */}
                    <CTableDataCell colSpan={5}>
                      <div className="skeleton-row"></div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : FilteredMedicalHistory.length === 0 ? (
                // 2. Muestra "No appointments available" si no hay datos
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No appointments available
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
        onClose={() => {
          setDownloadModalVisible(false)
          setSelectedPatient(null)
        }}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        loadPatients={loadPatients}
        onDownload={handleDownloadPDF}
      />
    </>
  )
}

export default MedicalHistory
