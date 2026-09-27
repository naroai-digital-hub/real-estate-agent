export interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  full_name: string
  email: string
  phone: string
  service_id: string
  appointment_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string
  created_at: string
}

export interface BusinessHours {
  id: string
  weekday: number // 0 = Sunday … 6 = Saturday
  is_open: boolean
  start_time: string
  end_time: string
}

export interface BlockedDate {
  id: string
  blocked_date: string // YYYY-MM-DD
  reason: string
  created_at: string
}

export interface BusinessSettings {
  id: string
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  slot_interval_minutes: number
  booking_notice_hours: number
  created_at: string
}

export interface BookedRange {
  start_time: string
  end_time: string
}

export type AppointmentStatus = Appointment['status']

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
