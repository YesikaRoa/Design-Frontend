import React, { useRef, useEffect, useState } from 'react'
import { getStyle } from '@coreui/utils'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartBarExample.css'
import { useTranslation } from 'react-i18next'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const { t } = useTranslation()
  const [chartData, setChartData] = useState({
    pending: [],
    confirmed: [],
    completed: [],
    canceled: [],
    professionals: [],
    professionalCounts: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traer appointments, users y professionals
        const [appointmentsResponse, usersResponse, professionalsResponse] = await Promise.all([
          fetch('http://localhost:8000/appointments'),
          fetch('http://localhost:8000/users'),
          fetch('http://localhost:8000/professionals'),
        ])
        const appointments = await appointmentsResponse.json()
        const users = await usersResponse.json()
        const professionals = await professionalsResponse.json()

        // Crear mapa userId -> nombre completo
        const usersMap = {}
        users.forEach((user) => {
          usersMap[user.id] = `${user.first_name} ${user.last_name}`
        })

        // Crear mapa professionalId -> userId
        const professionalToUserMap = {}
        professionals.forEach((professional) => {
          professionalToUserMap[professional.id] = professional.user_id
        })

        // Inicializar arrays para conteos mensuales
        const pending = new Array(12).fill(0)
        const confirmed = new Array(12).fill(0)
        const completed = new Array(12).fill(0)
        const canceled = new Array(12).fill(0)

        // Conteo de citas por estado y mes
        appointments.forEach((appointment) => {
          let month = null

          if (
            appointment.status === 'canceled by patient' ||
            appointment.status === 'canceled by professional'
          ) {
            if (appointment.canceled_at) {
              month = new Date(appointment.canceled_at).getMonth()
            } else if (appointment.scheduled_at) {
              month = new Date(appointment.scheduled_at).getMonth()
            }
          } else {
            if (appointment.scheduled_at) {
              month = new Date(appointment.scheduled_at).getMonth()
            }
          }

          if (month !== null) {
            if (appointment.status === 'pending') {
              pending[month]++
            } else if (appointment.status === 'confirmed') {
              confirmed[month]++
            } else if (appointment.status === 'completed') {
              completed[month]++
            } else if (appointment.status === 'canceled') {
              canceled[month]++
            }
          }
        })

        // Contar pacientes atendidos por profesional
        const professionalCounts = appointments.reduce((acc, appointment) => {
          const professionalId = appointment.professional_id
          if (professionalId) {
            acc[professionalId] = (acc[professionalId] || 0) + 1
          }
          return acc
        }, {})

        // Mapear professionalIds a nombres usando professionalToUserMap y usersMap
        const professionalsNames = Object.keys(professionalCounts).map((professionalId) => {
          const userId = professionalToUserMap[professionalId]
          return usersMap[userId] || 'Unknown'
        })

        const professionalData = Object.values(professionalCounts)

        setChartData({
          pending,
          confirmed,
          completed,
          canceled,
          professionals: professionalsNames,
          professionalCounts: professionalData,
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const data1 = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Pending',
        backgroundColor: '#ff9800',
        data: chartData.pending,
      },
      {
        label: 'Confirmed',
        backgroundColor: '#4caf50',
        data: chartData.confirmed,
      },
      {
        label: 'Completed',
        backgroundColor: '#2196f3',
        data: chartData.completed,
      },
      {
        label: 'Canceled',
        backgroundColor: '#f44336',
        data: chartData.canceled,
      },
    ],
  }

  const data2 = {
    labels: chartData.professionals,
    datasets: [
      {
        label: 'Patients Attended',
        backgroundColor: '#4caf50',
        data: chartData.professionalCounts,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#000',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000',
        },
      },
    },
  }

  return (
    <CCardBody className="space-component">
      <div className="row">
        <div className="col-sm-6">
          <CCard>
            <CCardHeader style={{ fontWeight: 'bold' }}>{t('Appointment Summary')}</CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                <CChart type="bar" data={data1} options={options} ref={chartRef} />
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-sm-6">
          <CCard>
            <CCardHeader style={{ fontWeight: 'bold' }}>
              {t('Professionals with Most Patients Attended')}
            </CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                <CChart type="bar" data={data2} options={options} ref={chartRef} />
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>
    </CCardBody>
  )
}

export default ChartBarExample
