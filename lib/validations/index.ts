import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  recipient_role: z.enum(['owner', 'barber']),
  barber_id: z.string().nullable().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const bookingSchema = z.object({
  service_id: z.string().uuid('Please select a service'),
  barber_id: z.string().uuid('Please select a barber'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string().min(4, 'Select a start time'),
  end_time: z.string().min(4, 'Select an end time'),
  customer_name: z.string().min(2, 'Full name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(6, 'Valid phone number is required'),
  notes: z.string().optional(),
});

export const cancellationSchema = z.object({
  appointment_id: z.string().uuid(),
  reason: z.string().min(5, 'Cancellation reason must be at least 5 characters long'),
});

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  duration_minutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  image_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  is_active: z.boolean(),
  display_order: z.number().int().default(0),
});

export const barberSchema = z.object({
  full_name: z.string().min(2, 'Barber name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  photo_url: z.string().url().or(z.literal('')).optional(),
  is_active: z.boolean().default(true),
});
