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

const RecentPatientsTable = () => {
  const [appointments, setAppointments] = useState([])
  const [users, setUsers] = useState({}) // Almacenar usuarios por ID

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:8000/appointments')
        const data = await response.json()

        // Filtrar citas recientes
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(today.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const recentAppointments = data
          .filter((appointment) => {
            const appointmentDate = new Date(appointment.scheduled_at)
            return appointmentDate >= sevenDaysAgo && appointmentDate <= today
          })
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 10)

        setAppointments(recentAppointments)

        // Obtener IDs únicos de pacientes y profesionales
        const userIds = [...new Set(recentAppointments.flatMap((a) => [a.patient, a.professional]))]

        // Fetch de usuarios
        const usersResponse = await fetch('http://localhost:8000/users')
        const usersData = await usersResponse.json()

        // Mapa de usuarios
        const usersMap = usersData.reduce((map, user) => {
          map[user.id] = `${user.first_name} ${user.last_name}`
          return map
        }, {})

        setUsers(usersMap)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchAppointments()
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <CBadge color="success">Completed</CBadge>
      case 'pending':
        return <CBadge color="warning">Pending</CBadge>
      case 'confirmed':
        return <CBadge color="primary">Confirmed</CBadge>
      case 'canceled by professional':
      case 'canceled by patient':
        return <CBadge color="danger">Canceled</CBadge>
      default:
        return <CBadge color="secondary">Unknown</CBadge>
    }
  }

  return (
    <CCard className="space-component">
      <CCardHeader>
        <h5>Recent Patients</h5>
        <small className="text-muted">
          Patients registered in appointments during the last week
        </small>
      </CCardHeader>
      <CCardBody>
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell>Patient</CTableHeaderCell>
              <CTableHeaderCell>Professional</CTableHeaderCell>
              <CTableHeaderCell>City</CTableHeaderCell>
              <CTableHeaderCell>Appointment Date</CTableHeaderCell>
              <CTableHeaderCell>Specialty</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {appointments.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center">
                  No appointments available
                </CTableDataCell>
              </CTableRow>
            ) : (
              appointments.map((appointment) => (
                <CTableRow key={appointment.id}>
                  <CTableDataCell>{users[appointment.patient] || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>{users[appointment.professional] || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>{appointment.city || 'Unknown'}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(appointment.scheduled_at).toLocaleDateString()}
                  </CTableDataCell>
                  <CTableDataCell>{appointment.specialty || 'N/A'}</CTableDataCell>
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
