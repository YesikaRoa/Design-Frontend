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
  const [appointments, setAppointments] = useState([])
  const [users, setUsers] = useState({})
  const [cities, setCities] = useState({})
  const { t } = useTranslation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch de citas
        const appointmentsResponse = await fetch('http://localhost:8000/appointments')
        const appointmentsData = await appointmentsResponse.json()

        const today = new Date()
        today.setHours(23, 59, 59, 999)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(today.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const recentAppointments = appointmentsData
          .filter((appointment) => {
            const appointmentDate = new Date(appointment.scheduled_at)
            return appointmentDate >= sevenDaysAgo && appointmentDate <= today
          })
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 10)

        setAppointments(recentAppointments)

        // Fetch de datos relacionados
        const [usersResponse, patientsResponse, professionalsResponse, citiesResponse] =
          await Promise.all([
            fetch('http://localhost:8000/users'),
            fetch('http://localhost:8000/patient'),
            fetch('http://localhost:8000/professionals'),
            fetch('http://localhost:8000/city'),
          ])

        const [usersData, patientsData, professionalsData, citiesData] = await Promise.all([
          usersResponse.json(),
          patientsResponse.json(),
          professionalsResponse.json(),
          citiesResponse.json(),
        ])

        // Mapa de usuarios
        const usersMap = usersData.reduce((map, user) => {
          map[user.id] = `${user.first_name} ${user.last_name}`
          return map
        }, {})

        // Relacionar `patient_id` y `professional_id` con `user_id`
        const patientMap = patientsData.reduce((map, patient) => {
          map[patient.id] = usersMap[patient.user_id] || 'Unknown'
          return map
        }, {})

        const professionalMap = professionalsData.reduce((map, professional) => {
          map[professional.id] = usersMap[professional.user_id] || 'Unknown'
          return map
        }, {})

        // Mapa de ciudades
        const citiesMap = citiesData.reduce((map, city) => {
          map[city.id] = city.name
          return map
        }, {})

        setUsers({ ...patientMap, ...professionalMap })
        setCities(citiesMap)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <CBadge color="success">Completed</CBadge>
      case 'pending':
        return <CBadge color="warning">Pending</CBadge>
      case 'confirmed':
        return <CBadge color="primary">Confirmed</CBadge>
      case 'canceled':
        return <CBadge color="danger">Canceled</CBadge>
      default:
        return <CBadge color="secondary">Unknown</CBadge>
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
            {appointments.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center">
                  {t('No appointments available')}
                </CTableDataCell>
              </CTableRow>
            ) : (
              appointments.map((appointment) => (
                <CTableRow key={appointment.id}>
                  <CTableDataCell>{users[appointment.patient_id] || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>{users[appointment.professional_id] || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>{cities[appointment.city_id] || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(appointment.scheduled_at).toLocaleDateString()}
                  </CTableDataCell>
                  <CTableDataCell>{getStatusBadge(appointment.status)}</CTableDataCell>
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
