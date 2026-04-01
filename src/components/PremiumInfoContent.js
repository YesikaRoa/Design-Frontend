import React from 'react'
import { CRow, CCol, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilEnvelopeClosed,
  cilPhone,
  cilLocationPin,
  cilCalendar,
  cilCheckCircle,
  cilInfo,
  cilHospital,
  cilMedicalCross,
  cilBriefcase,
  cilHistory,
} from '@coreui/icons'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../utils/dateUtils'

const PremiumInfoContent = ({ type, data, colorScheme }) => {
  const { t } = useTranslation()

  if (!data) return <p className="text-muted p-3">{t('No information available')}.</p>

  const isDark = colorScheme === 'dark'

  // Helper for info rows
  const InfoRow = ({ label, value, icon }) => (
    <div className="mb-3 ps-1">
      <label className="d-block small text-muted text-uppercase fw-semibold mb-1">
        {icon && <CIcon icon={icon} className="me-1" size="sm" />}
        {label}
      </label>
      <div
        className={`fw-medium ${isDark ? 'text-light' : 'text-dark'}`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </div>
    </div>
  )

  const TitleSection = ({ title, icon }) => (
    <h6 className="text-primary fw-bold mb-3 d-flex align-items-center">
      <CIcon icon={icon} className="me-2" />
      {title}
    </h6>
  )

  // Header Banner logic based on type
  const renderBanner = () => {
    let mainTitle = ''
    let subTitle = ''
    let badgeLabel = data.status || ''
    let badgeColor = data.status === 'Active' || data.status === 'Confirmed' ? 'success' : 'danger'

    if (type === 'user' || type === 'patient' || type === 'professional') {
      mainTitle = `${data.first_name} ${data.last_name}`
      subTitle = type === 'professional' ? data.professional_type : (data.role_id === 1 ? t('Administrator') : (data.role_id === 2 ? t('Patient') : t('User')))
    } else if (type === 'appointment') {
      mainTitle = data.patient_full_name
      subTitle = `${t('With')}: ${data.professional_full_name}`
      badgeLabel = data.status
      if (data.status === 'Scheduled') badgeColor = 'info'
      if (data.status === 'Completed') badgeColor = 'success'
      if (data.status === 'Cancelled') badgeColor = 'danger'
    }

    return (
      <div
        className="info-banner mb-4 p-3 rounded"
        style={{
          backgroundColor: isDark ? 'rgba(56, 73, 219, 0.15)' : 'rgba(56, 73, 219, 0.05)',
          border: `1px solid ${isDark ? 'rgba(56, 73, 219, 0.3)' : 'rgba(56, 73, 219, 0.1)'}`,
        }}
      >
        <CRow className="align-items-center g-3">
          <CCol xs={8}>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <span className="fs-5 fw-bold text-primary d-block">{mainTitle}</span>
                <span className="small text-muted fw-medium fs-6">{subTitle}</span>
              </div>
            </div>
          </CCol>
          <CCol xs={4} className="text-end">
             <div className="mb-1">
                <CBadge color={badgeColor} shape="rounded-pill" className="px-3 py-2">
                  {badgeLabel ? t(badgeLabel) : ''}
                </CBadge>
             </div>
             <span className="text-muted small fw-bold">ID #{data.id}</span>
          </CCol>
        </CRow>
      </div>
    )
  }

  return (
    <div className={`premium-info-content ${isDark ? 'text-light' : 'text-dark'}`}>
      {renderBanner()}

      <CRow className="g-4">
        {/* Left Column */}
        <CCol md={6}>
          <div className="h-100 p-3 rounded" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            {type === 'appointment' ? (
              <>
                <TitleSection title={t('Appointment Details')} icon={cilCalendar} />
                <InfoRow label={t('Scheduled At')} value={formatDate(data.scheduled_at, 'DATETIME')} icon={cilHistory} />
                <InfoRow label={t('City')} value={data.city} icon={cilLocationPin} />
                <InfoRow label={t('Has Medical Record')} value={data.has_medical_record ? t('Yes') : t('No')} icon={cilInfo} />
              </>
            ) : (
              <>
                <TitleSection title={t('Personal Information')} icon={cilUser} />
                <InfoRow label={t('First name')} value={data.first_name} />
                <InfoRow label={t('Last name')} value={data.last_name} />
                <InfoRow label={t('Birth Date')} value={formatDate(data.birth_date, 'DATE')} icon={cilCalendar} />
                <InfoRow label={t('Gender')} value={data.gender === 'F' ? t('Female') : t('Male')} />
              </>
            )}
          </div>
        </CCol>

        {/* Right Column */}
        <CCol md={6}>
          <div className="h-100 p-3 rounded" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            {type === 'appointment' ? (
              <>
                <TitleSection title={t('Notes & Reason')} icon={cilInfo} />
                <InfoRow label={t('Reason for visit')} value={data.reason_for_visit} />
                <InfoRow label={t('Notes')} value={data.notes} />
              </>
            ) : (
              <>
                <TitleSection title={t('Contact & Extras')} icon={cilEnvelopeClosed} />
                <InfoRow label={t('Email')} value={data.email} icon={cilEnvelopeClosed} />
                <InfoRow label={t('Phone')} value={data.phone} icon={cilPhone} />
                <InfoRow label={t('Address')} value={data.address} icon={cilLocationPin} />
                
                {type === 'patient' && (
                  <InfoRow label={t('Medical Data')} value={data.medical_data} icon={cilMedicalCross} />
                )}
                
                {type === 'professional' && (
                   <>
                     <InfoRow label={t('Professional Type')} value={data.professional_type} icon={cilHospital} />
                     <InfoRow label={t('Years of Experience')} value={data.years_of_experience} icon={cilBriefcase} />
                   </>
                )}
              </>
            )}
          </div>
        </CCol>

        {/* Full Width Sections for Professional Details */}
        {type === 'professional' && (
          <CCol md={12}>
            <div className="p-3 rounded" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
               <TitleSection title={t('Biography & Specialties')} icon={cilInfo} />
               <CRow>
                 <CCol md={6}>
                    <InfoRow label={t('Specialty')} value={data.specialties?.join(', ')} />
                    <InfoRow label={t('Subspecialty')} value={data.subspecialties?.join(', ')} />
                 </CCol>
                 <CCol md={6}>
                    <InfoRow label={t('Biography')} value={data.biography} />
                 </CCol>
               </CRow>
            </div>
          </CCol>
        )}
      </CRow>

      {/* Footer Meta */}
      <div className="mt-4 pt-2 border-top small text-muted text-end">
        {data.created_at && (
          <div className="mb-1">
            <strong>{t('Created at')}:</strong> {formatDate(data.created_at, 'DATETIME')}
          </div>
        )}
        {data.updated_at && (
          <div>
            <strong>{t('Last Updated')}:</strong> {formatDate(data.updated_at, 'DATETIME')}
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumInfoContent
