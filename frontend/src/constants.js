export const options = {
  genders: ['Female', 'Male', 'Other'],
  wards: ['General', 'ICU', 'Emergency', 'Maternity', 'Pediatrics'],
  departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Obstetrics', 'Gynecology'],
  doctors: ['Dr. Sharma', 'Dr. Patel', 'Dr. Mehta', 'Dr. Rao', 'Dr. Singh'],
  statuses: ['Admitted', 'Discharged'],
}

export const wardDepartments = {
  General: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
  ICU: ['Cardiology', 'Neurology', 'General Medicine'],
  Emergency: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
  Maternity: ['Obstetrics', 'Gynecology', 'Pediatrics'],
  Pediatrics: ['Pediatrics'],
}

export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
export const emptyPatient = () => ({ name: '', age: '', gender: '', ward: '', department: '', doctor: '', admission_date: todayIST(), status: 'Admitted' })

