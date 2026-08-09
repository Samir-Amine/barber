import React from 'react';
import { useTranslation } from '../../lib/i18n';
import {
  Scissors,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface HowToUsePageProps {
  navigate: (route: string) => void;
}

export const HowToUsePage: React.FC<HowToUsePageProps> = ({ navigate }) => {
  const { t } = useTranslation();

  const steps = [
    { title: t('howToUse.step1Title'), desc: t('howToUse.step1Desc'), icon: <Scissors className="w-5 h-5" /> },
    { title: t('howToUse.step2Title'), desc: t('howToUse.step2Desc'), icon: <UserCheck className="w-5 h-5" /> },
    { title: t('howToUse.step3Title'), desc: t('howToUse.step3Desc'), icon: <Calendar className="w-5 h-5" /> },
    { title: t('howToUse.step4Title'), desc: t('howToUse.step4Desc'), icon: <Clock className="w-5 h-5" /> },
    { title: t('howToUse.step5Title'), desc: t('howToUse.step5Desc'), icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: t('howToUse.step6Title'), desc: t('howToUse.step6Desc'), icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
          {t('howToUse.title')}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">{t('howToUse.subtitle')}</p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-3 relative hover:border-amber-500/40 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              {step.icon}
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-100">{step.title}</h3>
            <p className="text-stone-400 text-xs leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Appointment Statuses Explanation */}
      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-8 space-y-6">
        <h2 className="font-serif text-2xl font-bold text-amber-100">
          {t('howToUse.statusesTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-stone-900 border border-amber-500/20 space-y-1">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
              {t('common.statuses.pending')}
            </span>
            <p className="text-stone-300 pt-1 leading-relaxed">{t('howToUse.pendingDesc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900 border border-emerald-500/20 space-y-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
              {t('common.statuses.confirmed')}
            </span>
            <p className="text-stone-300 pt-1 leading-relaxed">{t('howToUse.confirmedDesc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900 border border-blue-500/20 space-y-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
              {t('common.statuses.completed')}
            </span>
            <p className="text-stone-300 pt-1 leading-relaxed">{t('howToUse.completedDesc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900 border border-rose-500/20 space-y-1">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase text-[10px]">
              {t('common.statuses.cancelled')}
            </span>
            <p className="text-stone-300 pt-1 leading-relaxed">{t('howToUse.cancelledDesc')}</p>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-stone-100">
            {t('howToUse.cancellationPolicyTitle')}
          </h3>
          <p className="text-stone-300 text-xs leading-relaxed">
            {t('howToUse.cancellationPolicyText')}
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => navigate('/booking')}
          className="px-8 py-3.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase hover:bg-amber-400 transition-all inline-flex items-center gap-2"
        >
          {t('common.bookNow')}
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
