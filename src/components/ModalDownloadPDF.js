import React, { useState, useEffect } from 'react'
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react'
import AsyncSelect from 'react-select/async'
import { useTranslation } from 'react-i18next'

const ModalDownloadPDF = ({
  visible,
  onClose,
  selectedPatient,
  setSelectedPatient,
  loadPatients,
  onDownload,
}) => {
  // Detectar modo claro/oscuro del template CoreUI
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const ds = document.documentElement.dataset.coreuiTheme
    if (ds) return ds
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const { t } = useTranslation()

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.dataset.coreuiTheme
      if (newTheme && newTheme !== colorScheme) {
        setColorScheme(newTheme)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-coreui-theme'],
    })

    return () => observer.disconnect()
  }, [colorScheme])

  // Limpiar el paciente seleccionado cuando la modal se cierra
  useEffect(() => {
    if (!visible) {
      setSelectedPatient(null)
    }
  }, [visible, setSelectedPatient])

  // Estilos del selector para modo claro / oscuro
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      background: colorScheme === 'dark' ? '#23262b' : provided.background,
      color: colorScheme === 'dark' ? '#fff' : provided.color,
      borderColor: colorScheme === 'dark' ? '#4b4f55' : provided.borderColor,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: colorScheme === 'dark' ? '#fff' : provided.color,
    }),
    input: (provided) => ({
      ...provided,
      color: colorScheme === 'dark' ? '#fff' : provided.color,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : provided.color,
    }),
    menu: (provided) => ({
      ...provided,
      background: colorScheme === 'dark' ? '#2b2f33' : provided.background,
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      background: colorScheme === 'dark' ? '#2b2f33' : provided.background,
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isFocused
        ? colorScheme === 'dark'
          ? '#3a3f44'
          : '#e9ecef'
        : colorScheme === 'dark'
          ? '#2b2f33'
          : provided.background,
      color: colorScheme === 'dark' ? '#fff' : provided.color,
    }),
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader closeButton>{t('Download Medical History in PDF format')}</CModalHeader>
      <CModalBody>
        <label style={{ fontWeight: 'bold' }}>
          {t('Select a patient who is registered for appointments:')}
        </label>

        <AsyncSelect
          cacheOptions
          loadOptions={loadPatients}
          defaultOptions
          value={selectedPatient}
          onChange={setSelectedPatient}
          placeholder={t('Search patient...')}
          isClearable
          styles={selectStyles}
        />
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          {t('Cancel')}
        </CButton>

        <CButton color="primary" onClick={onDownload} disabled={!selectedPatient}>
          {t('Download')}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ModalDownloadPDF
