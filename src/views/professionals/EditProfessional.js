import React, { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'
import { useLocation, useNavigate } from 'react-router-dom'
import '../users/styles/UserDetails.css'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
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
} from '@coreui/react'
import { cilPencil, cilSave, cilTrash, cilBan, cilCheckCircle } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
import { useParams } from 'react-router-dom'
const UserDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [selectedSubspecialties, setSelectedSubspecialties] = useState([])
  const [professional, setProfessional] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    phone: '',
    biography: '',
    years_of_experience: 0,
    specialties: [],
    subspecialties: [],
    // otros campos que uses
  })
  const [specialties, setSpecialties] = useState([])
  const [subspecialties, setSubspecialties] = useState([])
  const token = localStorage.getItem('authToken')
  const { id } = useParams()

  const { request, loading: apiLoading } = useApi()
  const fetchProfessional = async (profId) => {
    setLoading(true)
    try {
      const { data, status, success } = await request('get', `/professionals/${profId}`, null, {
        Authorization: `Bearer ${token}`,
      })
      if (status === 403 || status === 401) {
        navigate('/404')
        return
      }
      if (!success || !data) throw new Error('Error fetching professional')
      setProfessional(data)
    } catch (error) {
      console.error(error)
      navigate('/404')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (id) fetchProfessional(id)

    const fetchSpecialties = async () => {
      try {
        const { data } = await request('get', '/auth/specialties')
        const specialtyList = (data || [])
          .filter((item) => item.type === 'specialty')
          .map((s) => ({ label: s.name, value: s.id }))
        const subspecialtyList = (data || [])
          .filter((item) => item.type === 'subspecialty')
          .map((s) => ({ label: s.name, value: s.id }))
        setSpecialties(specialtyList)
        setSubspecialties(subspecialtyList)
      } catch (error) {
        console.error('Error fetching specialties:', error)
      }
    }
    fetchSpecialties()
  }, [id, token])

  useEffect(() => {
    if (professional && specialties.length > 0 && subspecialties.length > 0) {
      if (Array.isArray(professional.specialties)) {
        const mappedSpecialties = professional.specialties.map((name, index) => {
          const found = specialties.find((s) => s.label === name)
          return found
            ? { label: found.label, value: found.value }
            : { label: name, value: `custom-${index}-${name}` }
        })
        setSelectedSpecialties(mappedSpecialties)
      }

      if (Array.isArray(professional.subspecialties)) {
        const mappedSubspecialties = professional.subspecialties.map((name, index) => {
          const found = subspecialties.find((s) => s.label === name)
          return found
            ? { label: found.label, value: found.value }
            : { label: name, value: `custom-${index}-${name}` }
        })
        setSelectedSubspecialties(mappedSubspecialties)
      }
    }
  }, [professional, specialties, subspecialties])

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
      const combinedSpecialties = [
        ...selectedSpecialties.map((s) => s.value),
        ...selectedSubspecialties.map((s) => s.value),
      ]
      const updatedProfessional = {
        professional_type_id: professional.professional_type_id || null,
        biography: professional.biography || null,
        years_of_experience: professional.years_of_experience || 0,
      }
      const updatedUser = {
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        email: professional.email || '',
        address: professional.address || '',
        phone: professional.phone || '',
      }
      const specialtiesArr = combinedSpecialties
      const {
        data: result,
        success,
        error: apiError,
      } = await request(
        'put',
        `/professionals/${professional.id}`,
        {
          professional: updatedProfessional,
          specialties: specialtiesArr,
          ...updatedUser,
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
            (apiError && apiError.message) || 'Error updating professional and user data.',
            'danger',
          )
        }
        return
      }
      fetchProfessional(professional.id)
      setProfessional(result.professional)
      setUser(result.user)
      const specialtyIds = (result.specialties || []).map((s) => (typeof s === 'object' ? s.id : s))
      setSelectedSpecialties(
        specialtyIds.map((id) => {
          const found = specialties.find((s) => s.value === id)
          return found
            ? { label: found.label, value: found.value }
            : { label: `Unknown-${id}`, value: id }
        }),
      )
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
      const {
        data: result,
        success,
        error: apiError,
      } = await request(
        'put',
        `/professionals/status/${userId}`,
        { newStatus: updatedStatus },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (success) {
        setUser(result.user)
        Notifications.showAlert(
          setAlert,
          `User has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`,
          'success',
        )
      } else {
        const errorMessage = (apiError && apiError.message) || 'Failed to update user status.'
        Notifications.showAlert(setAlert, errorMessage, 'danger')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      Notifications.showAlert(setAlert, 'An error occurred while updating user status.', 'danger')
    }
  }

  const confirmDelete = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/professionals/${professional.id}`, null, headers)
      if (res.success) {
        Notifications.showAlert(setAlert, 'Professional eliminado con éxito.', 'success')
        setDeleteModalVisible(false)
        navigate('/professionals')
      } else {
        const errorData = res.data || {}
        Notifications.showAlert(
          setAlert,
          errorData.message || 'No se pudo eliminar el Professional.',
          'danger',
        )
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Notifications.showAlert(setAlert, 'Ocurrió un error al eliminar el professional', 'danger')
    }
  }

  const openDeleteModal = () => {
    setDeleteModalVisible(true)
  }

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">{t('Professional Details')}</h3>
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
              {professional.first_name} {professional.last_name}
            </CCardTitle>
            <CCardText>
              <strong>{t('Email')}:</strong> {professional.email} <br />
              <strong>{t('Professional Type')}:</strong> {professional.professional_type} <br />
              <strong>{t('Status')}:</strong> {professional.status} <br />
              <strong>{t('Created at')}:</strong>{' '}
              {new Date(professional.created_at).toLocaleDateString()} <br />
              <strong>{t('Last Updated')}:</strong>{' '}
              {new Date(professional.updated_at).toLocaleDateString()}
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <div className="card-actions-container">
              <span
                className={`card-actions-link ${user.status === 'Active' ? 'deactivate-user' : 'activate-user'}`}
                onClick={() => handleToggleStatus(professional.id)}
              >
                <CIcon
                  icon={user.status === 'Active' ? cilBan : cilCheckCircle}
                  className="me-2"
                  width={24}
                  height={24}
                />
                {user.status === 'Active'
                  ? t('Deactivate Professional')
                  : t('Activate Professional')}
              </span>
              <span className="card-actions-link delete-user" onClick={openDeleteModal}>
                <CIcon icon={cilTrash} className="me-2" width={24} height={24} />
                {t('Delete Professional')}
              </span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8} className="space-component">
        <CCard>
          <CCardBody>
            <CCardTitle>{t('Edit Professional')}</CCardTitle>

            {/* Información básica */}
            <CFormInput
              type="text"
              id="firstName"
              floatingLabel={t('First name')}
              value={professional.first_name || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, first_name: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="lastName"
              floatingLabel={t('Last name')}
              value={professional.last_name || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, last_name: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="email"
              id="email"
              floatingLabel={t('Email')}
              value={professional.email || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, email: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="address"
              floatingLabel={t('Address')}
              value={professional.address || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, address: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="phone"
              floatingLabel={t('Phone')}
              value={professional.phone || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, phone: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="biography"
              floatingLabel={t('Biography')}
              value={professional.biography || ''}
              onChange={(e) => setProfessional((prev) => ({ ...prev, biography: e.target.value }))}
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="number"
              id="years_of_experience"
              floatingLabel={t('Years of Experience')}
              value={professional.years_of_experience || 0}
              onChange={(e) =>
                setProfessional((prev) => ({
                  ...prev,
                  years_of_experience: Number(e.target.value),
                }))
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />

            {/* Especialidades */}
            <label htmlFor="specialty" className="form-label">
              {t('Specialties')}
            </label>
            <Select
              isMulti
              name="specialty"
              options={specialties}
              value={selectedSpecialties}
              onChange={setSelectedSpecialties}
              className="mb-2"
              classNamePrefix="react-select"
              placeholder={t('Select specialties')}
              isDisabled={fieldsDisabled}
            />

            {/* Subespecialidades */}
            <label htmlFor="subspecialty" className="form-label">
              {t('Subspecialties')}
            </label>
            <Select
              isMulti
              name="subspecialty"
              options={subspecialties}
              value={selectedSubspecialties}
              onChange={setSelectedSubspecialties}
              className="mb-2"
              classNamePrefix="react-select"
              placeholder={t('Select subspecialties')}
              isDisabled={fieldsDisabled}
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
        onConfirm={confirmDelete}
        title={t('Delete user')}
        message={t('Are you sure you want to delete this user? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default UserDetails
