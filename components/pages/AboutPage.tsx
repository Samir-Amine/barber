import React from 'react';
import { useTranslation } from '../../lib/i18n';
import { Scissors, ShieldCheck, Award, HeartHandshake, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center font-bold">
          <Scissors className="w-6 h-6 transform -rotate-45" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
          {t('about.title')}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">{t('about.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-8 space-y-4">
          <h2 className="font-serif text-2xl font-bold text-amber-300">
            {t('about.storyHeading')}
          </h2>
          <p className="text-stone-300 text-sm leading-relaxed">
            {t('about.storyText')}
          </p>
        </div>

        <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-8 space-y-4">
          <h2 className="font-serif text-2xl font-bold text-amber-300">
            {t('about.philosophyHeading')}
          </h2>
          <p className="text-stone-300 text-sm leading-relaxed">
            {t('about.philosophyText')}
          </p>
        </div>
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-8 text-center space-y-6">
        <h3 className="font-serif text-2xl font-bold text-stone-100">
          {t('about.bookingCTA')}
        </h3>
        <button
          onClick={() => navigate('/booking')}
          className="px-8 py-3.5 bg-amber-500 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all inline-flex items-center gap-2"
        >
          {t('common.bookNow')}
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
