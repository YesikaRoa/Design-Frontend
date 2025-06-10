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
    const fetchData = async () => {
      try {
        // Fetch data from all endpoints
        const [
          appointmentsResponse,
          citiesResponse,
          professionalSpecialtiesResponse,
          specialtiesResponse,
        ] = await Promise.all([
          fetch('http://localhost:8000/appointments'),
          fetch('http://localhost:8000/city'),
          fetch('http://localhost:8000/professional_specialty'),
          fetch('http://localhost:8000/specialty'),
        ])

        // Convert responses to JSON
        const appointments = await appointmentsResponse.json()
        const cities = await citiesResponse.json()
        const professionalSpecialties = await professionalSpecialtiesResponse.json()
        const specialties = await specialtiesResponse.json()

        // ------------------------
        // 1. Map city_id to city name
        const cityMap = cities.reduce((acc, city) => {
          acc[city.id] = city.name
          return acc
        }, {})

        // ------------------------
        // 2. Process data for "Patients by City"
        const cityCounts = appointments.reduce((acc, appointment) => {
          const cityName = cityMap[appointment.city_id] || 'Unknown'
          acc[cityName] = (acc[cityName] || 0) + 1
          return acc
        }, {})

        const cityLabels = Object.keys(cityCounts)
        const cityValues = Object.values(cityCounts)

        setCityData({ labels: cityLabels, data: cityValues })

        // ------------------------
        // 3. Map professional_id to array of specialty_ids (because can have multiple)
        const professionalToSpecialtyMap = professionalSpecialties.reduce((acc, item) => {
          if (!acc[item.professional_id]) acc[item.professional_id] = []
          acc[item.professional_id].push(item.specialty_id)
          return acc
        }, {})

        // ------------------------
        // 4. Map specialty_id to specialty name
        const specialtyMap = specialties.reduce((acc, specialty) => {
          acc[specialty.id] = specialty.name
          return acc
        }, {})

        // ------------------------
        // 5. Agrupar citas por profesional para contar solo 1 por profesional
        const professionalsWithAppointments = new Set()
        appointments.forEach((appointment) => {
          professionalsWithAppointments.add(appointment.professional_id)
        })

        // ------------------------
        // 6. Contar especialidades según profesionales con citas
        const specialtyCounts = {}

        professionalsWithAppointments.forEach((professionalId) => {
          const specialtyIds = professionalToSpecialtyMap[professionalId] || []
          specialtyIds.forEach((specialtyId) => {
            // Considerar solo especialidades del 1 al 15 (no subespecialidades)
            if (specialtyId >= 1 && specialtyId <= 15) {
              const specialtyName = specialtyMap[specialtyId] || 'Unknown Specialty'
              specialtyCounts[specialtyName] = (specialtyCounts[specialtyName] || 0) + 1
            }
          })
        })

        const specialtyLabels = Object.keys(specialtyCounts)
        const specialtyValues = Object.values(specialtyCounts)

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
