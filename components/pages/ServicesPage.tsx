import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { Service } from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import { Scissors, Clock, ArrowRight } from 'lucide-react';

interface ServicesPageProps {
  navigate: (route: string, serviceId?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (data) setServices(data as Service[]);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
          {t('services.title')}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">
          {t('services.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 text-sm">{t('common.loading')}</div>
      ) : services.length === 0 ? (
        <EmptyState message={t('services.noServicesAvailable')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-stone-950 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1 group"
            >
              <div className="space-y-4">
                {svc.image_url && (
                  <img
                    src={svc.image_url}
                    alt={svc.name}
                    className="w-full h-44 object-cover rounded-xl border border-stone-800"
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                      {svc.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {svc.duration_minutes} {t('common.min')}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-lg shrink-0">
                    {svc.price} {t('common.dh')}
                  </span>
                </div>

                {svc.description && (
                  <p className="text-stone-400 text-xs leading-relaxed">
                    {svc.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/booking', svc.id)}
                className="w-full py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg shadow-amber-500/10"
              >
                {t('services.bookThis')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
