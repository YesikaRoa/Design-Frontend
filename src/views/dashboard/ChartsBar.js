import React, { useRef, useEffect, useState } from 'react'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import './Styles.css/ChartBarExample.css'
import { useTranslation } from 'react-i18next'
import useApi from '../../hooks/useApi'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const { t } = useTranslation()
  const { request } = useApi()

  // Estados para cada gráfico
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingProfessionals, setLoadingProfessionals] = useState(true)
  const [hasAppointmentsData, setHasAppointmentsData] = useState(false)
  const [hasProfessionalsData, setHasProfessionalsData] = useState(false)

  const [chartData, setChartData] = useState({
    appointmentsByMonth: {
      pending: Array(12).fill(0),
      confirmed: Array(12).fill(0),
      completed: Array(12).fill(0),
      canceled: Array(12).fill(0),
    },
    professionals: [],
    professionalCounts: [],
  })

  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const ds = document.documentElement.dataset.coreuiTheme
    if (ds) return ds
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await request('get', '/dashboard', null, headers)

        if (!res.success || !res.data) throw new Error('Failed to fetch dashboard data')

        const data = res.data

        // Procesar citas
        const months = Array.from({ length: 12 }, (_, i) => i + 1)
        const getCount = (month, status) =>
          data.appointmentsByMonth.find(
            (entry) =>
              entry.month === `2025-${month.toString().padStart(2, '0')}` &&
              entry.status === status,
          )?.count || 0

        const pending = months.map((m) => getCount(m, 'pending'))
        const confirmed = months.map((m) => getCount(m, 'confirmed'))
        const completed = months.map((m) => getCount(m, 'completed'))
        const canceled = months.map((m) => getCount(m, 'canceled'))

        if (
          pending.some((v) => v > 0) ||
          confirmed.some((v) => v > 0) ||
          completed.some((v) => v > 0) ||
          canceled.some((v) => v > 0)
        ) {
          setHasAppointmentsData(true)
        }

        setChartData((prev) => ({
          ...prev,
          appointmentsByMonth: { pending, confirmed, completed, canceled },
        }))
        setLoadingAppointments(false)

        // Procesar profesionales
        const professionals = data.topProfessionals.map((e) => e.professional)
        const professionalCounts = data.topProfessionals.map((e) => e.patient_count)

        if (professionals.length > 0) setHasProfessionalsData(true)

        setChartData((prev) => ({
          ...prev,
          professionals,
          professionalCounts,
        }))
        setLoadingProfessionals(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoadingAppointments(false)
        setLoadingProfessionals(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Detectar cambio de tema
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMqChange = (e) => setColorScheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onMqChange)
    const observer = new MutationObserver(() => {
      const ds = document.documentElement.dataset.coreuiTheme
      if (ds) setColorScheme(ds)
      else setColorScheme(mq.matches ? 'dark' : 'light')
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => {
      mq.removeEventListener('change', onMqChange)
      observer.disconnect()
    }
  }, [])

  // Datos de los gráficos
  const data1 = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { label: 'Pending', backgroundColor: '#ff9800', data: chartData.appointmentsByMonth.pending },
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
        labels: {
          color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000',
        },
      },
    },
    scales: {
      x: { ticks: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000' } },
      y: {
        beginAtZero: true,
        ticks: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000' },
      },
    },
  }

  // --- Renderizado ---
  return (
    <CCardBody className="space-component">
      <div className="row">
        {/* === Chart 1 === */}
        <div className="col-sm-6">
          <CCard className="mb-4 mb-sm-0">
            <CCardHeader className="chart-card-header">{t('Appointment summary')}</CCardHeader>
            <CCardBody className="position-relative chart-card-body">
              {loadingAppointments && (
                <div className="chart-loading-overlay">
                  <CSpinner
                    color={colorScheme === 'dark' ? 'light' : 'dark'}
                    style={{ width: '2.5rem', height: '2.5rem' }}
                  />
                </div>
              )}

              {hasAppointmentsData ? (
                <div className="chart-wrapper">
                  <CChart
                    key={`chart1-${colorScheme}`}
                    type="bar"
                    data={data1}
                    options={options}
                    ref={chartRef}
                  />
                </div>
              ) : (
                !loadingAppointments && (
                  <div className="no-data-container">
                    <p className="no-data-text">{t('No data available')}</p>
                  </div>
                )
              )}
            </CCardBody>
          </CCard>
        </div>

        {/* === Chart 2 === */}
        <div className="col-sm-6">
          <CCard className="mb-4 mb-sm-0">
            <CCardHeader className="chart-card-header">
              {t('Professionals with most patients attended')}
            </CCardHeader>
            <CCardBody className="position-relative chart-card-body">
              {loadingAppointments && (
                <div className="chart-loading-overlay">
                  <CSpinner
                    color={colorScheme === 'dark' ? 'light' : 'dark'}
                    style={{ width: '2.5rem', height: '2.5rem' }}
                  />
                </div>
              )}

              {hasProfessionalsData ? (
                <div className="chart-wrapper">
                  <CChart
                    key={`chart2-${colorScheme}`}
                    type="bar"
                    data={data2}
                    options={options}
                    ref={chartRef}
                  />
                </div>
              ) : (
                !loadingAppointments && (
                  <div className="no-data-container">
                    <p className="no-data-text">{t('No data available')}</p>
                  </div>
                )
              )}
            </CCardBody>
          </CCard>
        </div>
      </div>
    </CCardBody>
  )
}

export default ChartBarExample
