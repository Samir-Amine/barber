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

export const CancelAppointmentModal: React.FC<
  CancelAppointmentModalProps
> = ({ appointmentId, onClose, onSuccess }) => {
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
      if (!supabase) {
        throw new Error('Supabase client unavailable.');
      }

      // 1. Call cancel_appointment RPC
      const { error: rpcErr } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
        p_cancellation_reason: reason,
      });

      if (rpcErr) {
        throw new Error(
          rpcErr.message || 'Failed to cancel appointment.'
        );
      }

      // 2. Dispatch Make.com server-side automation event securely
      fetch('/api/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'appointment',
          action: 'cancel',
          record_id: appointmentId,
          actor: {
            id: user?.id || 'system',
            role: role || 'system',
          },
          data: {
            cancellation_reason: reason,
          },
        }),
      }).catch((e) => {
        console.warn('Automation notice:', e);
      });

      // 3. Notify parent that cancellation succeeded
      onSuccess();
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      setErrorMsg(err?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-800 bg-stone-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h3 className="font-serif text-lg font-bold text-amber-100">
              {t('dashboard.cancelReasonTitle')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-900 hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-stone-400">
          {t('common.reasonRequired')}. This reason will be recorded and sent
          to the customer.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCancel} className="mt-5 space-y-4">
          <div>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('dashboard.cancelReasonPlaceholder')}
              className="w-full resize-none rounded-xl border border-stone-800 bg-stone-900 p-3 text-xs text-stone-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-700"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold uppercase text-stone-100 transition-all hover:bg-rose-500 disabled:opacity-40"
            >
              {loading ? t('common.loading') : t('common.confirm')}
              <ShieldAlert className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
