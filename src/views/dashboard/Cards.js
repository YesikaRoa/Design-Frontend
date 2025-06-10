import React, { useEffect, useState } from 'react'
import { CRow, CCol, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserFollow, cilListRich } from '@coreui/icons'
import { useTranslation } from 'react-i18next'

const Cards = () => {
  const { t } = useTranslation()
  const [data, setData] = useState({
    totalCompleted: 0,
    newPatients: 0,
    mostRequestedSpecialty: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsResponse, professionalSpecialtiesResponse, specialtiesResponse] =
          await Promise.all([
            fetch('http://localhost:8000/appointments'),
            fetch('http://localhost:8000/professional_specialty'),
            fetch('http://localhost:8000/specialty'),
          ])

        const appointments = await appointmentsResponse.json()
        const professionalSpecialties = await professionalSpecialtiesResponse.json()
        const specialties = await specialtiesResponse.json()

        // Establecer el rango para el mes pasado
        const now = new Date()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1) // 1er día del mes pasado
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0) // Último día del mes pasado
        endOfLastMonth.setHours(23, 59, 59, 999) // Asegurar incluir todo el día

        // Calcular citas completadas en el mes pasado
        const totalCompleted = appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduled_at)
          return (
            appointment.status === 'completed' &&
            appointmentDate >= startOfLastMonth &&
            appointmentDate <= endOfLastMonth
          )
        }).length

        // Calcular el inicio de esta semana (lunes)
        const today = new Date()
        const startOfWeek = new Date(today)
        const dayOfWeek = today.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
        startOfWeek.setDate(today.getDate() - dayOfWeek + 1) // Ajustar al lunes
        startOfWeek.setHours(0, 0, 0, 0)

        // Calcular el fin de la semana (viernes)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 4) // Ajustar al viernes
        endOfWeek.setHours(23, 59, 59, 999)

        // Calcular citas confirmadas entre lunes y viernes
        const newPatients = appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.scheduled_at)
          return (
            appointment.status === 'confirmed' &&
            appointmentDate >= startOfWeek &&
            appointmentDate <= endOfWeek
          )
        }).length

        // Mapear especialidades
        const specialtyMap = specialties.reduce((acc, specialty) => {
          acc[specialty.id] = specialty.name
          return acc
        }, {})

        // Mapear profesional a especialidad
        const professionalToSpecialtyMap = professionalSpecialties.reduce((acc, item) => {
          acc[item.professional_id] = item.specialty_id
          return acc
        }, {})

        // Contar la especialidad más solicitada
        const specialtyCounts = {}

        appointments.forEach((appointment) => {
          const specialtyId = professionalToSpecialtyMap[appointment.professional_id]
          if (specialtyId && specialtyId >= 1 && specialtyId <= 15) {
            const specialtyName = specialtyMap[specialtyId] || 'Unknown'
            specialtyCounts[specialtyName] = (specialtyCounts[specialtyName] || 0) + 1
          }
        })

        const mostRequestedSpecialty = Object.keys(specialtyCounts).reduce((a, b) =>
          specialtyCounts[a] > specialtyCounts[b] ? a : b,
        )

        setData({
          totalCompleted,
          newPatients,
          mostRequestedSpecialty,
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
            <div className="fs-3 fw-bold">{data.mostRequestedSpecialty}</div>
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
