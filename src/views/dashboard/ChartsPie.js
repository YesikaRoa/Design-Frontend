import React, { useEffect, useRef, useState } from 'react'
import { getStyle } from '@coreui/utils'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartsSection.css'
import { useTranslation } from 'react-i18next'

const generateColors = (count) => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    colors.push(color)
  }
  return colors
}

const ChartsSection = () => {
  const doughnutRef1 = useRef(null)
  const doughnutRef2 = useRef(null)
  const { t } = useTranslation()
  const [cityData, setCityData] = useState([])
  const [specialtyData, setSpecialtyData] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Token de autenticación
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()

        // Procesar pacientes por ciudad
        const cityLabels = data.patientsByCity.map((entry) => entry.city)
        const cityValues = data.patientsByCity.map((entry) => entry.patient_count)

        // Procesar especialidades más solicitadas
        const specialtyLabels = data.specialtiesByRequest.map((entry) => entry.specialty)
        const specialtyValues = data.specialtiesByRequest.map((entry) => entry.patient_count)

        setCityData({ labels: cityLabels, data: cityValues })
        setSpecialtyData({ labels: specialtyLabels, data: specialtyValues })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
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
            <CCardHeader style={{ fontWeight: 'bold' }}>{t('Patients by City')}</CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                <CChart type="doughnut" data={doughnutData1} options={options} ref={doughnutRef1} />
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-sm-6">
          <CCard>
            <CCardHeader style={{ fontWeight: 'bold' }}>
              {t('Most Requested Specialties')}
            </CCardHeader>
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
