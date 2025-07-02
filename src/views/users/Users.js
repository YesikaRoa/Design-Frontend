import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import Notifications from '../../components/Notifications'
import { formatDate } from '../../utils/dateUtils'
import { useTranslation } from 'react-i18next'

import './styles/users.css'
import './styles/filter.css'

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

export const Users = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const token = localStorage.getItem('authToken')

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filters, setFilters] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    status: '',
  })
  const [visible, setVisible] = useState(false)
  const [infoVisible, setInfoVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const ModalAddRef = useRef()
  const [alert, setAlert] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)

  const [roles, setRoles] = useState([])
  const [professionalTypes, setProfessionalTypes] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [formDataState, setFormData] = useState({})

  useEffect(() => {
    fetch('https://aplication-backend-production-872f.up.railway.app/api/users/roles')
      .then((res) => res.json())
      .then(setRoles)
    fetch('https://aplication-backend-production-872f.up.railway.app/api/users/professional-types')
      .then((res) => res.json())
      .then(setProfessionalTypes)
    fetch('https://aplication-backend-production-872f.up.railway.app/api/users/specialties')
      .then((res) => res.json())
      .then(setSpecialties)
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
        const completeUser = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password, // texto plano, mínimo 6 caracteres
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : undefined,
          gender: formData.gender || undefined,
          avatar: formData.avatar || formDataState.avatar || null,
          role_id: Number(formData.role_id),
          status: formData.status,
        }

        if (completeUser.role_id === 2) {
          completeUser.patient_data = {
            medical_data: formData.medical_data || '',
          }
        } else if (completeUser.role_id === 3) {
          completeUser.professional_data = {
            professional_type_id: Number(formData.professional_type_id),
            biography: formData.biography || '',
            years_of_experience: Number(formData.years_of_experience) || 0,
            specialties: [
              ...(Array.isArray(formData.specialty_id)
                ? formData.specialty_id.map(Number)
                : formData.specialty_id
                  ? [Number(formData.specialty_id)]
                  : []),
              ...(Array.isArray(formData.subspecialty_id)
                ? formData.subspecialty_id.map(Number)
                : formData.subspecialty_id
                  ? [Number(formData.subspecialty_id)]
                  : []),
            ],
          }
        }
        const response = await fetch(
          'https://aplication-backend-production-872f.up.railway.app/api/users',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(completeUser),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()

          if (errorData.issues && Array.isArray(errorData.issues)) {
            // Mostrar errores específicos de Zod en la alerta
            const messages = errorData.issues.map((issue) => issue.message).join('\n')
            Notifications.showAlert(setAlert, messages, 'danger')
          } else {
            // Mostrar mensaje general de error
            Notifications.showAlert(setAlert, errorData.message || 'Error creating user', 'danger')
          }

          return // Salir para no continuar con el flujo normal
        }

        const savedUser = await response.json()

        setUsers((prev) => [...prev, savedUser])
        setFilteredUsers((prev) => [...prev, savedUser])

        Notifications.showAlert(setAlert, 'User created successfully', 'success')
      } catch (error) {
        console.error('Error saving user:', error)
        Notifications.showAlert(
          setAlert,
          error.message || 'An error occurred while saving the user.',
          'error',
        )
      }
    }
  }

  const getUserSteps = (formData = {}) => [
    {
      fields: [
        {
          name: 'first_name',
          label: 'Primer nombre',
          placeholder: 'Ingrese el primer nombre',
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
          label: 'Fecha de nacimiento',
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
          label: 'Correo electrónico',
          type: 'email',
          required: true,
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          required: true,
          placeholder: 'Ingrese una contraseña mínima 6 caracteres',
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
          name: 'role_id',
          label: 'Rol',
          type: 'select',
          required: true,
          options: roles
            .filter((r) => [1, 2, 3].includes(r.id))
            .map((r) => ({ label: r.name, value: r.id })),
        },
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

        // Campos para Profesional (role_id === 3)
        ...(Number(formData.role_id) === 3
          ? [
              {
                name: 'professional_type_id',
                label: 'Tipo de profesional',
                type: 'select',
                required: true,
                options: professionalTypes.map((pt) => ({ label: pt.name, value: pt.id })),
              },
              {
                name: 'biography',
                label: 'Biografía',
                placeholder: 'Ingrese la biografía',
                required: false,
              },
              {
                name: 'years_of_experience',
                label: 'Años de experiencia',
                type: 'number',
                placeholder: 'Ingrese los años de experiencia',
                required: false,
              },
              {
                name: 'specialty_id',
                label: 'Especialidad',
                type: 'select',
                required: true,
                multiple: true,
                options: specialties
                  .filter((s) => s.id >= 1 && s.id <= 15)
                  .map((s) => ({ label: s.name, value: s.id })),
              },
              {
                name: 'subspecialty_id',
                label: 'Subespecialidad',
                type: 'select',
                required: false,
                multiple: true,
                options: specialties
                  .filter((s) => s.id >= 16 && s.id <= 60)
                  .map((s) => ({ label: s.name, value: s.id })),
              },
            ]
          : []),

        // Campos para Patient (role_id === 2)
        ...(Number(formData.role_id) === 2
          ? [
              {
                name: 'medical_data',
                label: 'Datos médicos',
                placeholder: 'Ingrese los datos médicos',
                required: false,
              },
            ]
          : []),
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
          `https://aplication-backend-production-872f.up.railway.app/api/users/${userToDelete.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Si usas autenticación basada en tokens
            },
          },
        )

        if (response.ok) {
          // Actualizar las listas en el frontend después de eliminar
          setUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))
          setFilteredUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))
          Notifications.showAlert(setAlert, 'Usuario eliminado con éxito', 'success')
        } else {
          const errorData = await response.json()
          Notifications.showAlert(
            setAlert,
            errorData.message || 'No se pudo eliminar el usuario. Inténtalo de nuevo.',
            'error',
          )
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error)
        Notifications.showAlert(setAlert, 'Ocurrió un error eliminando el usuario.', 'error')
      } finally {
        setVisible(false)
        setUserToDelete(null)
      }
    }
  }

  const handleInfo = (user) => {
    setSelectedUser(user)
    setInfoVisible(true)
  }

  const handleEdit = (user) => {
    localStorage.setItem('selectedUser', JSON.stringify(user))
    navigate(`/users/${user.id}`, { state: { user } })
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
      case 'role_id':
        label = 'Rol'
        type = 'select'
        options = roles.map((r) => ({
          label: r.name,
          value: String(r.id),
        }))
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
  useEffect(() => {
    fetch('https://aplication-backend-production-872f.up.railway.app/api/users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          navigate('/404')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        const normalizedUsers = data.map((user) => ({
          ...user,
          id: String(user.id), // asegura que todos los IDs sean string
        }))
        setUsers(normalizedUsers)
        setFilteredUsers(normalizedUsers)
      })
      .catch(() => {
        navigate('/404')
      })
  }, [navigate, token])

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addUser()}>
          <CIcon icon={cilUserPlus} className="me-2" /> {t('Add user')}
        </CButton>
      </div>
      <CCard className="mb-4">
        <CCardHeader>{t('Users')}</CCardHeader>
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
                <CTableHeaderCell className="table-header">{t('Rol')}</CTableHeaderCell>
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
                      {roles.find((r) => String(r.id) === String(user.role_id))?.name || 'Sin rol'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {/* Usar CBadge para el estado */}
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
        title={t('Confirm user deletion')}
        message={`${t('Are you sure you want to remove to')} ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
      />
      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)} // Cierra la modal
        title={t('User information')}
        content={
          selectedUser ? (
            <div>
              <p>
                <strong>{t('First name')}:</strong> {selectedUser.first_name}
              </p>
              <p>
                <strong>{t('Last name')}:</strong> {selectedUser.last_name}
              </p>
              <p>
                <strong>{t('Email')}:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>{t('Address')}:</strong> {selectedUser.address || t('No address available')}
              </p>
              <p>
                <strong>{t('Phone')}:</strong> {selectedUser.phone || t('No phone available')}
              </p>
              <p>
                <strong>{t('Birth Date')}:</strong>{' '}
                {formatDate(selectedUser.birth_date, 'DATE') || t('No birth date available')}
              </p>
              <p>
                <strong>{t('Gender')}:</strong>{' '}
                {selectedUser.gender === 'F' ? t('Female') : t('Male')}
              </p>
              <p>
                <strong>{t('Status')}:</strong> {selectedUser.status}
              </p>
            </div>
          ) : (
            <p>{t('No information available.')}</p>
          )
        }
      />

      <ModalAdd
        ref={ModalAddRef}
        title={t('Add new user')}
        steps={getUserSteps} // Pasa la función, no el resultado
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Users
