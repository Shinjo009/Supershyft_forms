export type YesNo = '' | 'yes' | 'no'

export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  employeeId: string
  department: string
  bloodGroup: string
  age: string
  gender: '' | 'male' | 'female'
  street: string
  landmark: string
  pincode: string
  city: string
  state: string
  country: string
  referredBy: string
  doctorConsultation: YesNo
  nutritionistConsultation: YesNo
  eyeConsultation: YesNo
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
  department: '',
  bloodGroup: '',
  age: '',
  gender: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  country: '',
  referredBy: '',
  doctorConsultation: '',
  nutritionistConsultation: '',
  eyeConsultation: '',
  relation: 'spouse',
  houseNumber: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentCabin: '',
  appointmentCabinName: '',
}
