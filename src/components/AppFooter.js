import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1 text-muted">
          &copy; {new Date().getFullYear()} <strong>Medipanel</strong>. Todos los derechos
          reservados.
        </span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
