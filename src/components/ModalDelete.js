import React from 'react'
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CButton } from '@coreui/react'

const ModalDelete = ({ visible, onClose, onConfirm, title, message }) => {
  return (
    <CModal visible={visible} onClose={onClose} alignment="center" aria-labelledby="modalDelete">
      <CModalHeader>
        <CModalTitle id="modalDelete">{title || 'Confirmar eliminación'}</CModalTitle>
      </CModalHeader>
      <CModalBody>{message || '¿Estás seguro de que deseas eliminar este elemento?'}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={onConfirm}>
          Delete
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ModalDelete
