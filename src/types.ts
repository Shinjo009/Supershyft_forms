export type FormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  age: string
  gender: '' | 'male' | 'female'
  houseNo: string
  areaStreet: string
  landmark: string
  pincode: string
  city: string
  state: string
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
  houseNo: '',
  areaStreet: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  relation: 'spouse',
  appointmentDate: '',
  appointmentTime: '06:00 - 07:00 AM',
}

export function formatBookingAddress(form: Pick<FormData, 'houseNo' | 'areaStreet' | 'landmark'>): string {
  return [form.houseNo, form.areaStreet, form.landmark]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
}

export type AdditionalMemberForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  age: string
  gender: '' | 'male' | 'female'
  houseNo: string
  areaStreet: string
  landmark: string
  pincode: string
  city: string
  state: string
  useSameAddress: boolean
  appointmentDate: string
  appointmentTime: string
}

export const defaultAdditionalMemberForm: AdditionalMemberForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  age: '',
  gender: '',
  houseNo: '',
  areaStreet: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  useSameAddress: false,
  appointmentDate: '',
  appointmentTime: '06:00 - 07:00 AM',
}
