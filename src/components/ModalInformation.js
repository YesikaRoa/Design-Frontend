import React from 'react'
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CButton } from '@coreui/react'

const ModalInformation = ({ visible, onClose, title, content }) => {
  return (
    <CModal
      alignment="center"
      scrollable
      visible={visible}
      onClose={onClose}
      aria-labelledby="modalInformation"
    >
      <CModalHeader>
        <CModalTitle id="modalInformation">{title || 'Información'}</CModalTitle>
      </CModalHeader>
      <CModalBody>{content || <p>No hay información disponible.</p>}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ModalInformation
