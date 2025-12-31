import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import '../views/users/styles/modalAddUser.css'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'

function getStepsArray(steps, formData) {
  return typeof steps === 'function' ? steps(formData) : steps
}

const ModalAdd = forwardRef(
  ({ title = 'Formulario', steps = [], onFinish, purpose, customFields = {} }, ref) => {
    const [visible, setVisible] = useState(false)
    const [stepIndex, setStepIndex] = useState(0)
    const [formData, setFormData] = useState({})
    const [errors, setErrors] = useState({}) // Estado para errores
    const [serverErrorMessage, setServerErrorMessage] = useState('')
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [colorScheme, setColorScheme] = useState(() => {
      if (typeof window === 'undefined') return 'light'
      const ds = document.documentElement.dataset.coreuiTheme
      if (ds) return ds
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    })

    useEffect(() => {
      if (typeof window === 'undefined') return
      const onColorSchemeChange = () => {
        const ds = document.documentElement.dataset.coreuiTheme
        if (ds) setColorScheme(ds)
        else if (window.matchMedia)
          setColorScheme(
            window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
          )
      }
      document.documentElement.addEventListener('ColorSchemeChange', onColorSchemeChange)
      const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
      mq && mq.addEventListener && mq.addEventListener('change', onColorSchemeChange)
      return () => {
        document.documentElement.removeEventListener('ColorSchemeChange', onColorSchemeChange)
        mq && mq.removeEventListener && mq.removeEventListener('change', onColorSchemeChange)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      open: (initialData = {}) => {
        setFormData(initialData)
        setStepIndex(0)
        setErrors({}) // Reinicia los errores al abrir la modal
        setServerErrorMessage('')
        setVisible(true)
      },
      close: () => setVisible(false), // <-- Añadido para exponer el método close
      // Permite al padre establecer errores provenientes del servidor
      setErrorsFromServer: (serverErrors = {}) => {
        setErrors(serverErrors)
        setServerErrorMessage('')
      },
    }))

    const validateField = (field, value) => {
      if (field.required) {
        if (typeof value === 'string') {
          if (!value.trim()) {
            return `${field.label} is required`
          }
        } else {
          if (value === null || value === undefined || value === '') {
            return `${field.label} is required`
          }
        }
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
      if (field.name === 'address' && (!value || !value.trim())) {
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

    const handleAdd = async () => {
      const newErrors = {}
      getStepsArray(steps, formData).forEach((step) => {
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
      setIsSubmitting(true) // Bloquea el botón
      // Llamamos al handler del padre y esperamos su resultado.
      // Se espera que onFinish devuelva un objeto { success: boolean, errors?: { field: message } }
      if (onFinish) {
        try {
          const result = await onFinish(purpose, formData)
          if (result && result.success) {
            setServerErrorMessage('')
            setVisible(false)
          } else if (result && result.errors) {
            // Si el servidor devolvió errores por campo, los mostramos
            setErrors(result.errors)
            setServerErrorMessage('')
          }
        } catch (err) {
          // Si onFinish lanza, mantenemos la modal abierta y mostramos un mensaje claro
          console.error('Error en onFinish:', err)
          const message = err?.message || 'An unexpected error occurred. Please try again.'
          setServerErrorMessage(message)
        } finally {
          setIsSubmitting(false)
        }
      }
    }

    const currentStep = getStepsArray(steps, formData)[stepIndex] || {}

    const renderInputs = () => {
      if (!currentStep.fields) return null
      return currentStep.fields.map((field) => {
        // Si hay un campo personalizado, úsalo
        if (customFields && customFields[field.name]) {
          return (
            <div key={field.name} style={{ marginBottom: '1rem' }}>
              {customFields[field.name]({
                value: formData[field.name] || '',
                onChange: (option) => {
                  // Si option es un string (como para fecha), úsalo directamente
                  const value = typeof option === 'string' ? option : option?.value || ''
                  setFormData((prev) => ({ ...prev, [field.name]: value }))
                  // Validación en tiempo real
                  const error = validateField(field, value)
                  setErrors((prev) => ({ ...prev, [field.name]: error }))
                  if (field.onChange) field.onChange({ target: { value } })
                },
                setFormData,
                error: errors[field.name],
                helperText: errors[field.name],
                placeholder: field.placeholder,
              })}
            </div>
          )
        }
        // Renderizado estándar
        return (
          <div key={field.name} style={{ marginBottom: '1rem' }}>
            {field.type === 'select' ? (
              <TextField
                select
                label={field.label}
                variant="standard"
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => {
                  handleChange(e)
                  if (field.onChange) field.onChange(e)
                }}
                fullWidth
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                InputLabelProps={{
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined },
                }}
                InputProps={{ style: { color: colorScheme === 'dark' ? '#fff' : undefined } }}
                FormHelperTextProps={{
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined },
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        backgroundColor: colorScheme === 'dark' ? '#2b2f33' : undefined,
                        color: colorScheme === 'dark' ? '#fff' : undefined,
                      },
                    },
                  },
                }}
              >
                {field.options.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    style={{ color: colorScheme === 'dark' ? '#fff' : undefined }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : field.type === 'file' ? (
              <TextField
                label={field.label}
                variant="standard"
                type="file"
                name={field.name}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    [field.name]: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                  }))
                  // Validación en tiempo real
                  const error = validateField(
                    field,
                    e.target.files && e.target.files[0] ? e.target.files[0] : '',
                  )
                  setErrors((prev) => ({ ...prev, [field.name]: error }))
                  if (field.onChange) field.onChange(e)
                }}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined },
                }}
                inputProps={{
                  placeholder: field.placeholder || '',
                  accept: field.accept || undefined,
                  style: { color: colorScheme === 'dark' ? '#fff' : undefined },
                }}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                FormHelperTextProps={{
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined },
                }}
              />
            ) : (
              <TextField
                label={field.label}
                variant="standard"
                type={field.type || 'text'}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => {
                  handleChange(e)
                  if (field.onChange) field.onChange(e)
                }}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink:
                    !!formData[field.name] ||
                    field.type === 'datetime-local' ||
                    field.type === 'date',
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.9)' : undefined },
                }}
                inputProps={{
                  placeholder: field.placeholder || '',
                  style: { color: colorScheme === 'dark' ? '#fff' : undefined },
                }}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                FormHelperTextProps={{
                  style: { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : undefined },
                }}
              />
            )}
          </div>
        )
      })
    }

    useEffect(() => {
      const root = document.getElementById('root')
      if (!root) return

      // Función limpiadora reutilizable
      const clearAria = () => {
        root.removeAttribute('aria-hidden')
        root.removeAttribute('inert')
      }

      if (visible) {
        clearAria() // Limpiar al abrir

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
              clearAria()
            }
          })
        })

        observer.observe(root, { attributes: true, attributeFilter: ['aria-hidden', 'inert'] })

        return () => {
          observer.disconnect()
          // 👈 IMPORTANTE: Limpiar también al desmontar/cerrar
          // para que el foco regrese a un ambiente limpio
          setTimeout(clearAria, 0)
        }
      } else {
        // Si la modal deja de ser visible, ejecutamos una limpieza rápida
        clearAria()
      }
    }, [visible])
    return (
      <CModal
        alignment="center"
        visible={visible}
        onClose={() => setVisible(false)}
        focus={false}
        portal={false}
        backdrop="static"
        aria-hidden="false"
      >
        <CModalHeader className="custom-modal-header">
          <CModalTitle className="custom-modal-title">{title}</CModalTitle>
        </CModalHeader>

        <div className="steps-indicator">
          {getStepsArray(steps, formData).map((_, index) => (
            <div className="step-item" key={index}>
              <div className={`step-circle ${index === stepIndex ? 'active' : ''}`}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        <CModalBody>
          {serverErrorMessage && (
            <CAlert color="danger" className="mb-3 text-center">
              {serverErrorMessage}
            </CAlert>
          )}
          {renderInputs()}
        </CModalBody>

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
                {t('Cancel')}
              </CButton>
              <CButton color="primary" onClick={nextStep} className="full-width">
                {t('Continue')}
              </CButton>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="button-group">
              <CButton
                color="secondary"
                variant="outline"
                onClick={prevStep}
                className="full-width"
              >
                {t('Back')}
              </CButton>
              <CButton color="primary" onClick={nextStep} className="full-width">
                {t('Continue')}
              </CButton>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="button-group">
              <CButton
                color="secondary"
                variant="outline"
                onClick={prevStep}
                className="full-width"
              >
                {t('Back')}
              </CButton>
              <CButton
                color="success"
                className="full-width"
                onClick={handleAdd}
                disabled={isSubmitting}
              >
                <CIcon icon={cilPlus} style={{ marginRight: '8px' }} />
                {t('Add')}
              </CButton>
            </div>
          )}
        </CModalFooter>
      </CModal>
    )
  },
)

export default ModalAdd
