import React, { useEffect, useRef, useState } from 'react'
import { getStyle } from '@coreui/utils'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartsSection.css'

const generateColors = (count) => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` // Generate colors in HSL format
    colors.push(color)
  }
  return colors
}

const ChartsSection = () => {
  const doughnutRef1 = useRef(null)
  const doughnutRef2 = useRef(null)
  const [cityData, setCityData] = useState([])
  const [specialtyData, setSpecialtyData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/appointments')
        const appointments = await response.json()

        // Process data for "Patients by City"
        const cityCounts = appointments.reduce((acc, appointment) => {
          acc[appointment.city] = (acc[appointment.city] || 0) + 1
          return acc
        }, {})

        const cityLabels = Object.keys(cityCounts)
        const cityValues = Object.values(cityCounts)

        // Process data for "Most Requested Specialties"
        const specialtyCounts = appointments.reduce((acc, appointment) => {
          acc[appointment.specialty] = (acc[appointment.specialty] || 0) + 1
          return acc
        }, {})

        const specialtyLabels = Object.keys(specialtyCounts)
        const specialtyValues = Object.values(specialtyCounts)

        setCityData({ labels: cityLabels, data: cityValues })
        setSpecialtyData({ labels: specialtyLabels, data: specialtyValues })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const doughnutData1 = {
    labels: cityData.labels || [],
    datasets: [
      {
        backgroundColor: generateColors(cityData.labels?.length || 0),
        data: cityData.data || [],
      },
    ],
  }

  const doughnutData2 = {
    labels: specialtyData.labels || [],
    datasets: [
      {
        backgroundColor: generateColors(specialtyData.labels?.length || 0),
        data: specialtyData.data || [],
      },
    ],
  }

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: getStyle('--cui-body-color'),
        },
      },
    },
  }

  return (
    <CCardBody className="mb-4">
      <div className="row">
        <div className="col-sm-6">
          <CCard>
            <CCardHeader style={{ fontWeight: 'bold' }}>Patients by City</CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                <CChart type="doughnut" data={doughnutData1} options={options} ref={doughnutRef1} />
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-sm-6">
          <CCard>
            <CCardHeader style={{ fontWeight: 'bold' }}>Most Requested Specialties</CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                <CChart type="doughnut" data={doughnutData2} options={options} ref={doughnutRef2} />
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>
    </CCardBody>
  )
}

export default ChartsSection
