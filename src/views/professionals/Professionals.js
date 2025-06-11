import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
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

export const Professionls = () => {
  const navigate = useNavigate()
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
  const [selectedProfessional, setselectedProfessional] = useState(null)
  const ModalAddRef = useRef()
  const [alert, setAlert] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [professionalTypes, setProfessionalTypes] = useState([])
  const [specialties, setSpecialties] = useState([])
  const { t } = useTranslation()

  useEffect(() => {
    // Cargar tipos de profesional y especialidades
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
          Notifications.showAlert(setAlert, t('The email is already in use'), 'warning')
          return
        }
      } catch (error) {
        console.error('Error checking email:', error)
        Notifications.showAlert(setAlert, t('An error occurred while checking the email'), 'error')
        return
      }

      const formatDate = (date) => {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }

      const completeUser = {
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        email: formData.email || '',
        password: 'hashed_password_default',
        address: formData.address || '',
        phone: formData.phone || '',
        birth_date: formData.birth_date
          ? formatDate(formData.birth_date)
          : 'No birth date available',
        gender: formData.gender || '',
        avatar: formData.avatar || defaultAvatar,
        role_id: '2',
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
        if (!userRes.ok) {
          const errorText = await userRes.text()
          throw new Error('Error al crear usuario: ' + errorText)
        }
        const savedUser = await userRes.json()

        // 2. Crear professional
        const professionalRes = await fetch('http://localhost:8000/professionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: savedUser.id,
            professional_type_id: formData.professional_type_id,
            biography: formData.biography || '',
            years_of_experience: formData.years_of_experience
              ? Number(formData.years_of_experience)
              : 0,
            created_at: new Date().toISOString(),
          }),
        })
        if (!professionalRes.ok) {
          const errorText = await professionalRes.text()
          throw new Error('Error al crear professional: ' + errorText)
        }
        const savedProfessional = await professionalRes.json()

        // 3. Crear professional_specialty (especialidad)
        await fetch('http://localhost:8000/professional_specialty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: savedProfessional.id,
            specialty_id: formData.specialty_id,
          }),
        })
        // 3b. Si hay subespecialidad, crear también
        if (formData.subspecialty_id) {
          await fetch('http://localhost:8000/professional_specialty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professional_id: savedProfessional.id,
              specialty_id: formData.subspecialty_id,
            }),
          })
        }
        // 4. Actualizar estado local
        setUsers((prev) => [
          ...prev,
          {
            ...savedUser,
            professional_id: savedProfessional.id,
            professional_type_id: formData.professional_type_id,
            specialty_id: formData.specialty_id,
            subspecialty_id: formData.subspecialty_id || null,
          },
        ])
        setFilteredUsers((prev) => [
          ...prev,
          {
            ...savedUser,
            professional_id: savedProfessional.id,
            professional_type_id: formData.professional_type_id,
            specialty_id: formData.specialty_id,
            subspecialty_id: formData.subspecialty_id || null,
          },
        ])
        Notifications.showAlert(setAlert, 'Professional created successfully!', 'success')
      } catch (error) {
        console.error('Error saving professional:', error)
        Notifications.showAlert(
          setAlert,
          'An error occurred while saving the professional.',
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
          options: specialties
            .filter((s) => Number(s.id) >= 1 && Number(s.id) <= 15)
            .map((s) => ({ label: s.name, value: s.id })),
        },
        {
          name: 'subspecialty_id',
          label: 'Subespecialidad',
          type: 'select',
          required: false,
          options: specialties
            .filter((s) => Number(s.id) >= 16 && Number(s.id) <= 60)
            .map((s) => ({ label: s.name, value: s.id })),
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
        // 1. Buscar professional por user_id
        const profRes = await fetch(
          `http://localhost:8000/professionals?user_id=${userToDelete.id}`,
        )
        const professionals = await profRes.json()
        for (const professional of professionals) {
          // 2. Buscar y eliminar todos los professional_specialty relacionados
          const specRes = await fetch(
            `http://localhost:8000/professional_specialty?professional_id=${professional.id}`,
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
          // 3. Eliminar professional
          await fetch(`http://localhost:8000/professionals/${professional.id}`, {
            method: 'DELETE',
          })
        }
        // 4. Eliminar usuario
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
    setselectedProfessional(user)
    setInfoVisible(true)
  }

  const handleEdit = (user) => {
    localStorage.setItem('selectedProfessional', JSON.stringify(user))
    navigate(`/professionals/${user.id}`, { state: { user } })
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
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los usuarios.')
        return res.json()
      })
      .then(async (data) => {
        // Solo usuarios con role_id = 2 (Professional)
        const professionals = data.filter((user) => String(user.role_id) === '2')
        // Cargar datos de professional y especialidad
        const professionalsData = await Promise.all(
          professionals.map(async (user) => {
            // Busca professional por user_id
            const profRes = await fetch(`http://localhost:8000/professionals?user_id=${user.id}`)
            const profArr = await profRes.json()
            const professional = profArr[0] || {}

            // Busca todas las especialidades de este professional
            let specialty_id = null
            let subspecialty_id = null
            if (professional.id) {
              const specRes = await fetch(
                `http://localhost:8000/professional_specialty?professional_id=${professional.id}`,
              )
              const specArr = await specRes.json()
              // Buscar por rango de IDs
              specArr.forEach((spec) => {
                const idNum = Number(spec.specialty_id)
                if (idNum >= 1 && idNum <= 15) specialty_id = spec.specialty_id
                if (idNum >= 16 && idNum <= 60) subspecialty_id = spec.specialty_id
              })
            }
            return {
              ...user,
              professional_id: professional.id,
              professional_type_id: professional.professional_type_id,
              specialty_id,
              subspecialty_id,
              biography: professional.biography || '',
              years_of_experience: professional.years_of_experience || '',
              created_at: professional.created_at || '',
            }
          }),
        )
        setUsers(professionalsData)
        setFilteredUsers(professionalsData)
      })
      .catch((error) => {
        console.error('Error al cargar los usuarios:', error)
      })
  }, [])

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
              {filteredUsers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center">
                    {t('No users available')}
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
                <strong>{t('Professional Type')}:</strong>{' '}
                {professionalTypes.find(
                  (t) => String(t.id) === String(selectedProfessional.professional_type_id),
                )?.name || 'N/A'}
              </p>
              <p>
                <strong>{t('Specialty')}:</strong>{' '}
                {specialties.find((s) => String(s.id) === String(selectedProfessional.specialty_id))
                  ?.name || 'N/A'}
              </p>
              {selectedProfessional.subspecialty_id && (
                <p>
                  <strong>{t('Subspecialty')}:</strong>{' '}
                  {specialties.find(
                    (s) => String(s.id) === String(selectedProfessional.subspecialty_id),
                  )?.name || 'N/A'}
                </p>
              )}
              <p>
                <strong>{t('Address')}:</strong>{' '}
                {selectedProfessional.address || 'No address available'}
              </p>
              <p>
                <strong>{t('Phone')}:</strong> {selectedProfessional.phone || 'No phone available'}
              </p>
              <p>
                <strong>{t('Birth Date')}:</strong>{' '}
                {selectedProfessional.birth_date || 'No birth date available'}
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
