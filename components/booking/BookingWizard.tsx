import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../lib/i18n';
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
  X
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
}

interface Barber {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  barbers: Barber[];
  onSuccess?: (bookingData: any) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen,
  onClose,
  services = [],
  barbers = [],
  onSuccess
}) => {
  const { t } = useTranslation();

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setNotes('');
    setError(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      setError(t('booking.errorFillFields') || 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        date: selectedDate,
        time: selectedTime,
        clientName,
        clientPhone,
        clientEmail,
        notes
      };

      if (onSuccess) {
        await onSuccess(payload);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || t('booking.errorGeneric') || 'Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/50">
          <div>
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-500" />
              {t('booking.title') || 'Book Appointment'}
            </h2>
            <p className="text-xs text-stone-400">
              {step === 1 && (t('booking.step1Sub') || 'Select a service')}
              {step === 2 && (t('booking.step2Sub') || 'Select your barber')}
              {step === 3 && (t('booking.step3Sub') || 'Choose date & time')}
              {step === 4 && (t('booking.step4Sub') || 'Enter your contact details')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!isSuccess && (
          <div className="grid grid-cols-4 border-b border-stone-800 text-center text-xs bg-stone-900/30">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`py-2.5 font-medium border-b-2 transition-colors ${
                  step === s
                    ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                    : step > s
                    ? 'border-stone-700 text-stone-300'
                    : 'border-transparent text-stone-600'
                }`}
              >
                {t('booking.step') || 'Step'} {s}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success View */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-stone-100">
                {t('booking.successTitle') || 'Booking Confirmed!'}
              </h3>
              <p className="text-sm text-stone-400 max-w-md mx-auto">
                {t('booking.successMessage') || 'Your appointment has been successfully scheduled. We look forward to seeing you!'}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('common.done') || 'Done'}
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Select Service */}
              {step === 1 && (
                <div className="space-y-3">
                  {services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <h4 className="font-semibold text-stone-100 text-sm">{service.name}</h4>
                          <p className="text-xs text-stone-400 flex items-center gap-2 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.duration} {t('common.mins') || 'mins'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-amber-500">${service.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Select Barber */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {barbers.map((barber) => {
                    const isSelected = selectedBarber?.id === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold overflow-hidden shrink-0">
                          {barber.avatar ? (
                            <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-100 text-sm">{barber.name}</h4>
                          {barber.role && <p className="text-xs text-stone-400">{barber.role}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 3: Select Date & Time */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {t('booking.selectDate') || 'Select Date'}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {t('booking.selectTime') || 'Select Time'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                      {timeSlots.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                                : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Client Info */}
              {step === 4 && (
                <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">{t('common.name')} *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">{t('common.phone')} *</label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-stone-300">{t('common.email')}</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-stone-300">{t('common.notes')}</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none resize-none"
                        placeholder={t('booking.notesPlaceholder') || 'Any special requests...'}
                      />
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        {!isSuccess && (
          <div className="p-4 border-t border-stone-800 bg-stone-900/50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('common.back') || 'Back'}
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedBarber) ||
                  (step === 3 && (!selectedDate || !selectedTime))
                }
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all ml-auto"
              >
                {t('common.next') || 'Next'}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="submit"
                form="booking-form"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition-all ml-auto"
              >
                {loading ? (t('common.loading') || 'Processing...') : (t('booking.confirmBooking') || 'Confirm Booking')}
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;