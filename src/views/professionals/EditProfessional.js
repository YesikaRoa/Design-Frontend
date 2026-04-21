import React, { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import '../appointments/styles/EditAppointment.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CFormTextarea,
  CAlert,
  CForm,
} from '@coreui/react'
import { cilPencil, cilSave, cilTrash, cilBan, cilCheckCircle, cilUser, cilMedicalCross } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import Notifications from '../../components/Notifications'
import ModalDelete from '../../components/ModalDelete'
import { useParams } from 'react-router-dom'

const EditProfessional = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const ds = document.documentElement.dataset.coreuiTheme
    if (ds) return ds
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onColorSchemeChange = () => {
      const ds = document.documentElement.dataset.coreuiTheme
      if (ds) setColorScheme(ds)
      else if (window.matchMedia)
        setColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    document.documentElement.addEventListener('ColorSchemeChange', onColorSchemeChange)
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    mq && mq.addEventListener && mq.addEventListener('change', onColorSchemeChange)
    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', onColorSchemeChange)
      mq && mq.removeEventListener && mq.removeEventListener('change', onColorSchemeChange)
    }
  }, [])

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [selectedSubspecialties, setSelectedSubspecialties] = useState([])
  const [professional, setProfessional] = useState(null)
  const [originalProfessional, setOriginalProfessional] = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [subspecialties, setSubspecialties] = useState([])
  const token = localStorage.getItem('authToken')
  const { id } = useParams()
  const { request, loading: apiLoading } = useApi()

  const selectStyles = {
    control: (p) => ({ ...p, background: colorScheme === 'dark' ? '#23262b' : p.background, color: colorScheme === 'dark' ? '#fff' : p.color }),
    singleValue: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color }),
    input: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color }),
    placeholder: (p) => ({ ...p, color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : p.color }),
    menu: (p) => ({ ...p, zIndex: 9999, background: colorScheme === 'dark' ? '#2b2f33' : p.background }),
    menuList: (p) => ({ ...p, background: colorScheme === 'dark' ? '#2b2f33' : p.background }),
    option: (p, s) => ({ ...p, background: s.isFocused ? (colorScheme === 'dark' ? '#3a3f44' : p.background) : (colorScheme === 'dark' ? '#2b2f33' : p.background), color: colorScheme === 'dark' ? '#fff' : p.color }),
    multiValue: (p) => ({ ...p, background: colorScheme === 'dark' ? '#3a3f44' : p.background }),
    multiValueLabel: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color }),
    multiValueRemove: (p) => ({ ...p, color: colorScheme === 'dark' ? '#fff' : p.color, ':hover': { backgroundColor: '#ef4444', color: '#fff' } }),
  }

  const fetchProfessional = async (profId) => {
    setLoading(true)
    try {
      const { data, status, success } = await request('get', `/professionals/${profId}`, null, { Authorization: `Bearer ${token}` })
      if (status === 403 || status === 401) { navigate('/404'); return }
      if (!success || !data) throw new Error('Error fetching professional')
      setProfessional(data)
      setOriginalProfessional(data)
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
        const specialtyList = (data || []).filter((item) => item.type === 'specialty').map((s) => ({ label: s.name, value: s.id }))
        const subspecialtyList = (data || []).filter((item) => item.type === 'subspecialty').map((s) => ({ label: s.name, value: s.id }))
        setSpecialties(specialtyList)
        setSubspecialties(subspecialtyList)
      } catch (error) { console.error('Error fetching specialties:', error) }
    }
    fetchSpecialties()
  }, [id, token])

  useEffect(() => {
    if (professional && specialties.length > 0 && subspecialties.length > 0) {
      if (Array.isArray(professional.specialties)) {
        setSelectedSpecialties(professional.specialties.map((name, idx) => {
          const found = specialties.find((s) => s.label === name)
          return found ? { label: found.label, value: found.value } : { label: name, value: `custom-${idx}-${name}` }
        }))
      }
      if (Array.isArray(professional.subspecialties)) {
        setSelectedSubspecialties(professional.subspecialties.map((name, idx) => {
          const found = subspecialties.find((s) => s.label === name)
          return found ? { label: found.label, value: found.value } : { label: name, value: `custom-${idx}-${name}` }
        }))
      }
    }
  }, [professional, specialties, subspecialties])

  useEffect(() => {
    setUser(null)
    setLoading(true)
    if (location.state && location.state.user) {
      const newUser = location.state.user
      setUser(newUser)
      localStorage.setItem('selectedProfessional', JSON.stringify(newUser))
      const firstName = newUser.first_name.split(' ')[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      navigate(`/professionals/${firstName}`, { replace: true })
    } else {
      const storedUser = localStorage.getItem('selectedProfessional')
      if (storedUser) setUser(JSON.parse(storedUser))
      setLoading(false)
    }
  }, [location, navigate])

  if (!professional && (loading || apiLoading)) return null
  if (!professional) return <p>{t('Professional not found.')}</p>

  const handleFieldsDisabled = () => setFieldsDisabled((prev) => !prev)

  const save = async () => {
    try {
      const combinedSpecialties = [
        ...selectedSpecialties.map((s) => s.value),
        ...selectedSubspecialties.map((s) => s.value),
      ]
      const { data: result, success, error: apiError } = await request(
        'put',
        `/professionals/${professional.id}`,
        {
          professional: {
            professional_type_id: professional.professional_type_id || null,
            biography: professional.biography || null,
            years_of_experience: professional.years_of_experience || 0,
          },
          specialties: combinedSpecialties,
          first_name: professional.first_name || '',
          last_name: professional.last_name || '',
          email: professional.email || '',
          address: professional.address || '',
          phone: professional.phone || '',
        },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (!success) {
        if (apiError && apiError.issues && Array.isArray(apiError.issues)) {
          Notifications.showAlert(setAlert, apiError.issues.map((i) => Array.isArray(i.path) ? `${i.path.join('.')} - ${i.message}` : `${i.path || 'unknown'} - ${i.message}`).join('\n'), 'danger')
        } else {
          Notifications.showAlert(setAlert, (apiError && apiError.message) || 'Error updating professional.', 'danger')
        }
        return
      }
      fetchProfessional(professional.id)
      setProfessional(result.professional)
      setUser(result.user)
      Notifications.showAlert(setAlert, t('Changes saved successfully!'), 'info')
      setFieldsDisabled(true)
    } catch (error) {
      Notifications.showAlert(setAlert, t('Error saving changes.'), 'danger')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const currentStatus = user?.status || professional?.status
      const updatedStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
      const { data: result, success } = await request(
        'put', `/professionals/status/${userId}`,
        { newStatus: updatedStatus },
        { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      )
      if (success) {
        setUser(result.user)
        Notifications.showAlert(setAlert, `Professional has been ${updatedStatus === 'Active' ? 'activated' : 'deactivated'}.`, 'info')
      } else {
        Notifications.showAlert(setAlert, 'Failed to update professional status.', 'danger')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, t('Error updating status.'), 'danger')
    }
  }

  const confirmDelete = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await request('delete', `/professionals/${professional.id}`, null, headers)
      if (res.success) {
        Notifications.showAlert(setAlert, t('Professional deleted successfully.'), 'warning')
        setDeleteModalVisible(false)
        navigate('/professionals')
      } else {
        Notifications.showAlert(setAlert, (res.data && res.data.message) || 'Could not delete the professional.', 'danger')
      }
    } catch (error) {
      Notifications.showAlert(setAlert, t('An unexpected error occurred.'), 'danger')
    }
  }

  const currentStatus = user?.status || professional?.status

  return (
    <CRow className="justify-content-center">
      {/* Alert — at CRow level so position:fixed works correctly */}
      {alert && (
        <CAlert color={alert.type} className="alert-fixed">
          {alert.message}
        </CAlert>
      )}

      {/* Page Header */}
      <CCol md={12} className="mb-4">
        <h3 className="fw-bold text-primary-emphasis d-flex align-items-center">
          <CIcon icon={cilPencil} size="lg" className="me-2" />
          {t('Edit Professional')}
        </h3>
        <p className="text-muted small">{t('Professional')} #{professional.id}</p>
        <hr className="my-3 opacity-10" />
      </CCol>

      {/* Sidebar */}
      <CCol lg={3}>
        <div className="sticky-lg-top" style={{ top: '1.5rem', zIndex: 10 }}>
          <CCard className="mb-3 shadow-sm border-0 overflow-hidden">
            <div className="p-1" style={{ backgroundColor: 'var(--cui-primary)' }}></div>
            <CCardBody>
              <h6 className="text-primary fw-bold text-uppercase ls-1 mb-3">
                {t('Professional Information')}
              </h6>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Full Name')}</label>
                <div className="fw-bold fs-5 text-primary-emphasis">
                  {originalProfessional?.first_name || professional.first_name} {originalProfessional?.last_name || professional.last_name}
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Email')}</label>
                <div className="fw-medium">{originalProfessional?.email || professional.email}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Professional Type')}</label>
                <div className="fw-medium">{originalProfessional?.professional_type || professional.professional_type || 'N/A'}</div>
              </div>
              <div className="mb-3">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Status')}</label>
                <div className="fw-medium">{currentStatus}</div>
              </div>
              <div className="mb-1">
                <label className="small text-muted text-uppercase fw-bold d-block">{t('Created at')}</label>
                <div className="small">{professional.created_at ? new Date(professional.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              {professional.updated_at && (
                <div className="mt-2 text-muted-subtle" style={{ fontSize: '0.75rem' }}>
                  <strong>{t('Last Updated')}:</strong> {new Date(professional.updated_at).toLocaleString()}
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody className="p-2 d-flex flex-column gap-1">
              <CButton
                color={currentStatus === 'Active' ? 'warning' : 'success'}
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => handleToggleStatus(professional.id)}
              >
                <CIcon icon={currentStatus === 'Active' ? cilBan : cilCheckCircle} className="me-2" />
                {currentStatus === 'Active' ? t('Deactivate Professional') : t('Activate Professional')}
              </CButton>
              <CButton
                color="danger"
                variant="ghost"
                className="w-100 text-start d-flex align-items-center"
                onClick={() => setDeleteModalVisible(true)}
              >
                <CIcon icon={cilTrash} className="me-2" />
                {t('Delete Professional')}
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CCol>

      {/* Main Form */}
      <CCol lg={9}>
        <CForm>
          {/* Section 1: Personal Info */}
          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
              <CIcon icon={cilUser} className="me-2 text-primary" size="lg" />
              <h5 className="mb-0 fw-bold">{t('Personal Information')}</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="firstName"
                    label={t('First name')}
                    value={professional.first_name || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, first_name: e.target.value }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="lastName"
                    label={t('Last name')}
                    value={professional.last_name || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, last_name: e.target.value }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="email"
                    id="email"
                    label={t('Email')}
                    value={professional.email || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    id="phone"
                    label={t('Phone')}
                    value={professional.phone || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, phone: e.target.value }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={12}>
                  <CFormInput
                    type="text"
                    id="address"
                    label={t('Address')}
                    value={professional.address || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, address: e.target.value }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
                <CCol md={9}>
                  <CFormTextarea
                    id="biography"
                    label={t('Biography')}
                    value={professional.biography || ''}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, biography: e.target.value }))}
                    disabled={fieldsDisabled}
                    rows={4}
                    style={{ resize: 'none' }}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    id="years_of_experience"
                    label={t('Years of Experience')}
                    value={professional.years_of_experience || 0}
                    onChange={(e) => setProfessional((prev) => ({ ...prev, years_of_experience: Number(e.target.value) }))}
                    disabled={fieldsDisabled}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Section 2: Specialties */}
          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center">
              <CIcon icon={cilMedicalCross} className="me-2 text-primary" size="lg" />
              <h5 className="mb-0 fw-bold">{t('Specialties')}</h5>
            </CCardHeader>
            <CCardBody className="p-4">
              <CRow className="g-3">
                <CCol md={12}>
                  <label className="form-label fw-semibold small text-uppercase text-muted">{t('Specialties')}</label>
                  <Select
                    isMulti
                    name="specialty"
                    options={specialties}
                    value={selectedSpecialties}
                    onChange={setSelectedSpecialties}
                    classNamePrefix="react-select"
                    placeholder={t('Select specialties')}
                    isDisabled={fieldsDisabled}
                    styles={selectStyles}
                  />
                </CCol>
                <CCol md={12}>
                  <label className="form-label fw-semibold small text-uppercase text-muted">{t('Subspecialties')}</label>
                  <Select
                    isMulti
                    name="subspecialty"
                    options={subspecialties}
                    value={selectedSubspecialties}
                    onChange={setSelectedSubspecialties}
                    classNamePrefix="react-select"
                    placeholder={t('Select subspecialties')}
                    isDisabled={fieldsDisabled}
                    styles={selectStyles}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 mb-5">
            {fieldsDisabled ? (
              <>
                <CButton color="secondary" variant="ghost" onClick={() => navigate('/professionals')}>
                  {t('Cancel')}
                </CButton>
                <CButton color="primary" onClick={handleFieldsDisabled} className="px-4">
                  <CIcon icon={cilPencil} className="me-2" />
                  {t('Edit')}
                </CButton>
              </>
            ) : (
              <>
                <CButton color="secondary" variant="outline" onClick={() => {
                  handleFieldsDisabled();
                  if (originalProfessional) {
                    setProfessional(originalProfessional);
                  }
                }}>
                  {t('Cancel')}
                </CButton>
                <CButton color="primary" onClick={save} className="px-4 shadow-sm">
                  <CIcon icon={cilSave} className="me-2" />
                  {t('Save Changes')}
                </CButton>
              </>
            )}
          </div>
        </CForm>
      </CCol>

      <ModalDelete
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        title={t('Delete Professional')}
        message={t('Are you sure you want to delete this professional? This action cannot be undone.')}
      />
    </CRow>
  )
}

export default EditProfessional
