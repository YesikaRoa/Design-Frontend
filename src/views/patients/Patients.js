import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import Notifications from '../../components/Notifications'
import { formatDate } from '../../utils/dateUtils'

import '../users/styles/users.css'
import '../users/styles/filter.css'
import { useTranslation } from 'react-i18next'

import {
  CTable,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CAvatar,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CAlert,
  CBadge,
  CTableHead,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilPencil, cilInfo, cilTrash, cilUserPlus } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'

export const Patients = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filters, setFilters] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: '',
  })
  const [visible, setVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [selectedPatient, setselectedPatient] = useState(null)
  const ModalAddRef = useRef()
  const [alert, setAlert] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const token = localStorage.getItem('authToken')
  const [formDataState, setFormData] = useState({})

  useEffect(() => {
    const convertDefaultAvatarToBase64 = async () => {
      try {
        const response = await fetch(defaultAvatar)
        const blob = await response.blob()

        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData({
            avatar: reader.result, // Base64 string
          })
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error converting default avatar to Base64:', error)
      }
    }
    convertDefaultAvatarToBase64()
  }, [])
  // Cambia handleFinish para guardar en ambos endpoints
  const handleFinish = async (purpose, formData) => {
    if (purpose === 'users') {
      try {
        // Crear el objeto para enviar al backend
        const payload = {
          user: {
            first_name: formData.first_name || '',
            last_name: formData.last_name || '',
            email: formData.email || '',
            address: formData.address || '',
            phone: formData.phone || '',
            birth_date: formData.birth_date ? formData.birth_date : null, // Enviar la fecha tal cual
            gender: formData.gender || null,
            avatar: formData.avatar || formDataState.avatar || null,
            role_id: 2, // Paciente por defecto
            status: formData.status || 'Active',
          },
          medical_data: formData.medical_data || '', // Datos médicos obligatorios
        }

        // Hacer la solicitud al backend
        const response = await fetch(
          'https://aplication-backend-production-872f.up.railway.app/api/patients',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Asegúrate de pasar el token
            },
            body: JSON.stringify(payload),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()

          if (errorData.issues && Array.isArray(errorData.issues)) {
            // Formatear los errores de Zod
            const messages = errorData.issues
              .map((issue) =>
                Array.isArray(issue.path)
                  ? `${issue.path.join('.')} - ${issue.message}`
                  : `${issue.path || 'unknown'} - ${issue.message}`,
              )
              .join('\n')

            // Mostrar alertas con los errores
            Notifications.showAlert(setAlert, messages, 'danger')
          } else {
            Notifications.showAlert(
              setAlert,
              errorData.message || 'An error occurred during validation',
              'danger',
            )
          }
          return // Detener el flujo si hay errores
        }

        const data = await response.json()
        Notifications.showAlert(setAlert, 'Patient created successfully!', 'success')
        await fetchPatients()
      } catch (error) {
        console.error(error)
        Notifications.showAlert(
          setAlert,
          'An unexpected error occurred while creating the patient.',
          'error',
        )
      }
    }
  }

  const userSteps = [
    {
      fields: [
        {
          name: 'first_name',
          label: 'Nombre',
          placeholder: 'Ingrese el nombre',
          required: true,
        },
        {
          name: 'last_name',
          label: 'Apellido',
          placeholder: 'Ingrese el apellido',
          required: true,
        },
        {
          name: 'birth_date',
          type: 'date',
          label: 'Fecha de Nacimiento',
          placeholder: 'Ingrese la fecha de nacimiento',
          required: true,
        },
        {
          name: 'gender',
          label: 'Género',
          type: 'select',
          required: true,
          options: [
            { label: 'Femenino', value: 'F' },
            { label: 'Masculino', value: 'M' },
          ],
        },
      ],
    },
    {
      fields: [
        {
          name: 'email',
          label: 'Correo Electrónico',
          type: 'email',
          placeholder: 'Ingrese el correo electrónico',
          required: true,
        },
        {
          name: 'phone',
          label: 'Teléfono',
          placeholder: 'Ingrese el número de teléfono',
        },
        {
          name: 'address',
          label: 'Dirección',
          placeholder: 'Ingrese la dirección',
        },
      ],
    },
    {
      fields: [
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          required: true,
          options: [
            { label: 'Activo', value: 'Active' },
            { label: 'Inactivo', value: 'Inactive' },
          ],
        },
        {
          name: 'medical_data',
          label: 'Datos Médicos',
          type: 'textarea',
          placeholder: 'Ingrese los datos médicos',
          required: false,
        },
      ],
    },
  ]

  const addUser = () => {
    ModalAddRef.current.open()
  }

  const handleDeleteClick = (user) => {
    if (!user || !user.id) {
      console.error('Invalid user selected for deletion.')
      return
    }
    setUserToDelete(user)
    setVisible(true)
  }

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        // Solicitud DELETE al backend
        const response = await fetch(
          `https://aplication-backend-production-872f.up.railway.app/api/patients/${userToDelete.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Si usas autenticación basada en tokens
            },
          },
        )

        if (response.ok) {
          await fetchPatients()
          Notifications.showAlert(setAlert, 'Usuario eliminado con éxito', 'success')
        } else {
          const errorData = await response.json()
          Notifications.showAlert(
            setAlert,
            errorData.message || 'No se pudo eliminar el usuario. Inténtalo de nuevo.',
            'danger',
          )
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error)
        Notifications.showAlert(setAlert, 'Ocurrió un error eliminando el usuario.', 'danger')
      } finally {
        setVisible(false)
        setUserToDelete(null)
      }
    }
  }
  const handleInfo = async (user) => {
    try {
      // Establecer un estado de carga (opcional)
      setInfoVisible(false)
      setselectedPatient(null)

      // Realizar la solicitud al backend
      const res = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/patients/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Asegúrate de definir el token si es necesario
          },
        },
      )

      if (!res.ok) {
        // Manejar respuestas no exitosas del backend
        throw new Error(`Error fetching patient data: ${res.status}`)
      }

      // Procesar los datos de la respuesta
      const data = await res.json()
      setselectedPatient(data)
    } catch (error) {
      console.error('Error fetching patient info:', error)
      // Establecer un valor predeterminado si ocurre un error
      setselectedPatient({ ...user, medical_data: '' })
    } finally {
      // Asegurarse de que la información esté visible independientemente del resultado
      setInfoVisible(true)
    }
  }

  const handleEdit = async (user) => {
    try {
      const response = await fetch(
        `https://aplication-backend-production-872f.up.railway.app/api/patients/${user.id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        },
      )

      if (!response.ok) {
        throw new Error('Error fetching professional details')
      }

      const professionalData = await response.json()
      // Guardar los datos obtenidos en localStorage
      localStorage.setItem('selectedPatient', JSON.stringify(professionalData))

      // Navegar usando los datos obtenidos
      navigate(`/patients/${user.id}`)
    } catch (error) {
      console.error('Error fetching professional details for edit:', error)
    }
  }

  // Construcción dinámica de los inputs
  const dataFilter = Object.keys(filters).map((key) => {
    let label
    let type = 'text' // Por defecto, el tipo es 'text'
    let options = [] // Opciones para los select

    switch (key) {
      case 'first_name':
        label = 'Primer nombre'
        break
      case 'last_name':
        label = 'Apellido'
        break
      case 'Email':
        label = 'Correo Electrónico'
        break
      case 'status':
        label = 'Estado'
        type = 'select' // Cambiar a tipo select
        options = [
          { label: 'Activo', value: 'Active' },
          { label: 'Inactivo', value: 'Inactive' },
        ]
        break
      default:
        label = key.charAt(0).toUpperCase() + key.slice(1)
    }

    return {
      name: key,
      label,
      placeholder: `Buscar por ${label}`,
      type,
      options, // Agregar las opciones si es un select
      value: filters[key],
      onChange: (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value })),
    }
  })
  const normalizeText = (text) =>
    text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // elimina acentos
      .trim() // elimina espacios adicionales
      .toLowerCase()

  const handleFilter = () => {
    const activeFilters = Object.keys(filters).filter((key) => filters[key].trim() !== '')

    const filtered = users.filter((user) =>
      activeFilters.every((key) => {
        const userValue = user[key] ? normalizeText(user[key]) : ''
        const filterValue = normalizeText(filters[key])
        return userValue.startsWith(filterValue)
      }),
    )

    setFilteredUsers(filtered)
  }

  const resetFilters = () => {
    const resetValues = Object.keys(filters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    setFilters(resetValues)
    setFilteredUsers(users)
  }
  const fetchPatients = async () => {
    try {
      const response = await fetch(
        'https://aplication-backend-production-872f.up.railway.app/api/patients',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        },
      )

      if (response.ok) {
        const data = await response.json()
        const normalizedUsers = data.map((user) => ({
          ...user,
          id: String(user.id), // Ajusta el campo según corresponda
        }))
        setUsers(normalizedUsers)
        setFilteredUsers(normalizedUsers)
      } else {
        console.error('Error fetching professionals')
      }
    } catch (error) {
      console.error('Error fetching professionals:', error)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addUser()}>
          <CIcon icon={cilUserPlus} className="me-2" /> {t('Add patient')}
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>{t('Patients')}</CCardHeader>
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
                <CTableHeaderCell className="avatar-header">
                  <CIcon icon={cilPeople} />
                </CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('First name')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Last name')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Email')}</CTableHeaderCell>
                <CTableHeaderCell className="table-header">{t('Status')}</CTableHeaderCell>
                <CTableHeaderCell className="avatar-header">{t('Actions')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredUsers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    No hay usuarios disponibles
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell className="text-center">
                      <CAvatar size="md" src={user.avatar || defaultAvatar} />
                    </CTableDataCell>
                    <CTableDataCell>{user.first_name}</CTableDataCell>
                    <CTableDataCell>{user.last_name}</CTableDataCell>
                    <CTableDataCell>{user.email}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={user.status === 'Active' ? 'success' : 'danger'}>
                        {user.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2 justify-content-center">
                        <CButton color="primary" size="sm" onClick={() => handleEdit(user)}>
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton color="danger" size="sm" onClick={() => handleDeleteClick(user)}>
                          <CIcon icon={cilTrash} style={{ '--ci-primary-color': 'white' }} />
                        </CButton>
                        <CButton color="info" size="sm" onClick={() => handleInfo(user)}>
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
        onClose={() => {
          setVisible(false)
          setUserToDelete(null) // Limpia el usuario seleccionado al cerrar la modal
        }}
        onConfirm={confirmDelete}
        title={t('Confirm patient deletion')}
        message={`${t('Are you sure you want to remove')} ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
      />
      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)} // Cierra la modal
        title={t('Patient information')}
        content={
          selectedPatient ? (
            <div>
              <p>
                <strong>{t('First name')}:</strong> {selectedPatient.first_name}
              </p>
              <p>
                <strong>{t('Last name')}:</strong> {selectedPatient.last_name}
              </p>
              <p>
                <strong>{t('Email')}:</strong> {selectedPatient.email}
              </p>
              <p>
                <strong>{t('Address')}:</strong> {selectedPatient.address || 'No address available'}
              </p>
              <p>
                <strong>{t('Phone')}:</strong> {selectedPatient.phone || 'No phone available'}
              </p>
              <p>
                <strong>{t('Birth Date')}:</strong>{' '}
                {formatDate(selectedPatient.birth_date, 'DATE') || 'No birth date available'}
              </p>
              <p>
                <strong>{t('Gender')}:</strong> {selectedPatient.gender === 'F' ? 'Female' : 'Male'}
              </p>
              <p>
                <strong>{t('Status')}:</strong> {selectedPatient.status}
              </p>
              <p>
                <strong>{t('Medical Data')}:</strong>{' '}
                {selectedPatient.medical_data || 'No medical data'}
              </p>
            </div>
          ) : (
            <p>{t('No information available')}.</p>
          )
        }
      />
      <ModalAdd
        ref={ModalAddRef}
        title={t('Add new patient')}
        steps={userSteps}
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Patients
