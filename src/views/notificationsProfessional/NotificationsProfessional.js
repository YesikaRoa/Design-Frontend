import React, { useState } from 'react'
import { CButton, CPopover, CToast, CToastBody, CToastHeader } from '@coreui/react'
import { cilBell } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

export const NotificationPopover = () => {
  const [visible, setVisible] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Tienes una nueva cita.', color: '#DFF6DD' }, // Verde pastel
    { id: 2, text: 'Se actualizó tu perfil.', color: '#FFE5D1' }, // Naranja pastel
    { id: 3, text: 'Mensaje del administrador.', color: '#E3F6FD' }, // Azul pastel
  ])

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <div className="position-relative">
      <CPopover
        content={
          <div
            style={{
              width: '250px', // Define un ancho fijo
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 3px rgba(0, 0, 0,0.02)',
            }}
          >
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <CToast
                  key={notification.id}
                  animation={true}
                  visible={true}
                  autohide={false}
                  style={{
                    backgroundColor: notification.color,
                    borderRadius: '8px',
                    marginBottom: '10px',
                    padding: '8px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <CToastHeader
                    closeButton={true}
                    onClick={() => removeNotification(notification.id)}
                  >
                    <svg
                      className="rounded me-2"
                      width="20"
                      height="20"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="xMidYMid slice"
                      focusable="false"
                      role="img"
                    >
                      <rect width="100%" height="100%" fill={notification.color}></rect>
                    </svg>
                    <div className="fw-bold me-auto">Notificación</div>
                  </CToastHeader>
                  <CToastBody>{notification.text}</CToastBody>
                </CToast>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No hay notificaciones</p>
            )}
          </div>
        }
        placement="bottom"
        visible={visible}
        onShow={() => setVisible(true)}
        onHide={() => setVisible(false)}
        modifiers={[
          {
            name: 'offset',
            options: { offset: [0, 10] }, // Añade un desplazamiento para mejorar la posición
          },
          {
            name: 'preventOverflow',
            options: { boundary: 'viewport' }, // Evita que salga del área visible
          },
          {
            name: 'flip',
            options: { fallbackPlacements: ['bottom'] }, // No permite el cambio de posición a los lados
          },
        ]}
      >
        <CButton
          color="transparent"
          onClick={() => setVisible(!visible)}
          className="position-relative"
        >
          <CIcon icon={cilBell} size="lg" />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: 'blueviolet',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              textAlign: 'center',
              lineHeight: '16px',
            }}
          >
            {notifications.length}
          </span>
        </CButton>
      </CPopover>
    </div>
  )
}
