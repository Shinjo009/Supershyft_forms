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
  relation: string
  houseNumber: string
  useSamePhone: boolean
  useSameEmail: boolean
  appointmentDate: string
  appointmentTime: string
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
  relation: 'spouse',
  houseNumber: '',
  useSamePhone: true,
  useSameEmail: true,
  appointmentDate: '',
  appointmentTime: '',
}
