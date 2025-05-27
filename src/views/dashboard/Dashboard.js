import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CRow, CCol } from '@coreui/react'
import ChartsBar from './ChartsBar'
import ChartsPie from './ChartsPie'
import RecentPatients from './RecentPatients'
import Cards from './Cards'

const Dashboard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar el token de autenticación en localStorage
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      navigate('/login') // Redirigir al login si no hay token
    }
  }, [navigate]) // Dependencia para que el efecto se ejecute correctamente

  return (
    <>
      <CRow>
        <CCol sm="12">
          <Cards />
          <ChartsBar />
          <ChartsPie />
          <RecentPatients />
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
