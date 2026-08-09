import React from 'react';
import { useTranslation } from '../../lib/i18n';
import { ShieldCheck, FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center font-bold">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
          {t('terms.title')}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">{t('terms.subtitle')}</p>
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-8 text-stone-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-amber-300">
            {t('terms.sec1Title')}
          </h2>
          <p className="text-xs text-stone-400">{t('terms.sec1Text')}</p>
        </section>

        <section className="space-y-2 border-t border-stone-900 pt-6">
          <h2 className="font-serif text-lg font-bold text-amber-300">
            {t('terms.sec2Title')}
          </h2>
          <p className="text-xs text-stone-400">{t('terms.sec2Text')}</p>
        </section>

        <section className="space-y-2 border-t border-stone-900 pt-6">
          <h2 className="font-serif text-lg font-bold text-amber-300">
            {t('terms.sec3Title')}
          </h2>
          <p className="text-xs text-stone-400">{t('terms.sec3Text')}</p>
        </section>

        <section className="space-y-2 border-t border-stone-900 pt-6">
          <h2 className="font-serif text-lg font-bold text-amber-300">
            {t('terms.sec4Title')}
          </h2>
          <p className="text-xs text-stone-400">{t('terms.sec4Text')}</p>
        </section>

        <section className="space-y-2 border-t border-stone-900 pt-6">
          <h2 className="font-serif text-lg font-bold text-amber-300">
            {t('terms.sec5Title')}
          </h2>
          <p className="text-xs text-stone-400">{t('terms.sec5Text')}</p>
        </section>
      </div>
    </div>
  );
};
