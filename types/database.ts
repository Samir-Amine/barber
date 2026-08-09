export type UserRole = 'owner' | 'barber' | 'customer';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type NotificationType = 'appointment' | 'confirmation' | 'cancellation' | 'message' | 'system';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Barber {
  id: string;
  profile_id: string;
  bio: string | null;
  specialties: string[] | null;
  is_active: boolean;
  photo_url: string | null;
  created_at: string;
  // Joined profile fields
  profile?: Profile;
}

export interface Customer {
  id: string;
  profile_id: string;
  notes: string | null;
  created_at: string;
  // Joined profile fields
  profile?: Profile;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string; // HH:MM:SS or HH:MM
  status: AppointmentStatus;
  cancellation_reason: string | null;
  total_price: number | null;
  created_at: string;
  updated_at?: string;
  // Joined relations
  customer?: Customer & { profile?: Profile };
  barber?: Barber & { profile?: Profile };
  service?: Service;
}

export interface BusinessHours {
  id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  recipient_role: 'owner' | 'barber';
  barber_id: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
  barber?: Barber & { profile?: Profile };
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: Profile;
  recipient_profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link_url?: string | null;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  entity: string;
  action: string;
  record_id: string | null;
  payload: Record<string, unknown>;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updated_at?: string;
}

// RPC Request and Response Types
export interface CreateAppointmentRPCParams {
  p_customer_id: string;
  p_barber_id: string;
  p_service_id: string;
  p_appointment_date: string;
  p_start_time: string;
  p_end_time: string;
}

export interface ConfirmAppointmentRPCParams {
  p_appointment_id: string;
}

export interface CancelAppointmentRPCParams {
  p_appointment_id: string;
  p_reason: string;
}

export interface CompleteAppointmentRPCParams {
  p_appointment_id: string;
}
