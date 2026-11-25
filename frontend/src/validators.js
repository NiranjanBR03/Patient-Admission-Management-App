import { todayIST, wardDepartments } from './constants'

const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/

export function titleCaseName(value) {
  return value.trim().split(/\s+/).map((part) => part.split(/([-'])/).map((piece) => /^[A-Za-z]/.test(piece) ? piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase() : piece).join('')).join(' ')
}

export function validatePatient(form) {
  const errors = {}
  const name = String(form.name || '').trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (name.length > 50) errors.name = 'Name must be 50 characters or fewer'
  else if (!namePattern.test(name)) errors.name = 'Name may contain letters, spaces, hyphens and apostrophes only'

  if (form.age === '' || form.age === null || form.age === undefined) errors.age = 'Age is required'
  else if (!/^\d+$/.test(String(form.age))) errors.age = 'Age must be an integer'
  else if (Number(form.age) < 0 || Number(form.age) > 120) errors.age = 'Age must be between 0 and 120'

  for (const field of ['gender', 'ward', 'department', 'doctor']) if (!form[field]) errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
  if (form.ward && form.department && wardDepartments[form.ward] && !wardDepartments[form.ward].includes(form.department)) errors.department = `${form.department} is not available in the ${form.ward} ward`
  if (!form.admission_date) errors.admission_date = 'Admission date is required'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.admission_date)) errors.admission_date = 'Admission date must be a valid date'
  else if (form.admission_date > todayIST()) errors.admission_date = 'Admission date cannot be in the future'
  if (!['Admitted', 'Discharged'].includes(form.status)) errors.status = 'Status must be Admitted or Discharged'
  return errors
}

