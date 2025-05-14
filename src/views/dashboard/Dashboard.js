import React from 'react'
import { CRow, CCol } from '@coreui/react'
import ChartsBar from './ChartsBar'
import ChartsPie from './ChartsPie'
import RecentPatients from './RecentPatients'
import Cards from './Cards'

const Dashboard = () => {
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
