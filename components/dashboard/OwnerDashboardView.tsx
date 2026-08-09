import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import {
  Appointment,
  Service,
  Barber,
  ContactMessage,
  AutomationLog,
  Setting,
  BusinessHours
} from '../../types/database';
import { EmptyState } from '../ui/EmptyState';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  MessageSquare,
  Mail,
  Bell,
  Clock,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  Save,
  Shield,
  Eye,
  Send
} from 'lucide-react';

interface OwnerDashboardViewProps {
  navigate: (route: string) => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'appointments' | 'calendar' | 'services' | 'barbers' | 'contact_messages' | 'settings' | 'automation'
  >('overview');

  const [loading, setLoading] = useState(true);

  // Collections
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<(Barber & { profile?: any })[]>([]);
  const [contactMsgs, setContactMsgs] = useState<ContactMessage[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);

  // Cancel Modal State
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);

  // Filter / Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Service Edit / Add State
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Barber Add State
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [showBarberModal, setShowBarberModal] = useState(false);

  // Settings Form State
  const [settingPhone, setSettingPhone] = useState('');
  const [settingEmail, setSettingEmail] = useState('');
  const [settingAddress, setSettingAddress] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const loadOwnerData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Appointments
      const { data: appData } = await supabase
        .from('appointments')
        .select('*, customer:customers(*, profile:profiles(*)), barber:barbers(*, profile:profiles(*)), service:services(*)')
        .order('appointment_date', { ascending: false });

      if (appData) setAppointments(appData as any);

      // 2. Services
      const { data: sData } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (sData) setServices(sData as Service[]);

      // 3. Barbers
      const { data: bData } = await supabase
        .from('barbers')
        .select('*, profile:profiles(*)');

      if (bData) setBarbers(bData as any);

      // 4. Contact Messages
      const { data: cData } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (cData) setContactMsgs(cData as ContactMessage[]);

      // 5. Automation Logs
      const { data: aData } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (aData) setAutomationLogs(aData as AutomationLog[]);

      // 6. Settings
      const { data: setArr } = await supabase.from('settings').select('*');
      if (setArr) {
        setSettings(setArr as Setting[]);
        const map: Record<string, string> = {};
        setArr.forEach((s) => (map[s.key] = s.value));
        if (map.phone) setSettingPhone(map.phone);
        if (map.email) setSettingEmail(map.email);
        if (map.address) setSettingAddress(map.address);
      }
    } catch (err) {
      console.error('Error loading owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [user]);

  // RPC Appointment Actions
  const handleConfirmAppointment = async (appId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc('confirm_appointment', { p_appointment_id: appId });
      if (error) {
        await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appId);
      }

      // Automation Event
      fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'confirm',
          record_id: appId,
          actor: { id: user?.id || 'owner', role: 'owner' },
        }),
      }).catch((e) => console.warn('Automation notice:', e));

      loadOwnerData();
    } catch (err) {
      console.error('Confirm error:', err);
    }
  };

  const handleCompleteAppointment = async (appId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc('complete_appointment', { p_appointment_id: appId });
      if (error) {
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', appId);
      }

      fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'complete',
          record_id: appId,
          actor: { id: user?.id || 'owner', role: 'owner' },
        }),
      }).catch((e) => console.warn('Automation notice:', e));

      loadOwnerData();
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  // Service Save / Delete
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !supabase) return;

    try {
      if (editingService.id) {
        await supabase.from('services').update({
          name: editingService.name,
          description: editingService.description,
          price: Number(editingService.price),
          duration_minutes: Number(editingService.duration_minutes),
          is_active: editingService.is_active ?? true,
          image_url: editingService.image_url || null,
        }).eq('id', editingService.id);
      } else {
        await supabase.from('services').insert({
          name: editingService.name,
          description: editingService.description,
          price: Number(editingService.price) || 100,
          duration_minutes: Number(editingService.duration_minutes) || 30,
          is_active: true,
          display_order: services.length + 1,
          image_url: editingService.image_url || null,
        });
      }

      setShowServiceModal(false);
      setEditingService(null);
      loadOwnerData();
    } catch (err) {
      console.error('Error saving service:', err);
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    if (!supabase) return;
    await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
    loadOwnerData();
  };

  // Barber Add / Toggle Active
  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberEmail || !supabase) return;

    try {
      const tempId = typeof crypto !== 'undefined' ? crypto.randomUUID() : `prof_${Date.now()}`;
      await supabase.from('profiles').insert({
        id: tempId,
        email: newBarberEmail,
        full_name: newBarberName || 'Barber',
        phone: newBarberPhone || null,
        role: 'barber',
      });

      await supabase.from('barbers').insert({
        profile_id: tempId,
        is_active: true,
      });

      setShowBarberModal(false);
      setNewBarberEmail('');
      setNewBarberName('');
      setNewBarberPhone('');
      loadOwnerData();
    } catch (err) {
      console.error('Error adding barber:', err);
    }
  };

  const handleToggleBarberActive = async (barber: Barber) => {
    if (!supabase) return;
    await supabase.from('barbers').update({ is_active: !barber.is_active }).eq('id', barber.id);
    loadOwnerData();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSavingSettings(true);
    try {
      const updates = [
        { key: 'phone', value: settingPhone, description: 'Shop phone' },
        { key: 'email', value: settingEmail, description: 'Shop email' },
        { key: 'address', value: settingAddress, description: 'Shop address' },
      ];

      for (const item of updates) {
        await supabase.from('settings').upsert({
          key: item.key,
          value: item.value,
          description: item.description,
          updated_at: new Date().toISOString(),
        });
      }

      loadOwnerData();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Calculate Real Dashboard Stats from DB
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysApps = appointments.filter((a) => a.appointment_date === todayStr);
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedTodayCount = todaysApps.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const custName = a.customer?.profile?.full_name?.toLowerCase() || '';
    const barbName = a.barber?.profile?.full_name?.toLowerCase() || '';
    const matchesSearch = custName.includes(searchTerm.toLowerCase()) || barbName.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="font-serif text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            {t('dashboard.ownerTitle')}
          </h1>
          <p className="text-stone-400 text-xs">
            Atlas Blade Business Management Console
          </p>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/80 p-1.5 rounded-xl border border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            {t('dashboard.overview')}
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'appointments' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('dashboard.appointments')}
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-stone-950 text-[10px] font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'services' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            {t('dashboard.services')}
          </button>
          <button
            onClick={() => setActiveTab('barbers')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'barbers' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {t('dashboard.barbers')}
          </button>
          <button
            onClick={() => setActiveTab('contact_messages')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'contact_messages' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            {t('dashboard.contactMessages')}
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'automation' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t('dashboard.automation')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {t('dashboard.settings')}
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-stone-400">{t('dashboard.stats.todaysAppointments')}</span>
              <p className="font-mono text-3xl font-bold text-amber-300">{todaysApps.length}</p>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-stone-400">{t('dashboard.stats.pending')}</span>
              <p className="font-mono text-3xl font-bold text-amber-400">{pendingCount}</p>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-stone-400">{t('dashboard.stats.confirmed')}</span>
              <p className="font-mono text-3xl font-bold text-emerald-400">{confirmedCount}</p>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-stone-400">{t('dashboard.stats.totalBarbers')}</span>
              <p className="font-mono text-3xl font-bold text-stone-100">{barbers.length}</p>
            </div>
          </div>

          {/* Today's Appointments Quick Access */}
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-amber-100">
                Today's Schedule ({todayStr})
              </h3>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs text-amber-400 hover:underline"
              >
                View All Appointments →
              </button>
            </div>

            {todaysApps.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No appointments scheduled for today.</p>
            ) : (
              <div className="divide-y divide-stone-900 text-xs">
                {todaysApps.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-200">{a.customer?.profile?.full_name}</span>
                      <span className="text-stone-400 text-[11px] block">{a.service?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-amber-300">{a.start_time?.substring(0, 5)}</span>
                      <span className="block text-[10px] text-stone-500 uppercase font-bold">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS MANAGEMENT */}
      {activeTab === 'appointments' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 rtl:right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer or barber..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl ltr:pl-9 rtl:pr-9 pr-4 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    statusFilter === st ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">{t('common.loading')}</div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState message={t('dashboard.noAppointments')} />
          ) : (
            <div className="overflow-x-auto divide-y divide-stone-900">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead>
                  <tr className="text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800">
                    <th className="pb-3">{t('common.customer')}</th>
                    <th className="pb-3">{t('common.barber')}</th>
                    <th className="pb-3">{t('common.service')}</th>
                    <th className="pb-3">{t('common.date')} & {t('common.time')}</th>
                    <th className="pb-3">{t('common.status')}</th>
                    <th className="pb-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-900">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-4 font-medium text-stone-200">
                        {app.customer?.profile?.full_name || 'Customer'}
                        <span className="block text-[10px] text-stone-500 font-mono">
                          {app.customer?.profile?.phone}
                        </span>
                      </td>
                      <td className="py-4 text-stone-300">
                        {app.barber?.profile?.full_name || 'Barber'}
                      </td>
                      <td className="py-4 text-stone-300">
                        {app.service?.name}
                      </td>
                      <td className="py-4 font-mono text-stone-300">
                        {app.appointment_date} @ {app.start_time?.substring(0, 5)}
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
                      <td className="py-4 flex items-center gap-1.5">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleConfirmAppointment(app.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t('common.confirm')}
                          </button>
                        )}
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

      {/* TAB 3: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              Service Catalog
            </h2>
            <button
              onClick={() => {
                setEditingService({ name: '', description: '', price: 100, duration_minutes: 30, is_active: true });
                setShowServiceModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.addService')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                  svc.is_active ? 'bg-stone-900 border-stone-800' : 'bg-stone-900/40 border-stone-800/50 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-200 text-sm">{svc.name}</h3>
                    <span className="font-mono font-bold text-amber-300 text-sm">{svc.price} DH</span>
                  </div>
                  {svc.description && <p className="text-stone-400 text-xs line-clamp-2">{svc.description}</p>}
                  <span className="text-[11px] text-stone-500 block font-mono">
                    Duration: {svc.duration_minutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                  <button
                    onClick={() => handleToggleServiceActive(svc)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      svc.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {svc.is_active ? t('dashboard.active') : t('dashboard.inactive')}
                  </button>

                  <button
                    onClick={() => {
                      setEditingService(svc);
                      setShowServiceModal(true);
                    }}
                    className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BARBERS MANAGEMENT */}
      {activeTab === 'barbers' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Barbers Roster
            </h2>
            <button
              onClick={() => setShowBarberModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.addBarber')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const name = barber.profile?.full_name || 'Barber';
              return (
                <div key={barber.id} className="p-5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-800 text-amber-400 font-bold text-xs flex items-center justify-center">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-200 text-xs">{name}</h4>
                      <p className="text-[10px] text-stone-500 font-mono">{barber.profile?.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBarberActive(barber)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      barber.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {barber.is_active ? t('dashboard.active') : t('dashboard.inactive')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CONTACT MESSAGES */}
      {activeTab === 'contact_messages' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            Contact Form Submissions
          </h2>

          {contactMsgs.length === 0 ? (
            <EmptyState message={t('contact.noContactMessages')} />
          ) : (
            <div className="divide-y divide-stone-900 text-xs">
              {contactMsgs.map((msg) => (
                <div key={msg.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-200">{msg.name} ({msg.email})</span>
                    <span className="font-mono text-[10px] text-stone-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-semibold text-amber-300">Subject: {msg.subject}</p>
                  <p className="text-stone-400 leading-relaxed bg-stone-900 p-3 rounded-lg border border-stone-800">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUTOMATION LOGS */}
      {activeTab === 'automation' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Make.com Automation Activity Logs
          </h2>

          {automationLogs.length === 0 ? (
            <EmptyState message={t('dashboard.noAutomationLogs')} />
          ) : (
            <div className="divide-y divide-stone-900 font-mono text-xs overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead>
                  <tr className="text-stone-500 uppercase text-[10px] border-b border-stone-800">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Entity</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-900">
                  {automationLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 text-stone-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="py-2.5 text-amber-300 font-bold">{log.entity}</td>
                      <td className="py-2.5 text-stone-200">{log.action}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          log.response_status === 200 || !log.error_message
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {log.response_status || 'Handled'}
                        </span>
                      </td>
                      <td className="py-2.5 text-stone-500 text-[10px]">{log.error_message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 max-w-2xl animate-in fade-in">
          <h2 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Business Contact Settings
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Shop Phone Number</label>
              <input
                type="text"
                value={settingPhone}
                onChange={(e) => setSettingPhone(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Shop Email</label>
              <input
                type="email"
                value={settingEmail}
                onChange={(e) => setSettingEmail(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-300">Shop Address</label>
              <input
                type="text"
                value={settingAddress}
                onChange={(e) => setSettingAddress(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? t('common.loading') : t('dashboard.saveSettings')}
          </button>
        </form>
      )}

      {/* SERVICE EDIT MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveService} className="w-full max-w-md bg-stone-950 border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-100">
              {editingService?.id ? t('dashboard.editService') : t('dashboard.addService')}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService?.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService?.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1">Price (MAD)</label>
                  <input
                    type="number"
                    required
                    value={editingService?.price || 100}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    required
                    value={editingService?.duration_minutes || 30}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2 bg-stone-800 text-stone-300 text-xs rounded-xl font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded-xl"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BARBER ADD MODAL */}
      {showBarberModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleAddBarber} className="w-full max-w-md bg-stone-950 border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-100">{t('dashboard.addBarber')}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Barber Name</label>
                <input
                  type="text"
                  required
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  placeholder="Youssef El Amrani"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newBarberEmail}
                  onChange={(e) => setNewBarberEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  placeholder="youssef@atlasblade.ma"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newBarberPhone}
                  onChange={(e) => setNewBarberPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  placeholder="+212 6 00 11 22 33"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBarberModal(false)}
                className="px-4 py-2 bg-stone-800 text-stone-300 text-xs rounded-xl font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded-xl"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {cancelModalId && (
        <CancelAppointmentModal
          appointmentId={cancelModalId}
          onClose={() => setCancelModalId(null)}
          onSuccess={() => {
            setCancelModalId(null);
            loadOwnerData();
          }}
        />
      )}
    </div>
  );
};
