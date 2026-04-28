export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  employeeId: string
  department: string
  age: string
  gender: '' | 'male' | 'female'
  bloodGroup: string
  personalizedDoctorConsultation: '' | 'yes' | 'no'
  street: string
  landmark: string
  pincode: string
  city: string
  relation: string
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
  department: '',
  age: '',
  gender: '',
  bloodGroup: '',
  personalizedDoctorConsultation: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  relation: 'spouse',
  useSamePhone: true,
  useSameEmail: true,
  appointmentDate: '',
  appointmentTime: '',
}
