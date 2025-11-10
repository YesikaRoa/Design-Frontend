import React, { useRef, useEffect, useState } from 'react'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartBarExample.css'
import { useTranslation } from 'react-i18next'
import useApi from '../../hooks/useApi'

const ChartBarExample = () => {
  const chartRef = useRef(null)
  const { t } = useTranslation()
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

  const { request } = useApi()
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Listen to system preference changes
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    const onMqChange = (e) => setColorScheme(e.matches ? 'dark' : 'light')
    mq && mq.addEventListener && mq.addEventListener('change', onMqChange)

    // Observe changes to data-coreui-theme on the root element (CoreUI toggles this attribute)
    const root = document.documentElement
    const getDs = () => root.dataset.coreuiTheme
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-coreui-theme') {
          const ds = getDs()
          if (ds) setColorScheme(ds)
          else if (mq) setColorScheme(mq.matches ? 'dark' : 'light')
        }
      }
    })
    observer.observe(root, { attributes: true })

    // In case the attribute already exists, ensure state is correct
    const initialDs = getDs()
    if (initialDs) setColorScheme(initialDs)

    return () => {
      mq && mq.removeEventListener && mq.removeEventListener('change', onMqChange)
      observer.disconnect()
    }
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
        labels: {
          // chart legend label color
          color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#000',
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
                <CChart
                  key={`chart1-${colorScheme}`}
                  type="bar"
                  data={data1}
                  options={options}
                  ref={chartRef}
                />
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
                <CChart
                  key={`chart2-${colorScheme}`}
                  type="bar"
                  data={data2}
                  options={options}
                  ref={chartRef}
                />
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>
    </CCardBody>
  )
}

export default ChartBarExample
