import React, { useEffect, useState } from 'react'
import { CRow, CCol, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserFollow, cilListRich } from '@coreui/icons'

const Cards = () => {
  const [data, setData] = useState({
    totalCompleted: 0,
    newPatients: 0,
    mostRequestedService: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/appointments')
        const appointments = await response.json()

        // Get today's date
        const today = new Date()
        today.setHours(23, 59, 59, 999) // Asegúrate de incluir todo el día de hoy

        // Calculate the start of the last month
        const lastMonth = new Date()
        lastMonth.setMonth(today.getMonth() - 1)
        lastMonth.setHours(0, 0, 0, 0)

        // Calculate the start of the last week
        const lastWeek = new Date()
        lastWeek.setDate(today.getDate() - 7)
        lastWeek.setHours(0, 0, 0, 0)

        // Filter completed appointments in the last month
        const totalCompleted = appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduled_at)
          return (
            appointment.status === 'completed' &&
            appointmentDate >= lastMonth &&
            appointmentDate <= today
          )
        }).length

        // Filter confirmed appointments in the last week (including today)
        const newPatients = appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduled_at)
          return (
            appointment.status === 'confirmed' &&
            appointmentDate >= lastWeek &&
            appointmentDate <= today
          )
        }).length

        // Count the most requested service
        const serviceCounts = appointments.reduce((acc, appointment) => {
          acc[appointment.category] = (acc[appointment.category] || 0) + 1
          return acc
        }, {})

        const mostRequestedService = Object.keys(serviceCounts).reduce((a, b) =>
          serviceCounts[a] > serviceCounts[b] ? a : b,
        )

        setData({
          totalCompleted,
          newPatients,
          mostRequestedService,
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <CRow className="mb-4">
      <CCol sm="4">
        <CCard
          className="text-dark"
          style={{ backgroundColor: '#d4edda', border: '2px solid #c3e6cb' }}
        >
          <CCardBody>
            <div className="fs-3 fw-bold">{data.totalCompleted}</div>
            <div className="text-uppercase">Patients Attended</div>
            <small className="text-muted">In the last month with completed status</small>
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
            <div className="text-uppercase">New Patients</div>
            <small className="text-muted">This week with confirmed status</small>
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
            <div className="fs-3 fw-bold">{data.mostRequestedService}</div>
            <div className="text-uppercase">The most requested category</div>
            <small className="text-muted">Based on recent appointments</small>
          </CCardBody>
          <CIcon icon={cilListRich} size="xl" className="m-3 text-warning" />
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Cards
