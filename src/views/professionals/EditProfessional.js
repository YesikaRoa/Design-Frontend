import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../users/styles/UserDetails.css'

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
  const [selectedProfessionalId, setselectedProfessionalId] = useState(null)

  const [professional, setProfessional] = useState(null)
  const [specialty, setSpecialty] = useState(null)
  const [subspecialty, setSubspecialty] = useState(null)
  const [professionalTypes, setProfessionalTypes] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [roles, setRoles] = useState([])

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

  useEffect(() => {
    if (user && user.id) {
      // Cargar professional
      fetch(`http://localhost:8000/professionals?user_id=${user.id}`)
        .then((res) => res.json())
        .then(async (profArr) => {
          const prof = profArr[0]
          setProfessional(prof)
          if (prof && prof.id) {
            // Cargar specialties
            const specRes = await fetch(
              `http://localhost:8000/professional_specialty?professional_id=${prof.id}`,
            )
            const specArr = await specRes.json()
            let specialtyId = null
            let subspecialtyId = null
            specArr.forEach((spec) => {
              const idNum = Number(spec.specialty_id)
              if (idNum >= 1 && idNum <= 15) specialtyId = spec.specialty_id
              if (idNum >= 16 && idNum <= 60) subspecialtyId = spec.specialty_id
            })
            setSpecialty(specialtyId)
            setSubspecialty(subspecialtyId)
          }
        })
    }
  }, [user])

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
      }

      // Actualizar professional_type
      const professionalTypeId = document.getElementById('professionalType').value
      const biography = document.getElementById('biography').value
      const years_of_experience = document.getElementById('years_of_experience').value

      if (professional && professionalTypeId) {
        await fetch(`http://localhost:8000/professionals/${professional.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...professional,
            professional_type_id: professionalTypeId,
            biography,
            years_of_experience: years_of_experience ? Number(years_of_experience) : 0,
          }),
        })
      }

      // Actualizar specialty y subspecialty
      const specialtyId = document.getElementById('specialty').value
      const subspecialtyId = document.getElementById('subspecialty').value

      // Elimina las especialidades actuales
      if (professional && professional.id) {
        await fetch(
          `http://localhost:8000/professional_specialty?professional_id=${professional.id}`,
          { method: 'DELETE' },
        )
        // Crea la nueva especialidad
        if (specialtyId) {
          await fetch('http://localhost:8000/professional_specialty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professional_id: professional.id,
              specialty_id: specialtyId,
            }),
          })
        }
        // Crea la nueva subespecialidad si existe
        if (subspecialtyId) {
          await fetch('http://localhost:8000/professional_specialty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professional_id: professional.id,
              specialty_id: subspecialtyId,
            }),
          })
        }
      }

      Notifications.showAlert(setAlert, 'Changes successfully saved!', 'success')
      setFieldsDisabled(true)
    } catch (error) {
      console.error('Error saving changes:', error)
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }
  }

  useEffect(() => {
    setUser(null)
    setLoading(true)

    if (location.state && location.state.user) {
      const newUser = location.state.user
      setUser(newUser)
      localStorage.setItem('selectedProfessional', JSON.stringify(newUser))

      const firstName = newUser.first_name.split(' ')[0]
      const normalizedFirstName = normalizeNameForURL(firstName)
      navigate(`/professionals/${normalizedFirstName}`, { replace: true })
    } else {
      const storedUser = localStorage.getItem('selectedProfessional')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
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
      // 1. Buscar professional por user_id
      const profRes = await fetch(`http://localhost:8000/professionals?user_id=${user.id}`)
      const profArr = await profRes.json()
      const professional = profArr[0]
      if (professional) {
        // 2. Buscar y eliminar todas las especialidades asociadas
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
      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        Notifications.showAlert(setAlert, 'User has been deleted successfully.', 'success')
        setDeleteModalVisible(false)
        navigate('/professionals')
      } else {
        Notifications.showAlert(setAlert, 'Failed to delete user.', 'danger')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(setAlert, 'An error occurred while deleting the user.', 'danger')
    }
  }

  const openDeleteModal = (userId) => {
    setselectedProfessionalId(userId)
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">Professional Details</h3>
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
              <strong>Email:</strong> {user.email} <br />
              <strong>Role:</strong>{' '}
              {roles.find((r) => String(r.id) === String(user.role_id))?.name || user.role_id}{' '}
              <br />
              <strong>Status:</strong> {user.status} <br />
              <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()} <br />
              <strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}
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
                {user.status === 'Active' ? 'Deactivate Professional' : 'Activate Professional'}
              </span>
              <span
                className="card-actions-link delete-user"
                onClick={() => openDeleteModal(user.id)}
              >
                <CIcon icon={cilTrash} className="me-2" width={24} height={24} />
                Delete Professional
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8} className="space-component">
        <CCard>
          <CCardBody>
            <CCardTitle>Edit Professional</CCardTitle>
            <CFormInput
              type="text"
              id="firstName"
              floatingLabel="First Name"
              defaultValue={user.first_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="lastName"
              floatingLabel="Last Name"
              defaultValue={user.last_name}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="email"
              id="email"
              floatingLabel="Email"
              defaultValue={user.email}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="address"
              floatingLabel="Address"
              defaultValue={user.address}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="phone"
              floatingLabel="Phone"
              defaultValue={user.phone}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            {professional && (
              <>
                {fieldsDisabled ? (
                  <>
                    <CFormInput
                      type="text"
                      id="professionalType"
                      floatingLabel="Professional Type"
                      value={
                        professionalTypes.find(
                          (pt) => String(pt.id) === String(professional.professional_type_id),
                        )?.name || ''
                      }
                      className="mb-3"
                      disabled
                    />
                    <CFormInput
                      type="text"
                      id="specialty"
                      floatingLabel="Specialty"
                      value={
                        specialties.find((s) => String(s.id) === String(specialty))?.name || ''
                      }
                      className="mb-3"
                      disabled
                    />
                    {subspecialty && (
                      <CFormInput
                        type="text"
                        id="subspecialty"
                        floatingLabel="Subspecialty"
                        value={
                          specialties.find((s) => String(s.id) === String(subspecialty))?.name || ''
                        }
                        className="mb-3"
                        disabled
                      />
                    )}
                    <CFormInput
                      type="text"
                      id="biography"
                      floatingLabel="Biography"
                      value={professional.biography || ''}
                      className="mb-3"
                      disabled
                    />
                    <CFormInput
                      type="number"
                      id="years_of_experience"
                      floatingLabel="Years of Experience"
                      value={professional.years_of_experience || ''}
                      className="mb-3"
                      disabled
                    />
                  </>
                ) : (
                  <>
                    <select
                      id="professionalType"
                      className="form-select mb-3"
                      defaultValue={professional.professional_type_id}
                    >
                      <option value="">Select Professional Type</option>
                      {professionalTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                    <select
                      id="specialty"
                      className="form-select mb-3"
                      defaultValue={specialty || ''}
                    >
                      <option value="">Select Specialty</option>
                      {specialties
                        .filter((s) => Number(s.id) >= 1 && Number(s.id) <= 15)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                    <select
                      id="subspecialty"
                      className="form-select mb-3"
                      defaultValue={subspecialty || ''}
                    >
                      <option value="">Select Subspecialty</option>
                      {specialties
                        .filter((s) => Number(s.id) >= 16 && Number(s.id) <= 60)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                    <CFormInput
                      type="text"
                      id="biography"
                      floatingLabel="Biography"
                      defaultValue={professional.biography || ''}
                      className="mb-3"
                      disabled={fieldsDisabled}
                    />
                    <CFormInput
                      type="number"
                      id="years_of_experience"
                      floatingLabel="Years of Experience"
                      defaultValue={professional.years_of_experience || ''}
                      className="mb-3"
                      disabled={fieldsDisabled}
                    />
                    <CFormInput
                      type="text"
                      id="created_at"
                      floatingLabel="Created At"
                      value={
                        professional.created_at
                          ? new Date(professional.created_at).toLocaleString()
                          : ''
                      }
                      className="mb-3"
                      disabled
                    />
                  </>
                )}
              </>
            )}
            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : save}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? 'Edit' : 'Save'}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteUser}
        title="Delete user"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </CRow>
  )
}

export default UserDetails
