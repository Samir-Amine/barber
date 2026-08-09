import React from 'react';
import { useTranslation, SupportedLocale } from '../../lib/i18n';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { locale, setLocale } = useTranslation();

  const options: { code: SupportedLocale; label: string; short: string }[] = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'ar-MA', label: 'Darija (المغربية)', short: 'MA' },
  ];

  return (
    <div className="inline-flex items-center gap-1 bg-stone-900/80 border border-amber-500/20 rounded-lg p-1 text-xs">
      {!compact && <Globe className="w-3.5 h-3.5 text-amber-400 mx-1" />}
      {options.map((opt) => {
        const isActive = locale === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLocale(opt.code)}
            className={`px-2 py-1 rounded transition-all font-medium ${
              isActive
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-amber-300 hover:bg-stone-800'
            }`}
            title={opt.label}
          >
            {compact ? opt.short : opt.short}
          </button>
        );
      })}
    </div>
  );
};
