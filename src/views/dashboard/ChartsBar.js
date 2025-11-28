import React, { useRef, useEffect, useState } from 'react'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import './Styles.css/ChartBarExample.css'
import { useTranslation } from 'react-i18next'
import useApi from '../../hooks/useApi'
import useRole from '../../hooks/useRole'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const { t } = useTranslation()
  const { request } = useApi()
  const role = useRole() // 👈 TU HOOK AQUÍ

  // Estados
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
    appointmentsByWeekday: [], // 👈 NUEVO
  })

  // Tema
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

        // Procesar citas por mes
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

        // Actualizar chartData (citas por mes)
        setChartData((prev) => ({
          ...prev,
          appointmentsByMonth: { pending, confirmed, completed, canceled },
        }))

        setLoadingAppointments(false)

        // --- PROFESIONALES (solo admin)
        const professionals = data.topProfessionals.map((e) => e.professional)
        const professionalCounts = data.topProfessionals.map((e) => e.patient_count)

        if (professionals.length > 0 && role === 1) setHasProfessionalsData(true)

        // Guardar info
        setChartData((prev) => ({
          ...prev,
          professionals,
          professionalCounts,
          appointmentsByWeekday: data.appointmentsByWeekday || [], // 👈 citas por día de la semana
        }))

        setLoadingProfessionals(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoadingAppointments(false)
        setLoadingProfessionals(false)
      }
    }

    fetchDashboardData()
  }, [role])

  // Detect tema
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

  // Datos del primer gráfico (citas por mes)
  const data1 = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: t('Pending'),
        backgroundColor: '#ff990080',
        data: chartData.appointmentsByMonth.pending,
      },
      {
        label: t('Confirmed'),
        backgroundColor: '#2195f36e',
        data: chartData.appointmentsByMonth.confirmed,
      },
      {
        label: t('Completed'),
        backgroundColor: '#4caf4f98',
        data: chartData.appointmentsByMonth.completed,
      },
      {
        label: t('Canceled'),
        backgroundColor: '#f44336b7',
        data: chartData.appointmentsByMonth.canceled,
      },
    ],
  }

  // Gráfico 2 — ADMIN
  const dataProfessionals = {
    labels: chartData.professionals,
    datasets: [
      {
        label: 'Patients Attended',
        backgroundColor: '#1eb2f74b',
        data: chartData.professionalCounts,
      },
    ],
  }

  // Gráfico 2 — PROFESSIONAL (citas por día)
  const weekdayChartData = {
    // Los labels del eje X siguen siendo los días de la semana
    labels: chartData.appointmentsByWeekday.map((e) => e.day),
    datasets: [
      {
        label: t('Confirmed'),
        backgroundColor: '#2195f35d',

        data: chartData.appointmentsByWeekday.map((e) => e.confirmed),
      },
      {
        label: t('Completed'),
        backgroundColor: '#4caf4f6e',

        data: chartData.appointmentsByWeekday.map((e) => e.completed),
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
  const weekdayOptions = {
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
      x: {
        // CLAVE: Habilitar el apilamiento
        stacked: true,
        ticks: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000' },
      },
      y: {
        // CLAVE: Habilitar el apilamiento
        stacked: true,
        beginAtZero: true,
        ticks: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000' },
      },
    },
  }
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
                    options={options} // Usa opciones NO apiladas
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
              {role === 3
                ? t('Appointments by weekday')
                : t('Professionals with most patients attended')}
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
              {role === 3 ? (
                // === PROFESSIONAL (Barras Apiladas) ===
                <div className="chart-wrapper">
                  <CChart
                    key={`chart-weekday-${colorScheme}`}
                    type="bar"
                    data={weekdayChartData}
                    // APLICAR LAS OPCIONES APILADAS AQUÍ
                    options={weekdayOptions}
                  />
                </div>
              ) : // === ADMIN (Barras NO Apiladas) ===
              hasProfessionalsData ? (
                <div className="chart-wrapper">
                  <CChart
                    key={`chart2-${colorScheme}`}
                    type="bar"
                    data={dataProfessionals}
                    // APLICAR LAS OPCIONES GENERALES AQUÍ
                    options={options}
                  />
                </div>
              ) : (
                !loadingProfessionals && (
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
