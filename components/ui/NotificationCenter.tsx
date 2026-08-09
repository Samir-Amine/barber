import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n';
import { Notification } from '../../types/database';
import { Bell, Check, CheckCheck, Info } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !supabase) return;

    fetchNotifications();

    // Supabase Realtime Subscription for incoming notifications
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!supabase) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user || !supabase) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-300 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors"
        title={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-amber-500/30 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
            <h4 className="font-semibold text-stone-100 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              {t('notifications.title')}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-800">
            {loading ? (
              <div className="p-4 text-center text-xs text-stone-400">{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 flex flex-col items-center">
                <Info className="w-6 h-6 text-stone-600 mb-2" />
                {t('notifications.noNotifications')}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors flex items-start justify-between gap-2 ${
                    !n.is_read ? 'bg-amber-500/10 border-l-2 border-amber-500' : 'bg-stone-900/50'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-stone-200">{n.title}</p>
                    <p className="text-stone-400 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-stone-500">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-amber-400 hover:text-amber-300 p-1"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
