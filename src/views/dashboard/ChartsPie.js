import React, { useEffect, useRef, useState, useMemo } from 'react'
import { getStyle } from '@coreui/utils'
import { CChart } from '@coreui/react-chartjs'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import './Styles.css/ChartsSection.css'
import { useTranslation } from 'react-i18next'
import useDashboard from '../../hooks/useDashboard'
import useRole from '../../hooks/useRole'

const generateColors = (count, theme) => {
  const colors = []

  for (let i = 0; i < count; i++) {
    const hue = Math.floor(Math.random() * 360)

    // Tema claro → colores pastel
    const saturation = theme === 'light' ? 70 : 50
    const lightness = theme === 'light' ? 75 : 40

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    colors.push(color)
  }

  return colors
}

const ChartsSection = () => {
  const doughnutRef1 = useRef(null)
  const doughnutRef2 = useRef(null)
  const role = useRole()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [cityData, setCityData] = useState([])
  const [specialtyData, setSpecialtyData] = useState([])
  const [newReturningData, setNewReturningData] = useState([])

  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const ds = document.documentElement.dataset.coreuiTheme
    if (ds) return ds
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  const { dashboard, loading: dashLoading } = useDashboard()

  useEffect(() => {
    if (!dashboard) return

    try {
      const data = dashboard
      const cityLabels = (data.patientsByCity || []).map((entry) => entry.city)
      const cityValues = (data.patientsByCity || []).map((entry) => entry.patient_count)
      const specialtyLabels = (data.specialtiesByRequest || []).map((entry) => entry.specialty)
      const specialtyValues = (data.specialtiesByRequest || []).map((entry) => entry.patient_count)

      setCityData({ labels: cityLabels, data: cityValues })
      setSpecialtyData({ labels: specialtyLabels, data: specialtyValues })
      const newVsLabels = (data.patientsNewVsReturning || []).map((entry) =>
        entry.type === 'new' ? t('New Patients') : t('Recurrent patients'),
      )
      const newVsValues = (data.patientsNewVsReturning || []).map((entry) => entry.count)

      setNewReturningData({ labels: newVsLabels, data: newVsValues })
    } catch (error) {
      console.error('Error processing dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [t, dashboard])

  // Helper to return a placeholder donut when there's no data
  const buildDoughnut = (dataObj, emptyLabel) => {
    const labels = dataObj?.labels || []
    const data = dataObj?.data || []
    const sum = Array.isArray(data) ? data.reduce((s, v) => s + (Number(v) || 0), 0) : 0
    const hasData = labels.length > 0 && sum > 0
    if (!hasData) {
      const placeholderColor = getStyle('--cui-bg-muted') || '#9a9aa0ff'
      return {
        labels: [emptyLabel || 'No data'],
        datasets: [
          {
            backgroundColor: [placeholderColor],
            data: [1],
          },
        ],
        __isPlaceholder: true,
      }
    }
    return {
      labels,
      datasets: [
        {
          backgroundColor: generateColors(labels.length, colorScheme),
          data,
        },
      ],
    }
  }

  const doughnutData1WithFallback = useMemo(
    () => buildDoughnut(cityData, t('No data available')),
    [cityData, colorScheme, t],
  )

  const doughnutData2WithFallback = useMemo(
    () => buildDoughnut(specialtyData, t('No data available')),
    [specialtyData, colorScheme, t],
  )
  const doughnutNewReturning = useMemo(
    () => buildDoughnut(newReturningData, t('No data available')),
    [newReturningData, colorScheme, t],
  )

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

  // Listen for theme changes so charts re-render and pick up new CSS variables
  useEffect(() => {
    if (typeof window === 'undefined') return

    const THEME_KEY = 'coreui-free-react-admin-template-theme'

    const updatePlaceholders = () => {
      const newPlaceholderColor =
        getComputedStyle(document.documentElement).getPropertyValue('--cui-bg-muted')?.trim() ||
        '#e9ecef'

      const updatePlaceholder = (ref) => {
        if (!ref?.current) return
        const inst = ref.current.chart || ref.current
        if (!inst) return

        const labels = inst.data?.labels || []
        const isPlaceholder =
          labels.length === 1 &&
          String(labels[0]).toLowerCase().includes(t('No data available').toLowerCase())

        if (isPlaceholder && inst.data.datasets?.[0]) {
          inst.data.datasets[0].backgroundColor = [newPlaceholderColor]
          inst.update()
        }
      }

      updatePlaceholder(doughnutRef1)
      updatePlaceholder(doughnutRef2)
    }

    const checkThemeChange = () => {
      const storedTheme = localStorage.getItem(THEME_KEY)
      if (!storedTheme) return

      if (storedTheme !== colorScheme) {
        setColorScheme(storedTheme)
        // 🔹 Esperar a que CoreUI aplique el tema (retardo necesario)
        setTimeout(updatePlaceholders, 150)
        setTimeout(updatePlaceholders, 400)
      }
    }

    // Revisar cada cierto tiempo si el valor en localStorage cambió
    const interval = setInterval(checkThemeChange, 250)

    return () => clearInterval(interval)
  }, [colorScheme, t])

  return (
    <CCardBody className="mb-4">
      <div className="row">
        <div className="col-sm-6">
          <CCard className=" mb-4 mb-sm-0">
            <CCardHeader style={{ fontWeight: 'bold' }} className="chart-card-header">
              {t('Patients by city')}
            </CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                {loading ? (
                  <div className="doughnut-loading pulse">
                    <div className="outer">
                      <div className="inner" />
                    </div>
                  </div>
                ) : doughnutData1WithFallback.__isPlaceholder ? (
                  <div className="doughnut-placeholder">
                    <div className="outer">
                      <div className="inner" />
                    </div>
                    <div
                      className="label"
                      style={{
                        fontSize: '1.1rem', // letra más grande
                      }}
                    >
                      {t('No data available')}
                    </div>
                  </div>
                ) : (
                  <CChart
                    key={`doughnut1-${colorScheme}-${(doughnutData1WithFallback.labels || []).join('-')}-${(doughnutData1WithFallback.datasets[0].data || []).join('-')}`}
                    type="doughnut"
                    data={doughnutData1WithFallback}
                    options={options}
                    ref={doughnutRef1}
                  />
                )}
              </div>
            </CCardBody>
          </CCard>
        </div>
        <div className="col-sm-6">
          <CCard className="mb-4 mb-sm-0">
            <CCardHeader style={{ fontWeight: 'bold' }} className="chart-card-header">
              {role === 3 ? t('New vs. recurring patients') : t('Most requested specialties')}
            </CCardHeader>
            <CCardBody>
              <div className="chart-wrapper">
                {loading ? (
                  <div className="doughnut-loading pulse">
                    <div className="outer">
                      <div className="inner" />
                    </div>
                  </div>
                ) : role === 3 ? (
                  // DONA NUEVOS vs RECURRENTES PARA PROFESIONAL
                  doughnutNewReturning.__isPlaceholder ? (
                    <div className="doughnut-placeholder">
                      <div className="outer">
                        <div className="inner" />
                      </div>
                      <div className="label" style={{ fontSize: '1.1rem' }}>
                        {t('No data available')}
                      </div>
                    </div>
                  ) : (
                    <CChart
                      key={`newReturning-${colorScheme}-${(doughnutNewReturning.labels || []).join('-')}-${(doughnutNewReturning.datasets[0].data || []).join('-')}`}
                      type="doughnut"
                      data={doughnutNewReturning}
                      options={options}
                      ref={doughnutRef2}
                    />
                  )
                ) : // DONA DE ESPECIALIDADES PARA ADMIN
                doughnutData2WithFallback.__isPlaceholder ? (
                  <div className="doughnut-placeholder">
                    <div className="outer">
                      <div className="inner" />
                    </div>
                    <div className="label" style={{ fontSize: '1.1rem' }}>
                      {t('No data available')}
                    </div>
                  </div>
                ) : (
                  <CChart
                    key={`doughnutRef2-${colorScheme}-${(doughnutData2WithFallback.labels || []).join('-')}-${(doughnutData2WithFallback.datasets[0].data || []).join('-')}`}
                    type="doughnut"
                    data={doughnutData2WithFallback}
                    options={options}
                    ref={doughnutRef2}
                  />
                )}
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>
    </CCardBody>
  )
}

export default ChartsSection
