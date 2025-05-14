import React, { useRef, useEffect, useState } from 'react'
import { getStyle } from '@coreui/utils'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartBarExample.css'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const [chartData, setChartData] = useState({
    pending: [],
    confirmed: [],
    completed: [],
    canceledByPatient: [],
    canceledByProfessional: [],
    professionals: [],
    professionalCounts: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/appointments')
        const appointments = await response.json()

        // Initialize arrays for each status by month
        const pending = new Array(12).fill(0)
        const confirmed = new Array(12).fill(0)
        const completed = new Array(12).fill(0)
        const canceledByPatient = new Array(12).fill(0)
        const canceledByProfessional = new Array(12).fill(0)

        // Count appointments by status and month
        appointments.forEach((appointment) => {
          let month = null

          // Determine the month based on the status
          if (
            appointment.status === 'canceled by patient' ||
            appointment.status === 'canceled by professional'
          ) {
            // Use canceled_at if available, otherwise use scheduled_at
            if (appointment.canceled_at) {
              month = new Date(appointment.canceled_at).getMonth()
            } else if (appointment.scheduled_at) {
              month = new Date(appointment.scheduled_at).getMonth()
            }
          } else {
            // Use scheduled_at for other statuses
            if (appointment.scheduled_at) {
              month = new Date(appointment.scheduled_at).getMonth()
            }
          }

          // Increment the corresponding counter for the status
          if (month !== null) {
            if (appointment.status === 'pending') {
              pending[month]++
            } else if (appointment.status === 'confirmed') {
              confirmed[month]++
            } else if (appointment.status === 'completed') {
              completed[month]++
            } else if (appointment.status === 'canceled by patient') {
              canceledByPatient[month]++
            } else if (appointment.status === 'canceled by professional') {
              canceledByProfessional[month]++
            }
          }
        })
        // Process data for the professionals chart
        const professionalCounts = appointments.reduce((acc, appointment) => {
          acc[appointment.professional] = (acc[appointment.professional] || 0) + 1
          return acc
        }, {})

        const professionals = Object.keys(professionalCounts)
        const professionalData = Object.values(professionalCounts)

        setChartData({
          pending,
          confirmed,
          completed,
          canceledByPatient,
          canceledByProfessional,
          professionals,
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
        label: 'Canceled by Patient',
        backgroundColor: '#f44336',
        data: chartData.canceledByPatient,
      },
      {
        label: 'Canceled by Professional',
        backgroundColor: '#9c27b0',
        data: chartData.canceledByProfessional,
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
            <CCardHeader style={{ fontWeight: 'bold' }}>Appointment Summary</CCardHeader>
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
              Professionals with Most Patients
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
