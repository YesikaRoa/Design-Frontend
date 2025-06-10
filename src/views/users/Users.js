import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import Notifications from '../../components/Notifications'
import bcrypt from 'bcryptjs'
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

  useEffect(() => {
    fetch('http://localhost:8000/role')
      .then((res) => res.json())
      .then(setRoles)
    fetch('http://localhost:8000/professional_type')
      .then((res) => res.json())
      .then(setProfessionalTypes)
    fetch('http://localhost:8000/specialty')
      .then((res) => res.json())
      .then(setSpecialties)
  }, [])

  const handleFinish = async (purpose, formData) => {
    if (purpose === 'users') {
      // Verificar si el email ya existe
      try {
        const emailCheckResponse = await fetch(
          `http://localhost:8000/users?email=${formData.email}`,
        )
        const existingUsers = await emailCheckResponse.json()

        if (existingUsers.length > 0) {
          Notifications.showAlert(setAlert, 'The email is already in use.', 'warning')
          return
        }
      } catch (error) {
        console.error('Error checking email:', error)
        Notifications.showAlert(setAlert, 'An error occurred while checking the email.', 'error')
        return
      }

      const formatDate = (date) => {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }
      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(formData.password || 'default_password', salt)

      const completeUser = {
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        email: formData.email || '',
        password: hashedPassword,
        address: formData.address || '',
        phone: formData.phone || '',
        birth_date: formData.birth_date
          ? formatDate(formData.birth_date)
          : 'No birth date available',
        gender: formData.gender || '',
        avatar: formData.avatar || defaultAvatar,
        role_id: formData.role_id || 'No role assigned',
        status: formData.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        // 1. Crear usuario
        const userRes = await fetch('http://localhost:8000/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completeUser),
        })
        const savedUser = await userRes.json()

        // 2. Según el rol, crear en la tabla correspondiente
        if (formData.role_id === '2') {
          console.log('Datos para profesional:', formData)
          // Crear professional
          const professionalRes = await fetch('http://localhost:8000/professionals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: savedUser.id,
              professional_type_id: formData.professional_type_id,
              biography: formData.biography || '',
              years_of_experience: formData.years_of_experience || 0,
              created_at: new Date().toISOString(),
            }),
          })
          const savedProfessional = await professionalRes.json()
          if (!savedProfessional.id) {
            console.error('No se pudo crear el profesional:', savedProfessional)
            Notifications.showAlert(setAlert, 'No se pudo crear el profesional.', 'error')
            return
          }
          // Crear specialty (puede ser uno o varios)
          const specialtiesToSave = Array.isArray(formData.specialty_id)
            ? formData.specialty_id
            : [formData.specialty_id].filter(Boolean)
          for (const specialtyId of specialtiesToSave) {
            await fetch('http://localhost:8000/professional_specialty', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                professional_id: savedProfessional.id,
                specialty_id: specialtyId,
              }),
            })
          }
          // Crear subspecialty (puede ser uno o varios)
          const subspecialtiesToSave = Array.isArray(formData.subspecialty_id)
            ? formData.subspecialty_id
            : [formData.subspecialty_id].filter(Boolean)
          for (const subspecialtyId of subspecialtiesToSave) {
            await fetch('http://localhost:8000/professional_specialty', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                professional_id: savedProfessional.id,
                specialty_id: subspecialtyId,
              }),
            })
          }
        } else if (formData.role_id === '3') {
          // Patient
          await fetch('http://localhost:8000/patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: savedUser.id,
              medical_data: formData.medical_data || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          })
        }

        setUsers((prev) => [...prev, { ...savedUser }])
        setFilteredUsers((prev) => [...prev, { ...savedUser }])
      } catch (error) {
        console.error('Error saving user:', error)
        Notifications.showAlert(setAlert, 'An error occurred while saving the user.', 'error')
      }
    }
  }

  const getUserSteps = (formData = {}) => [
    {
      fields: [
        {
          name: 'first_name',
          label: 'First Name',
          placeholder: 'Enter first name',
          required: true,
        },
        { name: 'last_name', label: 'Last Name', placeholder: 'Enter last name', required: true },
        { name: 'birth_date', type: 'date', label: 'Birth Date', required: true },
        {
          name: 'gender',
          label: 'Gender',
          type: 'select',
          required: true,
          options: [
            { label: 'Female', value: 'F' },
            { label: 'Male', value: 'M' },
          ],
        },
      ],
    },
    {
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
        { name: 'address', label: 'Address', placeholder: 'Enter address' },
      ],
    },
    {
      fields: [
        {
          name: 'role_id',
          label: 'Role',
          type: 'select',
          required: true,
          options: roles
            .filter((r) => ['1', '2', '3'].includes(String(r.id))) // Solo los 3 roles
            .map((r) => ({ label: r.name, value: r.id })),
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ],
        },
        ...(formData.role_id === '2'
          ? [
              {
                name: 'professional_type_id',
                label: 'Professional Type',
                type: 'select',
                required: true,
                options: professionalTypes.map((pt) => ({ label: pt.name, value: pt.id })),
              },
              {
                name: 'biography',
                label: 'Biography',
                placeholder: 'Enter biography',
                required: false,
              },
              {
                name: 'years_of_experience',
                label: 'Years of Experience',
                type: 'number',
                placeholder: 'Enter years of experience',
                required: false,
              },
              {
                name: 'specialty_id',
                label: 'Specialty',
                type: 'select',
                required: true,
                multiple: true, // Permitir selección múltiple
                options: specialties
                  .filter((s) => s.id >= 1 && s.id <= 15)
                  .map((s) => ({ label: s.name, value: s.id })),
              },
              {
                name: 'subspecialty_id',
                label: 'Subspecialty',
                type: 'select',
                required: false,
                multiple: true, // Permitir selección múltiple
                options: specialties
                  .filter((s) => s.id >= 16 && s.id <= 60)
                  .map((s) => ({ label: s.name, value: s.id })),
              },
            ]
          : []),
        ...(formData.role_id === '3'
          ? [
              {
                name: 'medical_data',
                label: 'Medical Data',
                placeholder: 'Enter medical data',
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
        // 1. Eliminar en cascada según el rol
        if (userToDelete.role_id === '2') {
          // Eliminar professional y sus especialidades
          const profRes = await fetch(
            `http://localhost:8000/professionals?user_id=${userToDelete.id}`,
          )
          const professionals = await profRes.json()
          for (const prof of professionals) {
            // Eliminar professional_specialty relacionados
            const specRes = await fetch(
              `http://localhost:8000/professional_specialty?professional_id=${prof.id}`,
            )
            const specialties = await specRes.json()
            if (Array.isArray(specialties)) {
              await Promise.all(
                specialties.map((s) =>
                  fetch(`http://localhost:8000/professional_specialty/${s.id}`, {
                    method: 'DELETE',
                  }),
                ),
              )
            }
            // Eliminar professional
            await fetch(`http://localhost:8000/professionals/${prof.id}`, { method: 'DELETE' })
          }
        } else if (userToDelete.role_id === '3') {
          // Eliminar patient
          const patRes = await fetch(`http://localhost:8000/patient?user_id=${userToDelete.id}`)
          const patients = await patRes.json()
          for (const p of patients) {
            await fetch(`http://localhost:8000/patient/${p.id}`, { method: 'DELETE' })
          }
        }

        // 2. Eliminar usuario
        const response = await fetch(`http://localhost:8000/users/${userToDelete.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))
          setFilteredUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))
          Notifications.showAlert(setAlert, 'User deleted', 'success')
        } else {
          Notifications.showAlert(setAlert, 'Failed to delete the user. Please try again.', 'error')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        Notifications.showAlert(setAlert, 'An error occurred while deleting the user.', 'error')
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
    fetch('http://localhost:8000/users')
      .then((res) => res.json())
      .then((data) => {
        const normalizedUsers = data.map((user) => ({
          ...user,
          id: String(user.id), // asegura que todos los IDs sean string
        }))
        setUsers(normalizedUsers)
        setFilteredUsers(normalizedUsers)
      })
  }, [])

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
        message={`${t('Are you sure you want to remove')} ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
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
                {selectedUser.birth_date || t('No birth date available')}
              </p>
              <p>
                <strong>{t('Gender')}:</strong>{' '}
                {selectedUser.gender === 'F' ? t('Female') : t('Male')}
              </p>
              <p>
                <strong>{t('Role')}:</strong> {selectedUser.role_id || t('No role assigned')}
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
        title="Add new user"
        steps={getUserSteps} // Pasa la función, no el resultado
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Users
