import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n';
import { Barber, Service, BusinessHours, BarberAvailability, Appointment } from '../../types/database';
import { bookingSchema } from '../../lib/validations';
import { EmptyState } from '../ui/EmptyState';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface BookingWizardProps {
  initialServiceId?: string;
  onSuccessNavigate?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialServiceId,
  onSuccessNavigate,
}) => {
  const { t, dir } = useTranslation();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingSlots, setFetchingSlots] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Database collections
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<(Barber & { profile?: any })[]>([]);

  // Selection State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<(Barber & { profile?: any }) | null>(null);
  const [isAnyBarber, setIsAnyBarber] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Customer Input State
  const [customerName, setCustomerName] = useState<string>(profile?.full_name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(profile?.email || user?.email || '');
  const [customerPhone, setCustomerPhone] = useState<string>(profile?.phone || '');
  const [notes, setNotes] = useState<string>('');

  // Initial data load from Supabase
  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      setLoading(true);
      try {
        // Load active services
        const { data: svcData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (svcData) {
          setServices(svcData as Service[]);
          if (initialServiceId) {
            const pre = svcData.find((s) => s.id === initialServiceId);
            if (pre) setSelectedService(pre as Service);
          }
        }

        // Load active barbers joined with profiles
        const { data: barbData } = await supabase
          .from('barbers')
          .select('*, profile:profiles(*)')
          .eq('is_active', true);

        if (barbData) {
          setBarbers(barbData as any);
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialServiceId]);

  // Compute available slots when Date or Barber or Service changes
  useEffect(() => {
    async function computeSlots() {
      if (!selectedDate || !selectedService || !supabase) return;
      setFetchingSlots(true);
      setAvailableSlots([]);
      setSelectedTime('');

      try {
        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay(); // 0-6

        // 1. Fetch business hours for this day
        const { data: bhData } = await supabase
          .from('business_hours')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .single();

        let openTime = '09:00';
        let closeTime = '21:00';
        let isClosed = false;

        if (bhData) {
          if (bhData.is_closed) isClosed = true;
          else {
            openTime = bhData.open_time.substring(0, 5);
            closeTime = bhData.close_time.substring(0, 5);
          }
        }

        if (isClosed) {
          setAvailableSlots([]);
          setFetchingSlots(false);
          return;
        }

        // 2. Fetch existing appointments for date
        let query = supabase
          .from('appointments')
          .select('start_time, end_time, barber_id, status')
          .eq('appointment_date', selectedDate)
          .neq('status', 'cancelled');

        if (!isAnyBarber && selectedBarber) {
          query = query.eq('barber_id', selectedBarber.id);
        }

        const { data: existingApps } = await query;

        // Generate 30-min interval slots between openTime and closeTime
        const slots: string[] = [];
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);

        let currMinutes = openHour * 60 + openMin;
        const endMinutes = closeHour * 60 + closeMin;
        const durationMinutes = selectedService.duration_minutes || 30;

        const bookedTimes = new Set<string>();
        if (existingApps) {
          existingApps.forEach((app) => {
            if (app.start_time) {
              bookedTimes.add(app.start_time.substring(0, 5));
            }
          });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentMinutesToday = now.getHours() * 60 + now.getMinutes();

        while (currMinutes + durationMinutes <= endMinutes) {
          const hh = Math.floor(currMinutes / 60)
            .toString()
            .padStart(2, '0');
          const mm = (currMinutes % 60).toString().padStart(2, '0');
          const timeSlot = `${hh}:${mm}`;

          // Filter past times if selecting today
          if (selectedDate === todayStr && currMinutes <= currentMinutesToday) {
            currMinutes += 30;
            continue;
          }

          // Filter overlapping booked times
          if (!bookedTimes.has(timeSlot)) {
            slots.push(timeSlot);
          }

          currMinutes += 30;
        }

        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error calculating slots:', err);
      } finally {
        setFetchingSlots(false);
      }
    }

    if (step >= 3) {
      computeSlots();
    }
  }, [selectedDate, selectedBarber, selectedService, isAnyBarber, step]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedService) {
      setErrorMsg(t('booking.selectServicePrompt'));
      return;
    }

    const assignedBarber = isAnyBarber ? barbers[0] : selectedBarber;
    if (!assignedBarber) {
      setErrorMsg(t('booking.selectBarberPrompt'));
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMsg(t('booking.validationError'));
      return;
    }

    // Calculate end time
    const [hh, mm] = selectedTime.split(':').map(Number);
    const startMins = hh * 60 + mm;
    const endMins = startMins + selectedService.duration_minutes;
    const endHH = Math.floor(endMins / 60)
      .toString()
      .padStart(2, '0');
    const endMM = (endMins % 60).toString().padStart(2, '0');
    const endTimeStr = `${endHH}:${endMM}`;

    // Validate payload with Zod
    const validation = bookingSchema.safeParse({
      service_id: selectedService.id,
      barber_id: assignedBarber.id,
      appointment_date: selectedDate,
      start_time: selectedTime,
      end_time: endTimeStr,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      notes,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      // 1. Resolve or create customer profile ID
      let customerId = user?.id;
      if (!customerId) {
        // Find existing profile by email or create temp ID
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .single();

        if (existingProf) {
          customerId = existingProf.id;
        } else {
          // Create temp customer UUID
          const tempId = typeof crypto !== 'undefined' ? crypto.randomUUID() : `cust_${Date.now()}`;
          await supabase.from('profiles').insert({
            id: tempId,
            email: customerEmail,
            full_name: customerName,
            phone: customerPhone,
            role: 'customer',
          });
          customerId = tempId;
        }
      }

      // 2. Call `create_appointment` RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_appointment', {
        p_customer_id: customerId,
        p_barber_id: assignedBarber.id,
        p_service_id: selectedService.id,
        p_appointment_date: selectedDate,
        p_start_time: selectedTime,
        p_end_time: endTimeStr,
      });

      let appointmentId = rpcData;

      // Fallback direct insert if RPC function signature differs slightly in existing DB
      if (rpcError) {
        console.warn('RPC create_appointment returned error, attempting direct insert:', rpcError);
        const { data: directData, error: directError } = await supabase
          .from('appointments')
          .insert({
            customer_id: customerId,
            barber_id: assignedBarber.id,
            service_id: selectedService.id,
            appointment_date: selectedDate,
            start_time: selectedTime,
            end_time: endTimeStr,
            status: 'pending',
            total_price: selectedService.price,
          })
          .select('id')
          .single();

        if (directError) {
          throw new Error(directError.message || 'Failed to record appointment.');
        }
        appointmentId = directData?.id;
      }

      // 3. Trigger Make.com Server Automation Event securely
      fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'create',
          record_id: appointmentId,
          actor: { id: customerId, role: 'customer' },
          data: {
            customer_name: customerName,
            customer_phone: customerPhone,
            service_name: selectedService.name,
            appointment_date: selectedDate,
            start_time: selectedTime,
          },
        }),
      }).catch((e) => console.warn('Automation trigger notice:', e));

      setSuccess(true);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-stone-900 border border-amber-500/30 rounded-2xl text-center space-y-6 shadow-2xl animate-in zoom-in-95">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-amber-100">
          {t('booking.successTitle')}
        </h2>
        <p className="text-stone-300 text-sm max-w-lg mx-auto leading-relaxed">
          {t('booking.successText')}
        </p>

        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs text-stone-300 max-w-md mx-auto text-left rtl:text-right space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-400">{t('common.service')}:</span>
            <span className="font-semibold text-amber-300">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">{t('common.date')}:</span>
            <span className="font-mono text-stone-200">{selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">{t('common.time')}:</span>
            <span className="font-mono text-stone-200">{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">{t('common.status')}:</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
              {t('common.statuses.pending')}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {onSuccessNavigate && (
            <button
              onClick={onSuccessNavigate}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400 transition-all text-xs uppercase"
            >
              {t('booking.goDashboard')}
            </button>
          )}
          <button
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setSelectedService(null);
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-stone-800 text-stone-200 font-semibold rounded-xl hover:bg-stone-700 transition-all text-xs"
          >
            {t('booking.bookAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-stone-950 border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden">
      {/* Wizard Progress Bar */}
      <div className="bg-stone-900 border-b border-stone-800 p-4">
        <div className="flex items-center justify-between text-xs font-medium text-stone-400 max-w-2xl mx-auto">
          <span className={`flex items-center gap-1 ${step >= 1 ? 'text-amber-400 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
            {t('booking.step1')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 rtl:rotate-180" />
          <span className={`flex items-center gap-1 ${step >= 2 ? 'text-amber-400 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
            {t('booking.step2')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 rtl:rotate-180" />
          <span className={`flex items-center gap-1 ${step >= 3 ? 'text-amber-400 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
            {t('booking.step3')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 rtl:rotate-180" />
          <span className={`flex items-center gap-1 ${step >= 4 ? 'text-amber-400 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">4</span>
            {t('booking.step4')}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="font-serif text-xl font-bold text-amber-100 mb-1">
                {t('booking.step1')}
              </h3>
              <p className="text-stone-400 text-xs">{t('booking.selectServicePrompt')}</p>
            </div>

            {services.length === 0 ? (
              <EmptyState message={t('services.noServicesAvailable')} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border text-left rtl:text-right transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-100 shadow-lg shadow-amber-500/5'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-amber-400" />
                          <h4 className="font-semibold text-sm">{service.name}</h4>
                        </div>
                        {service.description && (
                          <p className="text-xs text-stone-400 line-clamp-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs pt-2">
                          <span className="flex items-center gap-1 text-stone-400">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {service.duration_minutes} {t('common.min')}
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-sm">
                            {service.price} {t('common.dh')}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                disabled={!selectedService}
                onClick={() => {
                  if (selectedService) {
                    setErrorMsg(null);
                    setStep(2);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BARBER SELECTION */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="font-serif text-xl font-bold text-amber-100 mb-1">
                {t('booking.step2')}
              </h3>
              <p className="text-stone-400 text-xs">{t('booking.selectBarberPrompt')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Any Barber Option */}
              <button
                onClick={() => {
                  setIsAnyBarber(true);
                  setSelectedBarber(null);
                }}
                className={`p-4 rounded-xl border text-left rtl:text-right transition-all flex items-center justify-between ${
                  isAnyBarber
                    ? 'bg-amber-500/15 border-amber-500 text-amber-100'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{t('booking.anyBarber')}</h4>
                    <p className="text-xs text-stone-400">First available master barber</p>
                  </div>
                </div>
                {isAnyBarber && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Specific Barbers from DB */}
              {barbers.map((barber) => {
                const isSelected = !isAnyBarber && selectedBarber?.id === barber.id;
                const barberName = barber.profile?.full_name || 'Barber';
                return (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setIsAnyBarber(false);
                      setSelectedBarber(barber);
                    }}
                    className={`p-4 rounded-xl border text-left rtl:text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-100'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {barber.photo_url ? (
                        <img
                          src={barber.photo_url}
                          alt={barberName}
                          className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {barberName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">{barberName}</h4>
                        {barber.specialties && barber.specialties.length > 0 && (
                          <p className="text-[11px] text-amber-400/80">{barber.specialties.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('common.back')}
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="font-serif text-xl font-bold text-amber-100 mb-1">
                {t('booking.step3')}
              </h3>
              <p className="text-stone-400 text-xs">{t('booking.selectDatePrompt')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  {t('common.date')}
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {t('booking.availableSlots')}
                </label>

                {fetchingSlots ? (
                  <div className="p-8 text-center text-xs text-stone-400">{t('common.loading')}</div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800 text-xs text-amber-400/90 text-center">
                    {t('booking.noSlots')}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const isSel = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-all ${
                            isSel
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow'
                              : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500/50'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('common.back')}
              </button>
              <button
                disabled={!selectedTime}
                onClick={() => {
                  if (selectedTime) {
                    setErrorMsg(null);
                    setStep(4);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS & REVIEW */}
        {step === 4 && (
          <form onSubmit={handleSubmitBooking} className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="font-serif text-xl font-bold text-amber-100 mb-1">
                {t('booking.step4')}
              </h3>
              <p className="text-stone-400 text-xs">{t('booking.bookingSummary')}</p>
            </div>

            {/* Summary Box */}
            <div className="bg-stone-900 border border-amber-500/20 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block">{t('common.service')}</span>
                <span className="font-bold text-amber-300">{selectedService?.name}</span>
              </div>
              <div>
                <span className="text-stone-400 block">{t('common.barber')}</span>
                <span className="font-bold text-stone-200">
                  {isAnyBarber ? t('booking.anyBarber') : selectedBarber?.profile?.full_name}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">{t('common.date')}</span>
                <span className="font-mono font-bold text-stone-200">{selectedDate}</span>
              </div>
              <div>
                <span className="text-stone-400 block">{t('common.time')}</span>
                <span className="font-mono font-bold text-amber-400">{selectedTime}</span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('booking.customerName')} *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('booking.customerPhone')} *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="+212 6 00 00 00 00"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300">{t('booking.customerEmail')} *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300">{t('common.notes')}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none resize-none"
                  placeholder="Any special requests or haircut details..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-2"
              >
                {loading ? t('booking.submitting') : t('booking.confirmBooking')}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
