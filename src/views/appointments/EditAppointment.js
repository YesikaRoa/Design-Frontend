import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './styles/EditAppointment.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilSave, cilTrash } from '@coreui/icons'
import Notifications from '../../components/Notifications'

const EditAppointment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [editedAppointment, setEditedAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldsDisabled, setFieldsDisabled] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (location.state?.appointment) {
      const newAppointment = location.state.appointment
      setAppointment(newAppointment)
      setEditedAppointment({ ...newAppointment })
      localStorage.setItem('selectedAppointment', JSON.stringify(newAppointment))
    } else {
      const storedAppointment = localStorage.getItem('selectedAppointment')
      if (storedAppointment) {
        const parsed = JSON.parse(storedAppointment)
        setAppointment(parsed)
        setEditedAppointment({ ...parsed })
      }
    }
    setLoading(false)
  }, [location])

  const handleFieldsDisabled = () => {
    setFieldsDisabled(!fieldsDisabled)
  }

  const saveChanges = async () => {
    if (!appointment || !appointment.id) {
      console.error('The appointment ID is not valid.')
      Notifications.showAlert(
        setAlert,
        'Cannot save because the appointment ID is not valid.',
        'danger',
      )
      return
    }
    try {
      const response = await fetch(`http://localhost:8000/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedAppointment),
      })
      if (response.ok) {
        const updatedAppointment = await response.json()
        setAppointment(updatedAppointment)
        Notifications.showAlert(setAlert, 'Changes saved successfully!', 'success')
      } else {
        throw new Error('Error saving changes.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'There was an error saving the changes.', 'danger')
    }
    handleFieldsDisabled()
  }

  const deleteAppointment = async () => {
    try {
      const response = await fetch(`http://localhost:8000/appointments/${appointment.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        Notifications.showAlert(setAlert, 'Appointment deleted successfully.', 'success', 5000)
        setTimeout(() => {
          navigate('/appointments') // Redirige después de 5 segundos
        }, 5000) // Asegúrate de que coincida con la duración de la notificación
      } else {
        throw new Error('Error deleting the appointment.')
      }
    } catch (error) {
      console.error(error)
      Notifications.showAlert(setAlert, 'There was an error deleting the appointment.', 'danger')
    }
    setDeleteModalVisible(false)
  }

  if (loading) return <p>Loading appointment...</p>
  if (!appointment) return <p>Appointment not found.</p>

  return (
    <CRow>
      <CCol md={12}>
        <h3 className="mb-4">Edit Appointment</h3>
        {alert && (
          <CAlert color={alert.type} className="text-center alert-fixed">
            {alert.message}
          </CAlert>
        )}
      </CCol>
      <CCol md={4}>
        <CCard>
          <CCardBody>
            <CCardTitle className="text-primary">Patient: {appointment.patient}</CCardTitle>
            <CCardText>
              <strong>Professional:</strong> {appointment.professional} <br />
              <strong>Status:</strong> {appointment.status} <br />
              <strong>Date:</strong> {new Date(appointment.scheduled_at).toLocaleString()} <br />
              <strong>City:</strong> {appointment.city} <br />
              <strong>Reason:</strong> {appointment.reason_for_visit}
            </CCardText>
          </CCardBody>
        </CCard>
        <CCard className="mt-3">
          <CCardBody>
            <CCardTitle className="text-primary">Change Status</CCardTitle>
            <div className="mb-3">
              <CFormSelect
                id="quickStatusChange"
                value={appointment.status}
                onChange={async (e) => {
                  const updatedStatus = e.target.value
                  try {
                    const updatedAppointment = { ...appointment, status: updatedStatus }
                    const response = await fetch(
                      `http://localhost:8000/appointments/${appointment.id}`,
                      {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedAppointment),
                      },
                    )
                    if (response.ok) {
                      const result = await response.json()
                      setAppointment(result)
                      Notifications.showAlert(
                        setAlert,
                        `Status changed to ${updatedStatus}.`,
                        'success',
                      )
                    } else {
                      throw new Error('Error changing the appointment status.')
                    }
                  } catch (error) {
                    console.error('Error changing status:', error)
                    Notifications.showAlert(
                      setAlert,
                      'There was an error changing the appointment status.',
                      'danger',
                    )
                  }
                }}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="canceled by professional">Canceled by professional</option>
                <option value="canceled by patient">Canceled by patient</option>
                <option value="completed">Completed</option>
              </CFormSelect>
            </div>
            <CButton color="danger" onClick={() => setDeleteModalVisible(true)} className="mt-2">
              <CIcon icon={cilTrash} className="me-2" />
              Delete Appointment
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={8}>
        <CCard className=" mb-4">
          <CCardBody>
            <CCardTitle>Edit Information</CCardTitle>
            <CFormInput
              type="text"
              id="patient"
              floatingLabel="Patient"
              value={editedAppointment.patient}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, patient: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="text"
              id="professional"
              floatingLabel="Professional"
              value={editedAppointment.professional}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, professional: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormInput
              type="datetime-local"
              id="scheduled_at"
              floatingLabel="Date"
              value={editedAppointment.scheduled_at}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, scheduled_at: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormSelect
              id="status"
              floatingLabel="Status"
              value={editedAppointment.status}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, status: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="canceled by professional">Canceled by professional</option>
              <option value="canceled by patient">Canceled by patient</option>
              <option value="completed">Completed</option>
            </CFormSelect>
            <CFormSelect
              id="city"
              floatingLabel="City"
              value={editedAppointment.city}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, city: e.target.value })}
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="San Cristóbal">San Cristóbal</option>
              <option value="Táriba">Táriba</option>
              <option value="La Fría">La Fría</option>
              <option value="San Antonio del Táchira">San Antonio del Táchira</option>
              <option value="Rubio">Rubio</option>
              <option value="La Grita">La Grita</option>
            </CFormSelect>
            <CFormSelect
              id="category"
              floatingLabel="Category"
              value={editedAppointment.category}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, category: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="Consulta médica">Consulta médica</option>
              <option value="Rehabilitación">Rehabilitación</option>
              <option value="Emergencias">Emergencias</option>
              <option value="Prevención">Prevención</option>
              <option value="Atención de enfermería">Atención de enfermería</option>
              <option value="Especialidad médica">Especialidad médica</option>
            </CFormSelect>
            <CFormSelect
              id="specialty"
              floatingLabel="Specialty"
              value={editedAppointment.specialty}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, specialty: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            >
              <option value="Pediatría">Pediatría</option>
              <option value="Fisioterapia">Fisioterapia</option>
              <option value="Medicina Intensiva">Medicina Intensiva</option>
              <option value="Medicina General">Medicina General</option>
              <option value="Terapia Ocupacional">Terapia Ocupacional</option>
              <option value="Enfermería">Enfermería</option>
              <option value="Dermatología">Dermatología</option>
            </CFormSelect>
            <CFormInput
              type="text"
              id="pathology"
              floatingLabel="Pathology"
              value={editedAppointment.pathology}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, pathology: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormTextarea
              id="notes"
              floatingLabel="Notes"
              value={editedAppointment.notes}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, notes: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CFormTextarea
              id="reason_for_visit"
              floatingLabel="Reason for Visit"
              value={editedAppointment.reason_for_visit}
              onChange={(e) =>
                setEditedAppointment({ ...editedAppointment, reason_for_visit: e.target.value })
              }
              className="mb-3"
              disabled={fieldsDisabled}
            />
            <CButton color="primary" onClick={fieldsDisabled ? handleFieldsDisabled : saveChanges}>
              <CIcon icon={fieldsDisabled ? cilPencil : cilSave} className="me-2" />
              {fieldsDisabled ? 'Edit' : 'Save'}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <CModal
        alignment="center"
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Delete Appointment</CModalTitle>
        </CModalHeader>
        <CModalBody>Are you sure you want to delete this appointment?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={deleteAppointment}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default EditAppointment
