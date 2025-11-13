import React from 'react'
import { CFooter } from '@coreui/react'
import { useTranslation } from 'react-i18next'

const AppFooter = () => {
  const { t } = useTranslation()

  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1 text-muted">
          &copy; {new Date().getFullYear()} <strong>Medipanel</strong>. {t('All rights reserved.')}
        </span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
