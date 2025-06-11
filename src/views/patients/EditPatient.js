import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../users/styles/UserDetails.css'
import { useTranslation } from 'react-i18next'

import {
  CButton,
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CFormInput,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import {
  cilPencil,
  cilSave,
  cilTrash,
  cilBan,
  cilCheckCircle,
  cilLockLocked,
  cilLockUnlocked,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'

const UserDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedPatientId, setselectedPatientId] = useState(null)
  const { t } = useTranslation()

  const [roles, setRoles] = useState([])
  const [patient, setPatient] = useState(null)
  const [medicalData, setMedicalData] = useState('')

  useEffect(() => {
    // ...existing code...
    // Obtener roles
    fetch('http://localhost:8000/role')
      .then((res) => res.json())
      .then(setRoles)
  }, [location, navigate])

  const getRoleName = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId))
    return role ? role.name : roleId
  }
  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const normalizeNameForURL = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const save = async () => {
    try {
      const getResponse = await fetch(`http://localhost:8000/users/${user.id}`)
      if (!getResponse.ok) throw new Error('Error al obtener los datos actuales del usuario.')
      const currentUser = await getResponse.json()

      const updatedFields = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
      }

      const updatedUser = { ...currentUser, ...updatedFields }

      const putResponse = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })

      if (putResponse.ok) {
        const result = await putResponse.json()
        setUser(result)
        Notifications.showAlert(setAlert, 'Changes successfully saved!', 'success')
      }

      // Actualizar medical_data en patient
      if (patient) {
        await fetch(`http://localhost:8000/patient/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...patient,
            medical_data: medicalData,
            updated_at: new Date().toISOString(),
          }),
        })
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }

    handleFieldsDisabled()
  }

  useEffect(() => {
    setUser(null)
    setLoading(true)

    if (location.state && location.state.user) {
      const newUser = location.state.user
      setUser(newUser)
      localStorage.setItem('selectedPatient', JSON.stringify(newUser))

      // Obtener datos del paciente
      fetch(`http://localhost:8000/patient?user_id=${newUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setPatient(data[0])
            setMedicalData(data[0].medical_data)
          }
        })

      const firstName = newUser.first_name.split(' ')[0]
      const normalizedFirstName = normalizeNameForURL(firstName)
      navigate(`/patients/${normalizedFirstName}`, { replace: true })
    } else {
      const storedUser = localStorage.getItem('selectedPatient')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        // Obtener datos del paciente
        fetch(`http://localhost:8000/patient?user_id=${parsedUser.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              setPatient(data[0])
              setMedicalData(data[0].medical_data)
            }
          })
      }
      setLoading(false)
    }
  }, [location, navigate])

  if (loading) return <p>Cargando usuario...</p>
  if (!user) return <p>No se encontró el usuario.</p>

  const handleToggleStatus = async (userId) => {
    try {
      const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      const updatedUser = { ...user, status: updatedStatus }

      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result)
        Notifications.showAlert(
          setAlert,
          `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
          'success',
        )
      } else {
        Notifications.showAlert(setAlert, 'Failed to update user status.', 'danger')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      Notifications.showAlert(setAlert, 'An error occurred while updating user status.', 'danger')
    }
  }

  const handleDeleteUser = async () => {
    try {
      // 1. Buscar el paciente por user_id
      const patientRes = await fetch(`http://localhost:8000/patient?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData && patientData.length > 0) {
        // 2. Eliminar el paciente
        await fetch(`http://localhost:8000/patient/${patientData[0].id}`, {
          method: 'DELETE',
        })
      }

      // 3. Eliminar el usuario
      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        Notifications.showAlert(setAlert, 'User has been deleted successfully.', 'success')
        setDeleteModalVisible(false)
        navigate('/patients')
      } else {
        Notifications.showAlert(setAlert, 'Failed to delete user.', 'danger')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(setAlert, 'An error occurred while deleting the user.', 'danger')
    }
  }

  const openDeleteModal = (userId) => {
    setselectedPatientId(userId)
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">Patient Details</h3>
        {alert && (
          <CAlert color={alert.type} className="text-center alert-fixed">
            {alert.message}
          </CAlert>
        )}
      </CCol>
      <CCol md={4}>
        <CCard>
          <CCardBody>
            <CCardTitle className="text-primary">
              {user.first_name} {user.last_name}
            </CCardTitle>
            <CCardText>
              <strong>{t('Email')}:</strong> {user.email} <br />
              <strong>{t('Role')}:</strong> {getRoleName(user.role_id)} <br />
              <strong>{t('Status')}:</strong> {user.status} <br />
              <strong>{t('Created at')}:</strong> {new Date(user.created_at).toLocaleDateString()}{' '}
              <br />
              <strong>{t('Last Updated')}:</strong> {new Date(user.updated_at).toLocaleDateString()}
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <div className="card-actions-container">
              <span
                className={`card-actions-link ${user.status === 'Active' ? 'deactivate-user' : 'activate-user'}`}
                onClick={() => handleToggleStatus(user.id)}
              >
                <CIcon
                  icon={user.status === 'Active' ? cilBan : cilCheckCircle}
                  className="me-2"
                  width={24}
                  height={24}
                />
                {user.status === 'Active' ? t('Deactivate Patient') : t('Activate Patient')}
              </span>
              <span
                className="card-actions-link delete-user"
                onClick={() => openDeleteModal(user.id)}
              >
                <CIcon icon={cilTrash} className="me-2" width={24} height={24} />
                {t('Delete Patient')}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8} className="space-component">
        <CCard>
          <CCardBody>
            <CCardTitle>{t('Edit Patient')}</CCardTitle>
            <CFormInput
              type="text"
              id="firstName"
              floatingLabel={t('First name')}
              defaultValue={user.first_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="lastName"
              floatingLabel={t('Last name')}
              defaultValue={user.last_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="email"
              id="email"
              floatingLabel={t('Email')}
              defaultValue={user.email}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="address"
              floatingLabel={t('Address')}
              defaultValue={user.address}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="phone"
              floatingLabel={t('Phone')}
              defaultValue={user.phone}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="medicalData"
              floatingLabel={t('Medical Data')}
              value={medicalData}
              className="mb-3"
              disabled={fieldsDisabled}
              onChange={(e) => setMedicalData(e.target.value)}
            />
            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : save}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? t('Edit') : t('Save')}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteUser}
        title={t('Delete user')}
        message={t('Are you sure you want to delete this user? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default UserDetails
