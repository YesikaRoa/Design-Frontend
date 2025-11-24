// src/utils/Validations.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isStepValid = (step, formData) => {
  switch (step) {
    case 1:
      return (
        formData.first_name.trim() !== '' &&
        formData.last_name.trim() !== '' &&
        validateEmail(formData.email) &&
        formData.password.trim() !== ''
      )
    case 2:
      return (
        formData.address.trim() !== '' &&
        formData.phone.trim() !== '' &&
        formData.birth_date.trim() !== '' &&
        formData.gender.trim() !== ''
      )
    case 3:
      return (
        formData.role_id.trim() !== '' &&
        formData.description.trim() !== '' &&
        formData.years_experience.trim() !== ''
      )
    default:
      return false
  }
}
// 📌 Valida un solo campo según las mismas reglas del backend (Zod)
export const validateField = (name, value, t) => {
  let message = ''

  switch (name) {
    case 'first_name':
      if (!value.trim()) message = t('First name is required')
      break

    case 'last_name':
      if (!value.trim()) message = t('Last name is required')
      break

    case 'email':
      if (!validateEmail(value)) message = t('Invalid email address')
      break

    case 'password':
      if (value.length < 6) message = t('Password must be at least 6 characters long')
      break

    case 'phone':
      if (!/^\d{11}$/.test(value)) message = t('Phone must be a valid 11 digit (04127690000)')
      break

    case 'birth_date': {
      if (!value) {
        message = t('Birth date is required')
        break
      }

      const date = new Date(value)
      const today = new Date()

      if (date > today) message = t('The date of birth cannot be later than today.')
      else {
        const age =
          today.getFullYear() -
          date.getFullYear() -
          (today.getMonth() < date.getMonth() ||
          (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
            ? 1
            : 0)

        if (age < 20) message = t('You must be at least 20 years old to register')
      }
      break
    }

    case 'years_experience':
      if (value === '' || Number(value) < 0)
        message = t('Years of experience must be a positive number')
      break

    default:
      break
  }

  return message
}
