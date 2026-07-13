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
  relation: string
  houseNumber: string
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
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: 'Maharashtra',
  relation: 'spouse',
  houseNumber: '',
  appointmentDate: '',
  appointmentTime: '',
}
