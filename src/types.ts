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
  useSameAddress: false,
  appointmentDate: '',
  appointmentTime: '',
  appointmentSlotId: '',
}
