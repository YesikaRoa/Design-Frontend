export function formatDate(date, type) {
  const options = {
    DATE: { year: 'numeric', month: '2-digit', day: '2-digit' },
    TIME: { hour: '2-digit', minute: '2-digit', hour12: true },
    DATETIME: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    },
  }

  if (!date || !options[type]) {
    return ''
  }

  return new Intl.DateTimeFormat('es', options[type]).format(new Date(date))
}
