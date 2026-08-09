import React, { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { cancellationSchema } from '../../lib/validations';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

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
      const response = await fetch('/api/automation', {
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
            role,
          },

          data: {
            cancellation_reason: reason,
          },
        }),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        // Ignore empty/non-JSON response
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.error_message ||
            `Cancellation request failed (${response.status})`
        );
      }

      if (result && result.success === false) {
        throw new Error(
          result.error ||
            result.error_message ||
            'Failed to cancel appointment.'
        );
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error sending cancellation request:', err);

      setErrorMsg(
        err?.message ||
          t('common.error') ||
          'Failed to cancel appointment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-stone-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <h3 className="font-serif text-lg font-bold text-amber-100">
            {t('dashboard.cancelReasonTitle')}
          </h3>
        </div>

        <p className="mt-4 text-xs text-stone-400 leading-relaxed">
          {t('common.reasonRequired')}. This reason will be recorded and sent
          to the customer.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCancel} className="space-y-4 mt-5">
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
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 disabled:opacity-40"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 disabled:opacity-40 text-stone-100 font-bold text-xs uppercase hover:bg-rose-500 transition-all flex items-center gap-1.5"
            >
              {loading
                ? t('common.loading')
                : t('common.confirm')}

              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
