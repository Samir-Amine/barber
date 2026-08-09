import React, { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { cancellationSchema } from '../../lib/validations';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CancelAppointmentModalProps {
  appointmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  appointmentId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = cancellationSchema.safeParse({
      appointment_id: appointmentId,
      reason,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase client unavailable.');

      // 1. Call `cancel_appointment` RPC
      const { error: rpcErr } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
        p_reason: reason,
      });

      if (rpcErr) {
        console.warn('RPC cancel_appointment returned error, attempting direct table update:', rpcErr);
        const { error: updateErr } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: reason,
          })
          .eq('id', appointmentId);

        if (updateErr) {
          throw new Error(updateErr.message || 'Failed to cancel appointment.');
        }
      }

      // 2. Dispatch Make.com server-side automation event securely
      fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'cancel',
          record_id: appointmentId,
          actor: { id: user?.id || 'system', role },
          data: { cancellation_reason: reason },
        }),
      }).catch((e) => console.warn('Automation notice:', e));

      onSuccess();
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      setErrorMsg(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-950 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 ltr:right-4 rtl:left-4 p-1 text-stone-400 hover:text-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-amber-100">
            {t('dashboard.cancelReasonTitle')}
          </h3>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          {t('common.reasonRequired')}. This reason will be recorded and sent to the customer.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCancel} className="space-y-4">
          <div>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('dashboard.cancelReasonPlaceholder')}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 text-xs focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 disabled:opacity-40 text-stone-100 font-bold text-xs uppercase hover:bg-rose-500 transition-all flex items-center gap-1.5"
            >
              {loading ? t('common.loading') : t('common.confirm')}
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
