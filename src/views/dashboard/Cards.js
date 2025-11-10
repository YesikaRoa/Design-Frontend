import React, { useEffect, useState } from 'react'
import { CRow, CCol, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserFollow, cilListRich } from '@coreui/icons'
import { useTranslation } from 'react-i18next'
import useApi from '../../hooks/useApi'
import styles from './Styles.css/Cards.module.css'

const Cards = () => {
  const { t } = useTranslation()
  const [data, setData] = useState({
    attendedPatients: 0,
    newPatients: 0,
    topSpecialty: '',
  })
  const [loading, setLoading] = useState(true)

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
        const result = res.data

        setData({
          attendedPatients: result.attendedPatients || 0,
          newPatients: result.newPatients || 0,
          topSpecialty: result.topSpecialty?.specialty || 'No hay datos disponibles',
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onColorSchemeChange = () => {
      const ds = document.documentElement.dataset.coreuiTheme
      if (ds) setColorScheme(ds)
      else if (window.matchMedia)
        setColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }

    // Listen for the app's custom event or media query changes
    document.documentElement.addEventListener('ColorSchemeChange', onColorSchemeChange)
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    mq && mq.addEventListener && mq.addEventListener('change', onColorSchemeChange)

    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', onColorSchemeChange)
      mq && mq.removeEventListener && mq.removeEventListener('change', onColorSchemeChange)
    }
  }, [])

  const getCardStyle = (variant) => {
    // variants: 1,2,3 match the original cards
    if (colorScheme === 'dark') {
      switch (variant) {
        case 1:
          return {
            backgroundColor: '#163622',
            border: '2px solid #274e3b',
            color: 'rgba(255,255,255,0.95)',
          }
        case 2:
          return {
            backgroundColor: '#102a2d',
            border: '2px solid #1b4f55',
            color: 'rgba(255,255,255,0.95)',
          }
        case 3:
          return {
            backgroundColor: '#312915',
            border: '2px solid #544022',
            color: 'rgba(255,255,255,0.95)',
          }
        default:
          return {
            backgroundColor: '#2b2f33',
            border: '2px solid #3a3f44',
            color: 'rgba(255,255,255,0.95)',
          }
      }
    }

    // light (default): keep original pastel tones
    switch (variant) {
      case 1:
        return { backgroundColor: '#d4edda', border: '2px solid #c3e6cb', color: '#000' }
      case 2:
        return { backgroundColor: '#d1ecf1', border: '2px solid #bee5eb', color: '#000' }
      case 3:
        return { backgroundColor: '#fff3cd', border: '2px solid #ffeeba', color: '#000' }
      default:
        return { backgroundColor: '#f8f9fa', border: '2px solid #e9ecef', color: '#000' }
    }
  }

  return (
    <div className={`${styles['dashboard-cards-row']} space-component`}>
      <div className={styles['dashboard-card-col']}>
        <CCard
          className={colorScheme === 'dark' ? 'text-light' : 'text-dark'}
          style={{ ...getCardStyle(1) }}
        >
          <CCardBody>
            {loading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            ) : (
              <>
                <div className="fs-3 fw-bold">{data.attendedPatients}</div>
                <div className="text-uppercase">{t('Patients Attended')}</div>
                <small className={colorScheme === 'dark' ? 'text-white-50' : 'text-muted'}>
                  {t('In the last month with completed status')}
                </small>
              </>
            )}
          </CCardBody>
          <CIcon icon={cilUser} size="xl" className="m-3 text-success" />
        </CCard>
      </div>
      <div className={styles['dashboard-card-col']}>
        <CCard
          className={colorScheme === 'dark' ? 'text-light' : 'text-dark'}
          style={getCardStyle(2)}
        >
          <CCardBody>
            {loading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            ) : (
              <>
                <div className="fs-3 fw-bold">{data.newPatients}</div>
                <div className="text-uppercase">{t('New Patients')}</div>
                <small className={colorScheme === 'dark' ? 'text-white-50' : 'text-muted'}>
                  {t('This week with confirmed status')}
                </small>
              </>
            )}
          </CCardBody>
          <CIcon icon={cilUserFollow} size="xl" className="m-3 text-info" />
        </CCard>
      </div>
      <div className={styles['dashboard-card-col']}>
        <CCard
          className={colorScheme === 'dark' ? 'text-light' : 'text-dark'}
          style={getCardStyle(3)}
        >
          <CCardBody>
            {loading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            ) : (
              <>
                <div className="fs-3 fw-bold">{data.topSpecialty}</div>
                <div className="text-uppercase">{t('Most Requested Specialty')}</div>
                <small className={colorScheme === 'dark' ? 'text-white-50' : 'text-muted'}>
                  {t('Based on recent appointments')}
                </small>
              </>
            )}
          </CCardBody>
          <CIcon icon={cilListRich} size="xl" className="m-3 text-warning" />
        </CCard>
      </div>
    </div>
  )
}

export default Cards
