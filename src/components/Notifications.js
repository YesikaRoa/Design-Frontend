class Notifications {
  static showAlert(setAlert, message, type = 'info', duration = 3000) {
    setAlert({ message, type })
    setTimeout(() => {
      setAlert(null)
    }, duration) // Usa el parámetro de duración
  }
}

export default Notifications
