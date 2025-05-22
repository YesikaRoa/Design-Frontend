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
