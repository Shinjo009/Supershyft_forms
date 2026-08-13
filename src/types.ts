import { BOOKING_CAMP_ISO } from './lib/bookingDates'

export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  age: string
  gender: '' | 'male' | 'female'
  department: '' | 'Sales' | 'Marketing' | 'Operations' | 'Others'
  relation: string
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
  department: '',
  relation: 'spouse',
  appointmentDate: BOOKING_CAMP_ISO,
  appointmentTime: '09:00 AM',
}
