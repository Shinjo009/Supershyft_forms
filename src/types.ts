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
  latitude: number | null
  longitude: number | null
  provider: string
  zoneId: string
  relation: string
  appointmentDate: string
  appointmentTime: string
  appointmentSlotId: string
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
  latitude: null,
  longitude: null,
  provider: '',
  zoneId: '',
  relation: 'spouse',
  appointmentDate: '',
  appointmentTime: '',
  appointmentSlotId: '',
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
  latitude: number | null
  longitude: number | null
  provider: string
  zoneId: string
  useSameAddress: boolean
  appointmentDate: string
  appointmentTime: string
  appointmentSlotId: string
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
  latitude: null,
  longitude: null,
  provider: '',
  zoneId: '',
  useSameAddress: false,
  appointmentDate: '',
  appointmentTime: '',
  appointmentSlotId: '',
}
