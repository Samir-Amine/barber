import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { Service, Barber, BusinessHours } from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import {
  Scissors,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<(Barber & { profile?: any })[]>([]);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeContent() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        // Real Services query
        const { data: sData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(4);

        if (sData) setServices(sData as Service[]);

        // Real Barbers query
        const { data: bData } = await supabase
          .from('barbers')
          .select('*, profile:profiles(*)')
          .eq('is_active', true)
          .limit(4);

        if (bData) setBarbers(bData as any);

        // Real Business Hours query
        const { data: hData } = await supabase
          .from('business_hours')
          .select('*')
          .order('day_of_week', { ascending: true });

        if (hData) setHours(hData as BusinessHours[]);
      } catch (err) {
        console.error('Error loading homepage dynamic data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeContent();
  }, []);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-stone-950 text-stone-100 overflow-hidden border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 py-20 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs tracking-widest uppercase font-mono shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {t('common.brandName')} • Morocco
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-stone-100 max-w-4xl mx-auto leading-tight">
            {t('home.heroTitle')}
          </h1>

          <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/booking')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm tracking-wider uppercase shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Calendar className="w-4 h-4" />
              {t('home.ctaBook')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
            </button>

            <button
              onClick={() => navigate('/services')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 text-stone-200 font-semibold text-sm tracking-wider uppercase transition-all"
            >
              {t('home.ctaServices')}
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-amber-100">
            {t('home.servicesHeading')}
          </h2>
          <p className="text-stone-400 text-sm">{t('home.servicesSub')}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400 text-sm">{t('common.loading')}</div>
        ) : services.length === 0 ? (
          <EmptyState message={t('home.noServices')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-stone-950 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Scissors className="w-5 h-5 transform -rotate-45" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                    {svc.name}
                  </h3>
                  {svc.description && (
                    <p className="text-stone-400 text-xs leading-relaxed line-clamp-3">
                      {svc.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-900 flex items-center justify-between">
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {svc.duration_minutes} {t('common.min')}
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-base">
                    {svc.price} {t('common.dh')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase text-amber-400 hover:text-amber-300 tracking-wider"
          >
            {t('home.ctaServices')}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-amber-100">
            {t('home.barbersHeading')}
          </h2>
          <p className="text-stone-400 text-sm">{t('home.barbersSub')}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400 text-sm">{t('common.loading')}</div>
        ) : barbers.length === 0 ? (
          <EmptyState message={t('home.noBarbers')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {barbers.map((barber) => {
              const name = barber.profile?.full_name || 'Barber';
              return (
                <div
                  key={barber.id}
                  className="bg-stone-950 border border-stone-800 rounded-2xl p-6 text-center space-y-4 hover:border-amber-500/40 transition-all"
                >
                  {barber.photo_url ? (
                    <img
                      src={barber.photo_url}
                      alt={name}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-amber-500/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-stone-800 text-amber-400 font-bold text-xl mx-auto flex items-center justify-center border-2 border-amber-500/20">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-100">{name}</h3>
                    {barber.specialties && barber.specialties.length > 0 && (
                      <p className="text-xs text-amber-400/90 mt-1">
                        {barber.specialties.join(' • ')}
                      </p>
                    )}
                  </div>

                  {barber.bio && (
                    <p className="text-stone-400 text-xs line-clamp-3 leading-relaxed">
                      {barber.bio}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="bg-stone-950 border-y border-stone-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-amber-100">
              {t('home.whyChooseTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-100">{t('home.why1Title')}</h3>
              <p className="text-stone-400 text-xs leading-relaxed">{t('home.why1Desc')}</p>
            </div>

            <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-100">{t('home.why2Title')}</h3>
              <p className="text-stone-400 text-xs leading-relaxed">{t('home.why2Desc')}</p>
            </div>

            <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-100">{t('home.why3Title')}</h3>
              <p className="text-stone-400 text-xs leading-relaxed">{t('home.why3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Hours & Location Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hours */}
        <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            <h3 className="font-serif text-xl font-bold text-stone-100">
              {t('home.openingHoursTitle')}
            </h3>
          </div>

          {hours.length === 0 ? (
            <p className="text-stone-400 text-xs">{t('home.noHours')}</p>
          ) : (
            <div className="divide-y divide-stone-900 text-xs">
              {hours.map((h) => (
                <div key={h.id} className="py-2.5 flex justify-between items-center">
                  <span className="font-medium text-stone-300">{dayNames[h.day_of_week]}</span>
                  {h.is_closed ? (
                    <span className="text-rose-400 font-semibold">{t('home.closed')}</span>
                  ) : (
                    <span className="font-mono text-amber-300">
                      {h.open_time.substring(0, 5)} - {h.close_time.substring(0, 5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location & Booking Banner */}
        <div className="bg-gradient-to-br from-amber-500/15 to-stone-950 border border-amber-500/30 rounded-2xl p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-amber-100">
              {t('home.contactTitle')}
            </h3>
            <p className="text-stone-300 text-xs leading-relaxed">
              Visit Atlas Blade for a premier grooming experience. Book online to reserve your spot without waiting in line.
            </p>
            <div className="space-y-2 text-xs text-stone-300 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Avenue Mohammed V, Casablanca, Morocco</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="font-mono">+212 5 22 00 11 22</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/booking')}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase shadow-lg hover:bg-amber-400 transition-all"
          >
            {t('home.ctaBook')}
          </button>
        </div>
      </section>
    </div>
  );
};
