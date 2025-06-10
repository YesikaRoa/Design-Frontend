import React, { useEffect, useRef, useState } from 'react'
import UserFilter from '../../components/Filter'
import ModalDelete from '../../components/ModalDelete'
import ModalInformation from '../../components/ModalInformation'
import ModalAdd from '../../components/ModalAdd'
import defaultAvatar from '../../assets/images/avatars/avatar.png'
import Notifications from '../../components/Notifications'
import { useCallback } from 'react'

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

export const Patients = () => {
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
  const [selectedPatient, setselectedPatient] = useState(null)
  const ModalAddRef = useRef()
  const [alert, setAlert] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)

  // Cambia handleFinish para guardar en ambos endpoints
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
        Notifications.showAlert(setAlert, 'An error occurred while checking the email.', 'error')
        return
      }

      const formatDate = (date) => {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }

      // 1. Crear usuario
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
        role_id: '3', // Paciente por defecto
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

        // 2. Crear paciente
        const patientData = {
          user_id: savedUser.id,
          medical_data: formData.medical_data || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        await fetch('http://localhost:8000/patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData),
        })

        setUsers((prev) => [...prev, { ...savedUser, medical_data: formData.medical_data }])
        setFilteredUsers((prev) => [...prev, { ...savedUser, medical_data: formData.medical_data }])
      } catch (error) {
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
          type: 'date',
          label: 'Birth Date',
          placeholder: 'Enter birth date',
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
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ],
        },
        {
          name: 'medical_data',
          label: 'Medical Data',
          type: 'textarea',
          placeholder: 'Enter medical data',
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
        // 1. Buscar el paciente por user_id
        const patientRes = await fetch(`http://localhost:8000/patient?user_id=${userToDelete.id}`)
        const patientData = await patientRes.json()
        if (patientData && patientData.length > 0) {
          // 2. Eliminar el paciente
          await fetch(`http://localhost:8000/patient/${patientData[0].id}`, {
            method: 'DELETE',
          })
        }

        // 3. Eliminar el usuario
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
  const handleInfo = async (user) => {
    // Obtener medical_data actualizado del endpoint patient
    try {
      const res = await fetch(`http://localhost:8000/patient?user_id=${user.id}`)
      const data = await res.json()
      const medical_data = data && data.length > 0 ? data[0].medical_data : ''
      setselectedPatient({ ...user, medical_data })
    } catch (error) {
      setselectedPatient({ ...user, medical_data: '' })
    }
    setInfoVisible(true)
  }

  const handleEdit = (user) => {
    localStorage.setItem('selectedPatient', JSON.stringify(user))
    navigate(`/patients/${user.id}`, { state: { user } })
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
    fetch('http://localhost:8000/users?role_id=3')
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
          <CIcon icon={cilUserPlus} className="me-2" /> Add patient
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader>Patients</CCardHeader>
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
        title="Confirm patient deletion"
        message={`Are you sure you want to remove ${userToDelete?.first_name} ${userToDelete?.last_name}?`}
      />
      <ModalInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)} // Cierra la modal
        title="Patient information"
        content={
          selectedPatient ? (
            <div>
              <p>
                <strong>First Name:</strong> {selectedPatient.first_name}
              </p>
              <p>
                <strong>Last Name:</strong> {selectedPatient.last_name}
              </p>
              <p>
                <strong>Email:</strong> {selectedPatient.email}
              </p>
              <p>
                <strong>Address:</strong> {selectedPatient.address || 'No address available'}
              </p>
              <p>
                <strong>Phone:</strong> {selectedPatient.phone || 'No phone available'}
              </p>
              <p>
                <strong>Birth Date:</strong>{' '}
                {selectedPatient.birth_date || 'No birth date available'}
              </p>
              <p>
                <strong>Gender:</strong> {selectedPatient.gender === 'F' ? 'Female' : 'Male'}
              </p>
              <p>
                <strong>Status:</strong> {selectedPatient.status}
              </p>
              <p>
                <strong>Medical Data:</strong> {selectedPatient.medical_data || 'No medical data'}
              </p>
            </div>
          ) : (
            <p>No information available.</p>
          )
        }
      />
      <ModalAdd
        ref={ModalAddRef}
        title="Add new patient"
        steps={userSteps}
        onFinish={handleFinish}
        purpose="users"
      />
    </>
  )
}

export default Patients
