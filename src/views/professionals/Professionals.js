import React, { useEffect, useRef, useState } from 'react'
import useApi from '../../hooks/useApi'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'

import Notifications from '../../components/Notifications'
import { useTranslation } from 'react-i18next'

import '../users/styles/users.css'
import '../users/styles/filter.css'

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
import { formatDate } from '../../utils/dateUtils'

export const Professionls = () => {
  const { request, loading } = useApi()
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)
  const [filteredUsers, setFilteredUsers] = useState([])
  const [showEmptyMessage, setShowEmptyMessage] = useState(false)
  const [filters, setFilters] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: '',
  })
  const [visible, setVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [selectedProfessional, setselectedProfessional] = useState(null)
  const ModalAddRef = useRef()
  const emptyTimerRef = useRef(null)
  const [alert, setAlert] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [professionalTypes, setProfessionalTypes] = useState([])
  const [specialties, setSpecialties] = useState([])
  const { t } = useTranslation()
  const [formDataState, setFormData] = useState({})
  const token = localStorage.getItem('authToken')
  const defaultAvatar = '/avatar.png'

  const fetchProfessionals = async () => {
    try {
      const { data, success, status } = await request('get', '/professionals', null, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      if (status === 403 || status === 401) {
        navigate('/404')
        return
      }
      if (success && Array.isArray(data)) {
        const normalizedUsers = data.map((user) => ({
          ...user,
          id: String(user.professional_id),
        }))
        // Ordenar por fecha de creación (más reciente primero)
        normalizedUsers.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0
          return tb - ta
        })
        setUsers(normalizedUsers)
        setFilteredUsers(normalizedUsers)
      } else {
        console.error('Error fetching professionals')
        navigate('/404')
      }
    } catch (error) {
      console.error('Error fetching professionals:', error)
      navigate('/404')
    }
  }

  useEffect(() => {
    // Cargar tipos de profesional y especialidades
    // Tipos de profesional
    request('get', '/users/professional-types').then(({ data }) => setProfessionalTypes(data || []))
    // Especialidades y subespecialidades
    const fetchSpecialties = async () => {
      try {
        const { data } = await request('get', '/users/specialties')
        // Filtrar y mapear specialties y subspecialties
        const specialtyOptions = (data || [])
          .filter((s) => s.type === 'specialty')
          .map((s) => ({ label: s.name, value: s.id }))
        const subspecialtyOptions = (data || [])
          .filter((s) => s.type === 'subspecialty')
          .map((s) => ({ label: s.name, value: s.id }))
        setSpecialties({ specialties: specialtyOptions, subspecialties: subspecialtyOptions })
      } catch (error) {
        console.error('Error fetching specialties:', error)
      }
    }
    fetchSpecialties()
  }, [])
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

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'users') {
      try {
        const {
          data,
          success,
          error: apiError,
        } = await request(
          'post',
          '/professionals',
          {
            user: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              email: formData.email,
              password: formData.password,
              address: formData.address,
              phone: formData.phone,
              birth_date: formData.birth_date,
              gender: formData.gender,
              role_id: 3,
              status: formData.status,
              avatar: formData.avatar || formDataState.avatar || null,
            },
            professional: {
              professional_type_id: formData.professional_type_id,
              biography: formData.biography,
              years_of_experience: Number(formData.years_of_experience),
            },
            specialties: [formData.specialty_id, formData.subspecialty_id].filter(Boolean),
          },
          { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        )
        if (!success) {
          if (apiError && apiError.issues && Array.isArray(apiError.issues)) {
            const messages = apiError.issues
              .map((issue) =>
                Array.isArray(issue.path)
                  ? `${issue.path.join('.')} - ${issue.message}`
                  : `${issue.path || 'unknown'} - ${issue.message}`,
              )
              .join('\n')
            Notifications.showAlert(setAlert, messages, 'danger')
          } else {
            Notifications.showAlert(
              setAlert,
              (apiError && apiError.message) || 'Error creating professional',
              'danger',
            )
          }
          return
        }
        Notifications.showAlert(setAlert, 'Professional created successfully!', 'success')
        // Reconsultar y mostrar la lista ordenada por fecha (fetchProfessionals ya ordena)
        await fetchProfessionals()
        // Cerrar la modal después de crear el profesional
        try {
          ModalAddRef.current && ModalAddRef.current.close && ModalAddRef.current.close()
        } catch (e) {
          console.warn('Could not close ModalAdd via ref:', e)
        }
      } catch (error) {
        console.error(error)
        Notifications.showAlert(
          setAlert,
          error.message || 'An error occurred while creating the professional.',
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
          placeholder: 'Ingrese su nombre',
          required: true,
        },
        {
          name: 'last_name',
          label: 'Apellido',
          placeholder: 'Ingrese su apellido',
          required: true,
        },
        {
          name: 'birth_date',
          type: 'date', // Cambiar a texto
          label: 'Fecha de Nacimiento',
          placeholder: 'Ingrese su fecha de nacimiento', // Placeholder para guiar al usuario
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
          placeholder: 'Ingrese su correo electrónico',
          required: true,
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          required: true,
          placeholder: 'Ingrese una contraseña mínima 6 caracteres',
        },
        { name: 'phone', label: 'Teléfono', placeholder: 'Ingrese su número de teléfono' },
        { name: 'address', label: 'Dirección', placeholder: 'Ingrese su dirección' },
      ],
    },
    {
      fields: [
        {
          name: 'professional_type_id',
          label: 'Tipo de Profesional',
          type: 'select',
          required: true,
          options: professionalTypes.map((t) => ({ label: t.name, value: t.id })),
        },
        {
          name: 'specialty_id',
          label: 'Especialidad',
          type: 'select',
          required: true,
          options: specialties.specialties || [], // Opciones de specialties
        },
        {
          name: 'subspecialty_id',
          label: 'Subespecialidad',
          type: 'select',
          required: false,
          options: specialties.subspecialties || [], // Opciones de subspecialties
        },
        {
          name: 'biography',
          label: 'Biografía',
          type: 'textarea',
          placeholder: 'Ingrese su biografía',
          required: false,
        },
        {
          name: 'years_of_experience',
          label: 'Años de Experiencia',
          type: 'number',
          placeholder: 'Ingrese sus años de experiencia',
          required: false,
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select', // Cambiado a tipo select
          required: true,
          options: [
            { label: 'Activo', value: 'Active' },
            { label: 'Inactivo', value: 'Inactive' },
          ],
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
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        // Solicitud DELETE al backend
        const res = await request('DELETE', `/professionals/${userToDelete.id}`, null, headers)
        if (res.success) {
          await fetchProfessionals()
          Notifications.showAlert(setAlert, 'Usuario eliminado con éxito', 'success')
        } else {
          const errorData = res.data || {}
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
      const { data } = await request('get', `/professionals/${user.professional_id}`, null, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      setselectedProfessional(data)
      setInfoVisible(true)
    } catch (error) {
      console.error('Error fetching professional details:', error)
    }
  }

  const handleEdit = async (user) => {
    try {
      const { data, success } = await request('get', `/professionals/${user.id}`, null, {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      if (!success) throw new Error('Error fetching professional details')
      localStorage.setItem('selectedProfessional', JSON.stringify(data))
      navigate(`/professionals/${user.id}`)
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
      case 'email':
        label = 'Correo electrónico'
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

    const filtered = (users || []).filter((user) =>
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
    setFilteredUsers(users || [])
  }

  // Llamar a fetchProfessionals al montar el componente
  useEffect(() => {
    fetchProfessionals()
  }, [])

  // Evita parpadeo: muestra el mensaje "No users available" sólo
  // después de un pequeño retraso cuando la lista está vacía.
  useEffect(() => {
    if (emptyTimerRef.current) {
      clearTimeout(emptyTimerRef.current)
      emptyTimerRef.current = null
    }
    if (!loading && users !== null && users.length === 0) {
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
  }, [loading, users])
  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addUser()}>
          <CIcon icon={cilUserPlus} className="me-2" /> {t('Add professional')}
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>{t('Professional')}</CCardHeader>
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
              {/* 1. Muestra el Skeleton Loader si loading es true */}
              {users === null ||
              (loading && (!users || users.length === 0)) ||
              (!showEmptyMessage && filteredUsers.length === 0) ? (
                // Simula 5 filas de carga
                Array.from({ length: 5 }).map((_, index) => (
                  <CTableRow key={index}>
                    {/* ColSpan es 6 para cubrir todas las columnas de la tabla */}
                    <CTableDataCell colSpan={6}>
                      <div className="skeleton-row"></div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                // 2. Muestra "No users available" si no hay datos
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    {t('No users available')}
                  </CTableDataCell>
                </CTableRow>
              ) : (
                // 3. Muestra los datos si loading es false y hay usuarios
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
        title={t('Confirm professional deletion')}
        message={`${t('Are you sure you want to remove')} ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
      />
      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={t('Professional information')}
        content={
          selectedProfessional ? (
            <div>
              <p>
                <strong>{t('First name')}:</strong> {selectedProfessional.first_name}
              </p>
              <p>
                <strong>{t('Last name')}:</strong> {selectedProfessional.last_name}
              </p>
              <p>
                <strong>{t('Email')}:</strong> {selectedProfessional.email}
              </p>
              <p>
                <strong>{t('Professional Type')}: </strong>
                {selectedProfessional.professional_type}
              </p>
              <p>
                <strong>Specialty:</strong> {selectedProfessional.specialties?.join(', ') || 'N/A'}
              </p>
              <p>
                <strong>Subspecialty:</strong>{' '}
                {selectedProfessional.subspecialties?.join(', ') || 'N/A'}
              </p>
              <p>
                <strong>{t('Address')}:</strong>{' '}
                {selectedProfessional.address || 'No address available'}
              </p>
              <p>
                <strong>{t('Phone')}:</strong> {selectedProfessional.phone || 'No phone available'}
              </p>
              <p>
                <strong>{t('Birth Date')}:</strong>{' '}
                {formatDate(selectedProfessional.birth_date, 'DATE') || 'No birth date available'}
              </p>
              <p>
                <strong>{t('Gender')}:</strong>{' '}
                {selectedProfessional.gender === 'F' ? 'Female' : 'Male'}
              </p>
              <p>
                <strong>{t('Status')}:</strong> {selectedProfessional.status}
              </p>
              <p>
                <strong>{t('Biography')}:</strong> {selectedProfessional.biography || 'N/A'}
              </p>
              <p>
                <strong>{t('Years of Experience')}:</strong>{' '}
                {selectedProfessional.years_of_experience || 'N/A'}
              </p>
              <p>
                <strong>{t('Created at')}:</strong>{' '}
                {selectedProfessional.created_at
                  ? new Date(selectedProfessional.created_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          ) : (
            <p>{t('No information available')}</p>
          )
        }
      />
      <ModalAdd
        ref={ModalAddRef}
        title={t('Add new professional')}
        steps={userSteps}
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Professionls
