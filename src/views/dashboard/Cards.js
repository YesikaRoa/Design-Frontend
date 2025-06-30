import React, { useEffect, useState } from 'react'
import { CRow, CCol, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserFollow, cilListRich } from '@coreui/icons'
import { useTranslation } from 'react-i18next'

const Cards = () => {
  const { t } = useTranslation()
  const [data, setData] = useState({
    attendedPatients: 0,
    newPatients: 0,
    topSpecialty: '',
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Asegúrate de incluir el token
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const result = await response.json()
        setData({
          attendedPatients: result.attendedPatients || 0,
          newPatients: result.newPatients || 0,
          topSpecialty: result.topSpecialty?.specialty || 'Unknown',
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <CRow className="mb-4">
      <CCol sm="4">
        <CCard
          className="text-dark"
          style={{ backgroundColor: '#d4edda', border: '2px solid #c3e6cb' }}
        >
          <CCardBody>
            <div className="fs-3 fw-bold">{data.attendedPatients}</div>
            <div className="text-uppercase">{t('Patients Attended')}</div>
            <small className="text-muted">{t('In the last month with completed status')}</small>
          </CCardBody>
          <CIcon icon={cilUser} size="xl" className="m-3 text-success" />
        </CCard>
      </CCol>

      <CCol sm="4">
        <CCard
          className="text-dark"
          style={{ backgroundColor: '#d1ecf1', border: '2px solid #bee5eb' }}
        >
          <CCardBody>
            <div className="fs-3 fw-bold">{data.newPatients}</div>
            <div className="text-uppercase">{t('New Patients')}</div>
            <small className="text-muted">{t('This week with confirmed status')}</small>
          </CCardBody>
          <CIcon icon={cilUserFollow} size="xl" className="m-3 text-info" />
        </CCard>
      </CCol>

      <CCol sm="4">
        <CCard
          className="text-dark"
          style={{ backgroundColor: '#fff3cd', border: '2px solid #ffeeba' }}
        >
          <CCardBody>
            <div className="fs-3 fw-bold">{data.topSpecialty}</div>
            <div className="text-uppercase">{t('Most Requested Specialty')}</div>
            <small className="text-muted">{t('Based on recent appointments')}</small>
          </CCardBody>
          <CIcon icon={cilListRich} size="xl" className="m-3 text-warning" />
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Cards
