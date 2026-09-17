export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  employeeId: string
  age: string
  gender: '' | 'male' | 'female'
  personalizedDoctorConsultation: '' | 'yes' | 'no'
  street: string
  landmark: string
  pincode: string
  city: string
  state: string
  relation: string
  houseNumber: string
  useSamePhone: boolean
  useSameEmail: boolean
  appointmentDate: string
  appointmentTime: string
  appointmentSlotId: string
  /** Raw slot start from available-slots, e.g. "07:00:00". */
  appointmentSlotStart: string
}

export const defaultFormData: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  employeeId: '',
  age: '',
  gender: '',
  personalizedDoctorConsultation: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  relation: 'spouse',
  houseNumber: '',
  useSamePhone: true,
  useSameEmail: true,
  appointmentDate: '',
  appointmentTime: '',
  appointmentSlotId: '',
  appointmentSlotStart: '',
}
