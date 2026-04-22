export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  age: string
  gender: '' | 'male' | 'female'
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
  age: '',
  gender: '',
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
