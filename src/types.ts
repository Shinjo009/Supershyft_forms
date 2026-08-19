export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  employeeId: string
  age: string
  gender: '' | 'male' | 'female'
  street: string
  landmark: string
  pincode: string
  city: string
  state: string
  department: string
  doctorConsultation: '' | 'yes' | 'no'
  eyeConsultation: '' | 'yes' | 'no'
  relation: string
  houseNumber: string
  appointmentDate: string
  appointmentTime: string
  appointmentCabin: string
  appointmentCabinName: string
}

export const defaultFormData: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  employeeId: '',
  age: '',
  gender: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  department: '',
  doctorConsultation: '',
  eyeConsultation: '',
  relation: 'spouse',
  houseNumber: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentCabin: '',
  appointmentCabinName: '',
}
