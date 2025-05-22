import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import '../views/users/styles/modalAddUser.css'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

const ModalAdd = forwardRef(({ title = 'Formulario', steps = [], onFinish, purpose }, ref) => {
  const [visible, setVisible] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({}) // Estado para errores

  useImperativeHandle(ref, () => ({
    open: (initialData = {}) => {
      setFormData(initialData)
      setStepIndex(0)
      setErrors({}) // Reinicia los errores al abrir la modal
      setVisible(true)
    },
  }))

  const validateField = (field, value) => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`
    }
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Invalid email format'
      }
    }
    if (field.type === 'date') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(value)) {
        return 'Date must be in YYYY-MM-DD format'
      }
    }
    if (field.name === 'phone') {
      const phoneRegex = /^\d{11}$/
      if (!phoneRegex.test(value)) {
        return 'Phone must contain exactly 11 digits'
      }
    }
    if (field.name === 'address' && !value.trim()) {
      return 'Address is required'
    }
    if (field.validate) {
      return field.validate(value)
    }
    return ''
  }
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validar el campo en tiempo real
    const field = currentStep.fields.find((f) => f.name === name)
    const error = validateField(field, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const nextStep = () => {
    const newErrors = {}
    currentStep.fields.forEach((field) => {
      const error = validateField(field, formData[field.name] || '')
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
    } else {
      setStepIndex(stepIndex + 1)
    }
  }

  const prevStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  const handleAdd = () => {
    const newErrors = {}
    steps.forEach((step) => {
      step.fields.forEach((field) => {
        const error = validateField(field, formData[field.name] || '')
        if (error) {
          newErrors[field.name] = error
        }
      })
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onFinish && onFinish(purpose, formData)
    setVisible(false)
  }

  const currentStep = steps[stepIndex] || {}

  const renderInputs = () => {
    if (!currentStep.fields) {
      return null // Evitar error si currentStep.fields no está definido
    }
    return currentStep.fields.map((field) => (
      <div key={field.name} style={{ marginBottom: '1rem' }}>
        {field.type === 'select' ? (
          <TextField
            select
            label={field.label}
            variant="standard"
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => {
              handleChange(e) // Llama al manejador genérico
              if (field.onChange) {
                field.onChange(e) // Llama al manejador personalizado si existe
              }
            }}
            fullWidth
            error={!!errors[field.name]}
            helperText={errors[field.name]}
          >
            {field.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            label={field.label}
            variant="standard"
            type={field.type || 'text'}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => {
              handleChange(e) // Llama al manejador genérico
              if (field.onChange) {
                field.onChange(e) // Llama al manejador personalizado si existe
              }
            }}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink:
                !!formData[field.name] || field.type === 'datetime-local' || field.type === 'date', // Asegura que el label se mantenga arriba
            }}
            inputProps={{
              placeholder: field.placeholder || '',
            }}
            error={!!errors[field.name]}
            helperText={errors[field.name]}
          />
        )}
      </div>
    ))
  }

  return (
    <CModal alignment="center" visible={visible} onClose={() => setVisible(false)}>
      <CModalHeader className="custom-modal-header">
        <CModalTitle className="custom-modal-title">{title}</CModalTitle>
      </CModalHeader>

      <div className="steps-indicator">
        {steps.map((_, index) => (
          <div className="step-item" key={index}>
            <div className={`step-circle ${index === stepIndex ? 'active' : ''}`}>{index + 1}</div>
          </div>
        ))}
      </div>

      <CModalBody>{renderInputs()}</CModalBody>

      <CModalFooter
        className="custom-footer"
        style={{ borderTop: 'none', marginTop: '-5px', marginBottom: '10px' }}
      >
        {stepIndex === 0 && (
          <div className="button-group">
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setVisible(false)}
              className="full-width"
            >
              Cancel
            </CButton>
            <CButton color="primary" onClick={nextStep} className="full-width">
              Continue
            </CButton>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="button-group">
            <CButton color="secondary" variant="outline" onClick={prevStep} className="full-width">
              Back
            </CButton>
            <CButton color="primary" onClick={nextStep} className="full-width">
              Continue
            </CButton>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="button-group">
            <CButton color="secondary" variant="outline" onClick={prevStep} className="full-width">
              Back
            </CButton>
            <CButton color="success" className="full-width" onClick={handleAdd}>
              <CIcon icon={cilPlus} style={{ marginRight: '8px' }} />
              Add
            </CButton>
          </div>
        )}
      </CModalFooter>
    </CModal>
  )
})

export default ModalAdd
