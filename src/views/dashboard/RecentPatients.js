import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from '@coreui/react'
import './../../scss/style.scss'
import { useTranslation } from 'react-i18next'
import useDashboard from '../../hooks/useDashboard'

const RecentPatientsTable = () => {
  const [recentPatients, setRecentPatients] = useState([])
  const { t } = useTranslation()
  const { dashboard, loading: dashLoading } = useDashboard()

  useEffect(() => {
    if (!dashboard) return
    if (dashboard.recentPatients) setRecentPatients(dashboard.recentPatients)
  }, [dashboard])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <CBadge color="success">{t('Completed')}</CBadge>
      case 'pending':
        return <CBadge color="warning">{t('Pending')}</CBadge>
      case 'confirmed':
        return <CBadge color="primary">{t('Confirmed')}</CBadge>
      case 'canceled':
        return <CBadge color="danger">{t('Canceled')}</CBadge>
      default:
        return <CBadge color="secondary">{t('Unknown')}</CBadge>
    }
  }

  return (
    <CCard className="mb-4 mb-sm-0">
      <CCardHeader>
        <h5>{t('Recent patients')}</h5>
        <small className="text-muted">
          {t('Patients registered in appointments during the last 7 days')}
        </small>
      </CCardHeader>
      <CCardBody>
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell>{t('Patient')}</CTableHeaderCell>
              <CTableHeaderCell>{t('Professional')}</CTableHeaderCell>
              <CTableHeaderCell>{t('City')}</CTableHeaderCell>
              <CTableHeaderCell>{t('Appointment Date')}</CTableHeaderCell>
              <CTableHeaderCell>{t('Status')}</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {dashLoading ? (
              // === Skeleton Loader ===
              Array.from({ length: 5 }).map((_, index) => (
                <CTableRow key={index}>
                  <CTableDataCell colSpan={5}>
                    <div className="skeleton-row"></div>
                  </CTableDataCell>
                </CTableRow>
              ))
            ) : recentPatients.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={5} className="text-center">
                  {t('No recent patients available')}
                </CTableDataCell>
              </CTableRow>
            ) : (
              recentPatients.map((patient, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{patient.patient || t('Unknown')}</CTableDataCell>
                  <CTableDataCell>{patient.professional || t('Unknown')}</CTableDataCell>
                  <CTableDataCell>{patient.city || t('Unknown')}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(patient.scheduled_at).toLocaleDateString()}
                  </CTableDataCell>
                  <CTableDataCell>{getStatusBadge(patient.status)}</CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default RecentPatientsTable
