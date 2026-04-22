export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  age: string
  gender: 'male' | 'female'
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
  phone: '+91 999999999',
  email: 'abc.xyz@gmail.com',
  age: '29',
  gender: 'female',
  street: '350 A, Avenue Street',
  landmark: 'opp. Pink Salt Cafe',
  pincode: '402 201',
  city: 'Mumbai',
  relation: 'spouse',
  useSamePhone: true,
  useSameEmail: true,
  appointmentDate: 'Mon, 12 Aug',
  appointmentTime: '08:00 - 09:00 AM',
}
