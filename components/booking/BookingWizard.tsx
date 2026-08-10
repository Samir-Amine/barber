import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  Calendar,
  Clock,
  Scissors,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  image_url?: string | null;
}

interface Barber {
  id: string;
  profile_id: string;
  name: string;
  avatar?: string | null;
  role?: string;
}

interface BookingWizardProps {
  initialServiceId?: string;
  onSuccessNavigate?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialServiceId,
  onSuccessNavigate,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);

  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [clientName, setClientName] = useState(profile?.full_name || '');
  const [clientPhone, setClientPhone] = useState(profile?.phone || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /*
   * Load services and active barbers from Supabase.
   */
  useEffect(() => {
    const loadBookingData = async () => {
      if (!supabase) {
        setError('Supabase client is not configured.');
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      setError(null);

      try {
        const [servicesResult, barbersResult] = await Promise.all([
          supabase
            .from('services')
            .select(
              'id, name, description, price, duration_minutes, image_url'
            )
            .eq('is_available', true)
            .order('display_order', { ascending: true }),

          supabase
            .from('barbers')
            .select(
              `
                id,
                profile_id,
                photo_url,
                profiles!inner (
                  full_name
                )
              `
            )
            .eq('is_active', true),
        ]);

        if (servicesResult.error) {
          throw new Error(
            servicesResult.error.message || 'Failed to load services.'
          );
        }

        if (barbersResult.error) {
          throw new Error(
            barbersResult.error.message || 'Failed to load barbers.'
          );
        }

        const loadedServices = (servicesResult.data || []) as Service[];

        const loadedBarbers: Barber[] = (barbersResult.data || []).map(
          (barber: any) => ({
            id: barber.id,
            profile_id: barber.profile_id,
            name: barber.profiles?.full_name || 'Barber',
            avatar: barber.photo_url || null,
            role: 'Barber',
          })
        );

        setServices(loadedServices);
        setBarbers(loadedBarbers);

        if (initialServiceId) {
          const initialService = loadedServices.find(
            (service) => service.id === initialServiceId
          );

          if (initialService) {
            setSelectedService(initialService);
          }
        }
      } catch (err: any) {
        console.error('Error loading booking data:', err);
        setError(
          err?.message ||
            'Unable to load booking information. Please try again.'
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadBookingData();
  }, [initialServiceId]);

  /*
   * Keep customer information synchronized with the logged-in profile.
   */
  useEffect(() => {
    if (profile?.full_name) {
      setClientName(profile.full_name);
    }

    if (profile?.phone) {
      setClientPhone(profile.phone);
    }

    if (user?.email) {
      setClientEmail(user.email);
    }
  }, [profile, user]);

  /*
   * Generate booking time slots.
   */
  const timeSlots = useMemo(
    () => [
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ],
    []
  );

  const handleNext = () => {
    setError(null);

    if (step === 1 && !selectedService) {
      setError('Please select a service.');
      return;
    }

    if (step === 2 && !selectedBarber) {
      setError('Please select a barber.');
      return;
    }

    if (step === 3 && (!selectedDate || !selectedTime)) {
      setError('Please select a date and time.');
      return;
    }

    setStep((current) => current + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Supabase client is not configured.');
      return;
    }

    if (!user) {
      setError('Please log in before booking an appointment.');
      return;
    }

    if (!selectedService || !selectedBarber) {
      setError('Please select a service and barber.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time.');
      return;
    }

    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /*
       * Calculate appointment end time from the service duration.
       */
      const [hours, minutes] = selectedTime.split(':').map(Number);

      const start = new Date();
      start.setHours(hours, minutes, 0, 0);

      const end = new Date(
        start.getTime() + selectedService.duration_minutes * 60 * 1000
      );

      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(
        end.getMinutes()
      ).padStart(2, '0')}:00`;

      /*
       * Customer profile ID = authenticated user's ID.
       */
      const { data, error: rpcError } = await supabase.rpc(
        'create_appointment',
        {
          p_customer_id: user.id,
          p_barber_id: selectedBarber.id,
          p_service_id: selectedService.id,
          p_appointment_date: selectedDate,
          p_start_time: `${selectedTime}:00`,
          p_end_time: endTime,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message || 'Failed to create appointment.'
        );
      }

      console.log('Appointment created:', data);

      /*
       * Notify the server-side Make automation endpoint.
       */
      fetch('/api/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'create',
          record_id:
            typeof data === 'string'
              ? data
              : data?.id || data?.[0]?.id || null,
          actor: {
            id: user.id,
            role: profile?.role || 'customer',
          },
          data: {
            service_id: selectedService.id,
            barber_id: selectedBarber.id,
            appointment_date: selectedDate,
            start_time: `${selectedTime}:00`,
            end_time: endTime,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail,
            notes,
          },
        }),
      }).catch((automationError) => {
        console.warn(
          'Appointment created, but automation notification failed:',
          automationError
        );
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error creating appointment:', err);

      setError(
        err?.message ||
          t('booking.errorGeneric') ||
          'Failed to complete booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-400">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800 bg-stone-900/50">
          <div>
            <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-500" />
              {t('booking.title') || 'Book Appointment'}
            </h2>

            <p className="text-xs text-stone-400 mt-1">
              {step === 1 && 'Choose a service'}
              {step === 2 && 'Choose your barber'}
              {step === 3 && 'Choose date and time'}
              {step === 4 && 'Confirm your information'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSuccessNavigate?.()}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {!isSuccess && (
          <div className="grid grid-cols-4 border-b border-stone-800 bg-stone-900/30">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`py-3 text-center text-xs font-medium border-b-2 ${
                  step === item
                    ? 'border-amber-500 text-amber-500'
                    : step > item
                    ? 'border-stone-700 text-stone-300'
                    : 'border-transparent text-stone-600'
                }`}
              >
                {t('booking.step') || 'Step'} {item}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {isSuccess ? (
          <div className="p-10 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-stone-100">
              {t('booking.successTitle') || 'Booking Confirmed!'}
            </h3>

            <p className="text-sm text-stone-400 max-w-md mx-auto">
              {t('booking.successMessage') ||
                'Your appointment has been successfully scheduled.'}
            </p>

            <button
              type="button"
              onClick={() => onSuccessNavigate?.()}
              className="px-6 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all inline-flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {t('common.done') || 'Done'}
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <div className="py-10 text-center text-stone-500 text-sm">
                      No services are currently available.
                    </div>
                  ) : (
                    services.map((service) => {
                      const selected =
                        selectedService?.id === service.id;

                      return (
                        <button
                          type="button"
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                            selected
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                          }`}
                        >
                          <div>
                            <h4 className="font-semibold text-stone-100 text-sm">
                              {service.name}
                            </h4>

                            {service.description && (
                              <p className="text-xs text-stone-500 mt-1">
                                {service.description}
                              </p>
                            )}

                            <p className="text-xs text-stone-400 flex items-center gap-2 mt-2">
                              <Clock className="w-3.5 h-3.5" />
                              {service.duration_minutes}{' '}
                              {t('common.mins') || 'mins'}
                            </p>
                          </div>

                          <span className="text-sm font-bold text-amber-500">
                            {service.price} MAD
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {barbers.length === 0 ? (
                    <div className="sm:col-span-2 py-10 text-center text-stone-500 text-sm">
                      No barbers are currently available.
                    </div>
                  ) : (
                    barbers.map((barber) => {
                      const selected =
                        selectedBarber?.id === barber.id;

                      return (
                        <button
                          type="button"
                          key={barber.id}
                          onClick={() => setSelectedBarber(barber)}
                          className={`text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                            selected
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold overflow-hidden shrink-0">
                            {barber.avatar ? (
                              <img
                                src={barber.avatar}
                                alt={barber.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold text-stone-100 text-sm">
                              {barber.name}
                            </h4>

                            <p className="text-xs text-stone-400">
                              {barber.role || 'Barber'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {t('booking.selectDate') || 'Select Date'}
                    </label>

                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {t('booking.selectTime') || 'Select Time'}
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            selectedTime === time
                              ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                              : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <form
                  id="booking-form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-stone-300">
                      {t('common.name') || 'Full Name'} *
                    </label>

                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full mt-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-300">
                      {t('common.phone') || 'Phone'} *
                    </label>

                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full mt-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                      placeholder="+212 6..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-300">
                      {t('common.email') || 'Email'}
                    </label>

                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full mt-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-300">
                      {t('common.notes') || 'Notes'}
                    </label>

                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full mt-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none resize-none"
                      placeholder={
                        t('booking.notesPlaceholder') ||
                        'Any special requests...'
                      }
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-900/50 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  {t('common.back') || 'Back'}
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedService) ||
                    (step === 2 && !selectedBarber) ||
                    (step === 3 &&
                      (!selectedDate || !selectedTime))
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all"
                >
                  {t('common.next') || 'Next'}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="booking-form"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all"
                >
                  {loading
                    ? t('common.loading') || 'Processing...'
                    : t('booking.confirmBooking') ||
                      'Confirm Booking'}

                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
