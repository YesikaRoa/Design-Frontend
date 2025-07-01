import React from 'react'
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react'
import AsyncSelect from 'react-select/async'

const ModalDownloadPDF = ({
  visible,
  onClose,
  selectedPatient,
  setSelectedPatient,
  loadPatients,
  onDownload,
}) => {
  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader closeButton>Descargar Historial Médico en PDF</CModalHeader>
      <CModalBody>
        <label>Seleccione un paciente que este registrado en citas:</label>
        <AsyncSelect
          cacheOptions
          loadOptions={loadPatients}
          defaultOptions={true}
          value={selectedPatient}
          onChange={setSelectedPatient}
          placeholder="Buscar paciente..."
          isClearable
          styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancelar
        </CButton>
        <CButton color="primary" onClick={onDownload} disabled={!selectedPatient}>
          Descargar
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ModalDownloadPDF
