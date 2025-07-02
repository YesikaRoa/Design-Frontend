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

const RecentPatientsTable = () => {
  const [recentPatients, setRecentPatients] = useState([])
  const { t } = useTranslation()

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const response = await fetch(
          'https://aplication-backend-production-872f.up.railway.app/api/dashboard',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Token de autenticación
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()
        setRecentPatients(data.recentPatients)
      } catch (error) {
        console.error('Error fetching recent patients:', error)
      }
    }

    fetchRecentPatients()
  }, [])

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
    <CCard className="space-component">
      <CCardHeader>
        <h5>{t('Recent Patients')}</h5>
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
            {recentPatients.length === 0 ? (
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
