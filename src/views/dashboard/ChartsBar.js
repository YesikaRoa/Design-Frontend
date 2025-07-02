import React, { useRef, useEffect, useState } from 'react'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartBarExample.css'
import { useTranslation } from 'react-i18next'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const { t } = useTranslation()
  const [chartData, setChartData] = useState({
    appointmentsByMonth: [],
    professionals: [],
    professionalCounts: [],
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          'https://aplication-backend-production-872f.up.railway.app/api/dashboard',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Incluye el token
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()

        // Procesar appointmentsByMonth
        const months = Array.from({ length: 12 }, (_, i) => i + 1)
        const pending = months.map(
          (month) =>
            data.appointmentsByMonth.find(
              (entry) =>
                entry.month === `2025-${month.toString().padStart(2, '0')}` &&
                entry.status === 'pending',
            )?.count || 0,
        )
        const confirmed = months.map(
          (month) =>
            data.appointmentsByMonth.find(
              (entry) =>
                entry.month === `2025-${month.toString().padStart(2, '0')}` &&
                entry.status === 'confirmed',
            )?.count || 0,
        )
        const completed = months.map(
          (month) =>
            data.appointmentsByMonth.find(
              (entry) =>
                entry.month === `2025-${month.toString().padStart(2, '0')}` &&
                entry.status === 'completed',
            )?.count || 0,
        )
        const canceled = months.map(
          (month) =>
            data.appointmentsByMonth.find(
              (entry) =>
                entry.month === `2025-${month.toString().padStart(2, '0')}` &&
                entry.status === 'canceled',
            )?.count || 0,
        )

        // Procesar topProfessionals
        const professionals = data.topProfessionals.map((entry) => entry.professional)
        const professionalCounts = data.topProfessionals.map((entry) => entry.patient_count)

        setChartData({
          appointmentsByMonth: { pending, confirmed, completed, canceled },
          professionals,
          professionalCounts,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  const data1 = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Pending',
        backgroundColor: '#ff9800',
        data: chartData.appointmentsByMonth.pending,
      },
      {
        label: 'Confirmed',
        backgroundColor: '#4caf50',
        data: chartData.appointmentsByMonth.confirmed,
      },
      {
        label: 'Completed',
        backgroundColor: '#2196f3',
        data: chartData.appointmentsByMonth.completed,
      },
      {
        label: 'Canceled',
        backgroundColor: '#f44336',
        data: chartData.appointmentsByMonth.canceled,
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
