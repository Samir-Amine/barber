import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../lib/supabase/client';
import { Barber } from '../../types/database';
import { contactSchema } from '../../lib/validations';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [barbers, setBarbers] = useState<(Barber & { profile?: any })[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [recipientRole, setRecipientRole] = useState<'owner' | 'barber'>('owner');
  const [barberId, setBarberId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadBarbers() {
      if (!supabase) {
        setLoadingBarbers(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('barbers')
          .select('*, profile:profiles(*)')
          .eq('is_active', true);

        if (data) setBarbers(data as any);
      } catch (err) {
        console.error('Error fetching barbers for contact recipient:', err);
      } finally {
        setLoadingBarbers(false);
      }
    }
    loadBarbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = contactSchema.safeParse({
      name,
      email,
      phone,
      recipient_role: recipientRole,
      barber_id: recipientRole === 'barber' ? barberId || null : null,
      subject,
      message,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    try {
      if (!supabase) throw new Error('Supabase client unavailable.');

      const { data, error } = await supabase.from('contact_messages').insert({
        name,
        email,
        phone: phone || null,
        recipient_role: recipientRole,
        barber_id: recipientRole === 'barber' ? barberId || null : null,
        subject,
        message,
        is_read: false,
        is_replied: false,
      }).select('id').single();

      if (error) throw new Error(error.message);

      // Trigger Make.com Automation
      fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'contact_message',
          action: 'send',
          record_id: data?.id,
          data: { name, email, subject, recipient_role: recipientRole },
        }),
      }).catch((e) => console.warn('Automation notice:', e));

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting contact message:', err);
      setErrorMsg(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
          {t('contact.title')}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">{t('contact.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-6 space-y-6">
          <h3 className="font-serif text-xl font-bold text-amber-100 border-b border-stone-800 pb-3">
            {t('contact.contactInfoTitle')}
          </h3>

          <div className="space-y-4 text-xs text-stone-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-200">Address</p>
                <p className="text-stone-400">Avenue Mohammed V, Casablanca, Morocco</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-200">Phone</p>
                <p className="font-mono text-stone-400">+212 5 22 00 11 22</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-200">Email</p>
                <p className="font-mono text-stone-400">contact@atlasblade.ma</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{t('contact.successMessage')}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('contact.nameLabel')} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('contact.emailLabel')} *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('contact.phoneLabel')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">{t('contact.recipientLabel')} *</label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value as any)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="owner">{t('contact.recipientOwner')}</option>
                  <option value="barber">Specific Barber</option>
                </select>
              </div>

              {recipientRole === 'barber' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-300">Select Barber</label>
                  <select
                    value={barberId}
                    onChange={(e) => setBarberId(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select a Barber...</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.profile?.full_name || 'Barber'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300">{t('contact.subjectLabel')} *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300">{t('contact.messageLabel')} *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              {submitting ? t('contact.sending') : t('contact.sendButton')}
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
