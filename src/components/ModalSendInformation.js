import React from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import { useTranslation } from 'react-i18next'

const ModalSendInformation = ({ visible, setVisible, title, message, onSend, children }) => {
  const { t } = useTranslation()

  return (
    <CModal
      visible={visible}
      onClose={() => setVisible(false)}
      aria-labelledby="SendInformationModalLabel"
    >
      <CModalHeader>
        <CModalTitle id="SendInformationModalLabel">{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>{message}</p>
        {children} {/* Renderiza el contenido adicional pasado como hijos */}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="primary"
          onClick={() => {
            onSend()
            setVisible(false)
          }}
        >
          {t('Send')}
        </CButton>
        <CButton color="secondary" onClick={() => setVisible(false)}>
          {t('Close')}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ModalSendInformation
