import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Appointment } from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import {
  Calendar,
  Clock,
  Scissors,
  User,
  XCircle,
  Plus,
  MessageSquare,
  Bell,
  CheckCircle2
} from 'lucide-react';

interface CustomerDashboardViewProps {
  navigate: (route: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);

  const fetchCustomerAppointments = async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*, service:services(*), barber:barbers(*, profile:profiles(*))')
        .eq('customer_id', user.id)
        .order('appointment_date', { ascending: false });

      if (data) {
        setAppointments(data as any);
      }
    } catch (err) {
      console.error('Error fetching customer appointments:', err);
    } fontally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerAppointments();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">{t('common.statuses.confirmed')}</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase">{t('common.statuses.completed')}</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase">{t('common.statuses.cancelled')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">{t('common.statuses.pending')}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Banner */}
      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-amber-100">
            {t('dashboard.customerTitle')}
          </h1>
          <p className="text-stone-400 text-xs">
            Welcome back, {profile?.full_name || 'Customer'}. Manage your bookings and preferences.
          </p>
        </div>

        <button
          onClick={() => navigate('/booking')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('common.bookNow')}
        </button>
      </div>

      {/* Appointments History List */}
      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6">
        <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          My Appointments
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">{t('common.loading')}</div>
        ) : appointments.length === 0 ? (
          <EmptyState
            message={t('dashboard.noAppointments')}
            action={{
              label: t('common.bookNow'),
              onClick: () => navigate('/booking'),
            }}
          />
        ) : (
          <div className="divide-y divide-stone-900 overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead>
                <tr className="text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800">
                  <th className="pb-3">{t('common.service')}</th>
                  <th className="pb-3">{t('common.barber')}</th>
                  <th className="pb-3">{t('common.date')} & {t('common.time')}</th>
                  <th className="pb-3">{t('common.price')}</th>
                  <th className="pb-3">{t('common.status')}</th>
                  <th className="pb-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-4 font-medium text-stone-200">
                      {app.service?.name || 'Haircut Service'}
                    </td>
                    <td className="py-4 text-stone-300">
                      {app.barber?.profile?.full_name || 'Barber'}
                    </td>
                    <td className="py-4 font-mono text-stone-300">
                      {app.appointment_date} @ {(app.start_time || '').substring(0, 5)}
                    </td>
                    <td className="py-4 font-mono font-bold text-amber-300">
                      {app.total_price || app.service?.price || 0} {t('common.dh')}
                    </td>
                    <td className="py-4">{getStatusBadge(app.status)}</td>
                    <td className="py-4">
                      {app.status === 'pending' && (
                        <button
                          onClick={() => setCancelModalId(app.id)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t('common.cancel')}
                        </button>
                      )}
                      {app.status === 'cancelled' && app.cancellation_reason && (
                        <span className="text-[10px] text-stone-500 block max-w-xs truncate" title={app.cancellation_reason}>
                          Reason: {app.cancellation_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancelModalId && (
        <CancelAppointmentModal
          appointmentId={cancelModalId}
          onClose={() => setCancelModalId(null)}
          onSuccess={() => {
            setCancelModalId(null);
            fetchCustomerAppointments();
          }}
        />
      )}
    </div>
  );
};