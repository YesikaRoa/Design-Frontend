import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import Notifications from '../../components/Notifications'

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
        role_id: formData.role || 'No role assigned',
        status: formData.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        const response = await fetch('http://localhost:8000/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completeUser),
        })

        const savedUser = await response.json()

        setUsers((prev) => [...prev, { ...savedUser }])
        setFilteredUsers((prev) => [...prev, { ...savedUser }])
      } catch (error) {
        console.error('Error saving user:', error)
        Notifications.showAlert(setAlert, 'An error occurred while saving the user.', 'error')
      }
    }
  }
  const userSteps = [
    {
      fields: [
        {
          name: 'first_name',
          label: 'First Name',
          placeholder: 'Enter first name',
          required: true,
        },
        { name: 'last_name', label: 'Last Name', placeholder: 'Enter last name', required: true },
        {
          name: 'birth_date',
          type: 'date', // Cambiar a texto
          label: 'Birth Date',
          placeholder: 'Enter birth date', // Placeholder para guiar al usuario
          required: true,
        },
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
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'Enter email',
          required: true,
        },
        { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
        { name: 'address', label: 'Address', placeholder: 'Enter address' },
      ],
    },
    {
      fields: [
        {
          name: 'role',
          label: 'Role',
          type: 'select', // Cambiado a tipo select
          required: true,
          options: [
            { label: 'Doctor', value: 'Doctor' },
            { label: 'Nurse', value: 'Nurse' },
            { label: 'Therapist', value: 'Therapist' },
          ],
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select', // Cambiado a tipo select
          required: true,
          options: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
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
        // Realiza la solicitud DELETE al backend
        const response = await fetch(`http://localhost:8000/users/${userToDelete.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Actualiza la lista de usuarios eliminando el usuario borrado
          setUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))
          setFilteredUsers((prev) => prev.filter((u) => String(u.id) !== String(userToDelete.id)))

          // Muestra una notificación de éxito
          Notifications.showAlert(setAlert, 'User deleted', 'success')
        } else {
          // Muestra una notificación de error
          Notifications.showAlert(setAlert, 'Failed to delete the user. Please try again.', 'error')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        // Muestra una notificación de error
        Notifications.showAlert(setAlert, 'An error occurred while deleting the user.', 'error')
      } finally {
        setVisible(false) // Cierra la modal
        setUserToDelete(null) // Limpia el usuario seleccionado
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
        label = 'First name'
        break
      case 'last_name':
        label = 'Last name'
        break
      case 'status':
        label = 'Status'
        type = 'select' // Cambiar a tipo select
        options = [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
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
    const roles = ['Doctor', 'Nurse', 'Therapist']

    fetch('http://localhost:8000/users')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error al obtener los usuarios.')
        }
        return res.json()
      })
      .then((data) => {
        // Filtrar usuarios por roles en el cliente
        const filteredData = data.filter((user) => roles.includes(user.role_id))
        const normalizedUsers = filteredData.map((user) => ({
          ...user,
          id: String(user.id), // asegura que todos los IDs sean string
        }))
        setUsers(normalizedUsers)
        setFilteredUsers(normalizedUsers)
      })
      .catch((error) => {
        console.error('Error al cargar los usuarios:', error)
      })
  }, [])

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <CButton color="primary" onClick={() => addUser()}>
          <CIcon icon={cilUserPlus} className="me-2" /> Add professional
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>Professional</CCardHeader>
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
                <CTableHeaderCell className="table-header">First name</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Last name</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Email</CTableHeaderCell>
                <CTableHeaderCell className="table-header">Status</CTableHeaderCell>
                <CTableHeaderCell className="avatar-header">Actions</CTableHeaderCell>
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
        title="Confirm professional deletion"
        message={`Are you sure you want to remove ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
      />
      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)} // Cierra la modal
        title="Professional information"
        content={
          selectedProfessional ? (
            <div>
              <p>
                <strong>First Name:</strong> {selectedProfessional.first_name}
              </p>
              <p>
                <strong>Last Name:</strong> {selectedProfessional.last_name}
              </p>
              <p>
                <strong>Email:</strong> {selectedProfessional.email}
              </p>
              <p>
                <strong>Address:</strong> {selectedProfessional.address || 'No address available'}
              </p>
              <p>
                <strong>Phone:</strong> {selectedProfessional.phone || 'No phone available'}
              </p>
              <p>
                <strong>Birth Date:</strong>{' '}
                {selectedProfessional.birth_date || 'No birth date available'}
              </p>
              <p>
                <strong>Gender:</strong> {selectedProfessional.gender === 'F' ? 'Female' : 'Male'}
              </p>
              <p>
                <strong>Status:</strong> {selectedProfessional.status}
              </p>
            </div>
          ) : (
            <p>No information available.</p>
          )
        }
      />
      <ModalAdd
        ref={ModalAddRef}
        title="Add new professional"
        steps={userSteps}
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Professionls
