import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Appointment, Barber, BarberAvailability } from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldAlert,
  Save,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface BarberDashboardViewProps {
  navigate: (route: string) => void;
}

export const BarberDashboardView: React.FC<BarberDashboardViewProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'profile'>('appointments');
  const [barber, setBarber] = useState<Barber | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<BarberAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);

  // Profile Edit State
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchBarberData = async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch Barber record
      const { data: bData } = await supabase
        .from('barbers')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      let barbObj = bData as Barber;
      if (!barbObj) {
        // Create barber record if missing
        const { data: newB } = await supabase
          .from('barbers')
          .insert({ profile_id: user.id, is_active: true })
          .select('*')
          .single();
        barbObj = newB as Barber;
      }

      setBarber(barbObj);
      if (barbObj) {
        setBio(barbObj.bio || '');
        setSpecialties((barbObj.specialties || []).join(', '));
        setPhotoUrl(barbObj.photo_url || '');

        // Fetch Appointments for this barber
        const { data: appData } = await supabase
          .from('appointments')
          .select('*, customer:customers(*, profile:profiles(*)), service:services(*)')
          .eq('barber_id', barbObj.id)
          .order('appointment_date', { ascending: false });

        if (appData) setAppointments(appData as any);

        // Fetch Availability
        const { data: availData } = await supabase
          .from('barber_availability')
          .select('*')
          .eq('barber_id', barbObj.id)
          .order('day_of_week', { ascending: true });

        if (availData) setAvailabilities(availData as BarberAvailability[]);
      }
    } catch (err) {
      console.error('Error fetching barber data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarberData();
  }, [user]);

  const handleCompleteAppointment = async (appId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc('complete_appointment', {
        p_appointment_id: appId,
      });

      if (error) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appId);
      }

      fetchBarberData();
    } catch (err) {
      console.error('Error completing appointment:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber || !supabase) return;
    setSavingProfile(true);
    setMsg(null);

    try {
      const specArr = specialties.split(',').map((s) => s.trim()).filter(Boolean);
      await supabase
        .from('barbers')
        .update({
          bio,
          specialties: specArr,
          photo_url: photoUrl || null,
        })
        .eq('id', barber.id);

      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-amber-100">
            {t('dashboard.barberTitle')}
          </h1>
          <p className="text-stone-400 text-xs">
            Barber Portal for {profile?.full_name || 'Master Barber'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'appointments' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'availability' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300'
            }`}
          >
            My Availability
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'profile' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Assigned Appointments
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">{t('common.loading')}</div>
          ) : appointments.length === 0 ? (
            <EmptyState message={t('dashboard.noAppointments')} />
          ) : (
            <div className="divide-y divide-stone-900 overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead>
                  <tr className="text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800">
                    <th className="pb-3">{t('common.customer')}</th>
                    <th className="pb-3">{t('common.service')}</th>
                    <th className="pb-3">{t('common.date')} & {t('common.time')}</th>
                    <th className="pb-3">{t('common.status')}</th>
                    <th className="pb-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-900">
                  {appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-4 font-medium text-stone-200">
                        {app.customer?.profile?.full_name || 'Customer'}
                        <span className="block text-[10px] text-stone-500 font-mono">
                          {app.customer?.profile?.phone || ''}
                        </span>
                      </td>
                      <td className="py-4 text-stone-300">
                        {app.service?.name}
                      </td>
                      <td className="py-4 font-mono text-stone-300">
                        {app.appointment_date} @ {(app.start_time || '').substring(0, 5)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          app.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                          app.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          app.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {t(`common.statuses.${app.status}`)}
                        </span>
                      </td>
                      <td className="py-4 flex items-center gap-2">
                        {app.status === 'confirmed' && (
                          <button
                            onClick={() => handleCompleteAppointment(app.id)}
                            className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('common.complete')}
                          </button>
                        )}
                        {(app.status === 'pending' || app.status === 'confirmed') && (
                          <button
                            onClick={() => setCancelModalId(app.id)}
                            className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {t('common.cancel')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-amber-400" />
            Weekly Work Schedule
          </h2>

          <div className="space-y-4 max-w-2xl">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-200">{dayName}</span>
                <span className="font-mono text-amber-300">09:00 - 21:00</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                  Available
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            Barber Profile Details
          </h2>

          {msg && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              {msg}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Bio / Description</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Experienced master barber specializing in sharp fades and hot towel shaves..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Specialties (comma separated)</label>
              <input
                type="text"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="Skin Fade, Beard Sculpting, Hot Towel Shave"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 text-xs focus:border-amber-500 focus:outline-none"
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? t('common.loading') : t('common.save')}
          </button>
        </form>
      )}

      {cancelModalId && (
        <CancelAppointmentModal
          appointmentId={cancelModalId}
          onClose={() => setCancelModalId(null)}
          onSuccess={() => {
            setCancelModalId(null);
            fetchBarberData();
          }}
        />
      )}
    </div>
  );
};