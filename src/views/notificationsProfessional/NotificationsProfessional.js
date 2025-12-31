import React, { useState, useEffect, useRef } from 'react'
import { CButton, CPopover, CToast, CToastBody, CToastHeader } from '@coreui/react'
import { cilBell, cilCheckCircle, cilXCircle, cilUser, cilInfo } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import useApi from '../../hooks/useApi'

export const NotificationPopover = () => {
  const [visible, setVisible] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { request } = useApi()
  const buttonRef = useRef(null)

  // Manejo de tema
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return (
      document.documentElement.dataset.coreuiTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    )
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColorScheme(document.documentElement.dataset.coreuiTheme || 'light')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-coreui-theme'],
    })
    return () => observer.disconnect()
  }, [])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!visible) return

      const popoverEl = document.querySelector('.popover')
      const buttonEl = buttonRef.current

      // Si el clic no es en el botón y no es en el popover, cerramos
      if (
        buttonEl &&
        !buttonEl.contains(event.target) &&
        popoverEl &&
        !popoverEl.contains(event.target)
      ) {
        setVisible(false)
      }
    }

    // Cambiamos 'click' por 'mousedown' para mayor precisión
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible])

  // Carga de notificaciones
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return // Seguridad adicional
      const res = await request('GET', '/notifications', null, {
        Authorization: `Bearer ${token}`,
      })
      setNotifications(res?.data ?? [])
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000)

    return () => clearInterval(interval)
  }, []) // Arreglo vacío: solo se ejecuta una vez al montar

  const removeNotification = async (id) => {
    const token = localStorage.getItem('authToken')
    const res = await request('DELETE', `/notifications/${id}`, null, {
      Authorization: `Bearer ${token}`,
    })
    if (res.success) setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const toggleReadStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('authToken')
    const newStatus = currentStatus === 'read' ? 'unread' : 'read'
    await request(
      'PUT',
      `/notifications/${id}/status`,
      { status: newStatus },
      { Authorization: `Bearer ${token}` },
    )
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n)))
  }

  const deleteAllNotifications = async () => {
    const token = localStorage.getItem('authToken')

    const res = await request('DELETE', '/notifications/all', null, {
      Authorization: `Bearer ${token}`,
    })
    if (res?.success) setNotifications([])
  }

  // --- Lógica de Estilos Mejorados ---
  const getStatusData = (content) => {
    const text = content.toLowerCase()

    // 1. Administrador (Púrpura para denotar autoridad/sistema)
    if (text.includes('admin')) {
      return {
        color: '#6f42c1', // Púrpura elegante
        darkBg: '#2a1a3d', // Fondo oscuro violáceo
        icon: cilUser,
        label: 'ADMIN',
      }
    }

    // 2. Pendiente (Mantiene tu Dorado)
    if (text.includes('pending')) {
      return {
        color: '#f9b115',
        darkBg: '#3b2f11',
        icon: cilInfo,
        label: 'PENDIENTE',
      }
    }

    // 3. Cancelado (Rojo)
    if (text.includes('cancel')) {
      return {
        color: '#e55353',
        darkBg: '#3d1a1a',
        icon: cilXCircle,
        label: 'CANCELADA',
      }
    }

    // 4. Completado (Verde)
    if (text.includes('complet')) {
      return {
        color: '#2eb85c',
        darkBg: '#1a3d24',
        icon: cilCheckCircle,
        label: 'COMPLETADA',
      }
    }

    // 5. Por defecto / Informativo (Azul)
    return {
      color: '#3399ff',
      darkBg: '#1a2a3d',
      icon: cilInfo,
      label: 'INFO',
    }
  }

  return (
    <div className="position-relative">
      <CPopover
        trigger="focus"
        placement="bottom"
        visible={visible}
        onHide={() => setVisible(false)}
        // 💡 ESTO ES CLAVE: Eliminamos el estilo por defecto del popover de CoreUI
        offset={[0, 8]}
        content={
          <div
            className="custom-scrollbar"
            style={{
              width: '280px',
              maxHeight: '350px',
              overflowY: 'auto',
              overflowX: 'hidden', // Evita scroll horizontal innecesario
              backgroundColor: colorScheme === 'dark' ? '#1a1d21' : '#ffffff',
              borderRadius: '12px',
              padding: '12px',
              // Añadimos un borde sutil para que en modo claro no se pierda contra el fondo
              border: `1px solid ${colorScheme === 'dark' ? '#333' : '#e0e0e0'}`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <style>{`
              /* Estilizamos el contenedor original de CoreUI para que no tenga márgenes */
              .popover-body { padding: 0 !important; }
              .popover { 
                border: none !important; 
                background-color: transparent !important; 
                box-shadow: none !important;
              }
              
              .custom-scrollbar::-webkit-scrollbar { width: 5px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { 
                background: ${colorScheme === 'dark' ? '#444' : '#ccc'}; 
                border-radius: 10px; 
              }
            `}</style>

            {notifications.length > 0 ? (
              <>
                {notifications.map((n) => {
                  const status = getStatusData(n.content)
                  return (
                    <CToast
                      key={n.id}
                      visible
                      autohide={false}
                      style={{
                        backgroundColor: colorScheme === 'dark' ? status.darkBg : '#fdfdfd',
                        borderLeft: `4px solid ${status.color}`,
                        color: colorScheme === 'dark' ? '#eee' : '#333',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        width: '100%', // Asegura que ocupe todo el ancho disponible
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        boxShadow: colorScheme === 'dark' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <CToastHeader
                        closeButton
                        onClick={() => removeNotification(n.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: colorScheme === 'dark' ? '#fff' : '#000',
                          padding: '8px 8px 4px 8px',
                        }}
                      >
                        <div
                          className="fw-bold me-auto d-flex align-items-center"
                          style={{ fontSize: '12px' }}
                        >
                          <CIcon
                            icon={status.icon}
                            className="me-2"
                            style={{ color: status.color }}
                          />
                          Notificación
                        </div>
                      </CToastHeader>
                      <CToastBody style={{ padding: '0 12px 10px 12px' }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{n.content}</div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span
                            style={{
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: '#3399ff',
                              fontWeight: '600',
                            }}
                            onClick={() => toggleReadStatus(n.id, n.status)}
                          >
                            {n.status === 'read' ? 'Pendiente' : 'Leído'}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.5 }}>
                            {n.status === 'read' ? '✓ Leído' : 'Pendiente'}
                          </span>
                        </div>
                      </CToastBody>
                    </CToast>
                  )
                })}
                <CButton
                  color="link"
                  size="sm"
                  className="w-100 mt-2 text-danger text-decoration-none"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  onClick={deleteAllNotifications}
                >
                  Limpiar todas las notificaciones
                </CButton>
              </>
            ) : (
              <div className="text-center py-4 opacity-50">
                <CIcon icon={cilBell} size="xl" className="mb-2" />
                <p className="mb-0" style={{ fontSize: '13px' }}>
                  Bandeja vacía
                </p>
              </div>
            )}
          </div>
        }
      >
        <CButton
          ref={buttonRef}
          color="transparent"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setVisible(!visible)
          }}
          className="position-relative p-2"
        >
          <CIcon
            icon={cilBell}
            size="lg"
            style={{ color: colorScheme === 'dark' ? '#fff' : '#444' }}
          />
          {notifications.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'blueviolet',
                color: 'white',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${colorScheme === 'dark' ? '#212631' : '#fff'}`,
              }}
            >
              {notifications.length}
            </span>
          )}
        </CButton>
      </CPopover>
    </div>
  )
}
