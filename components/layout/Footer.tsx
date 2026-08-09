import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { LanguageSelector } from '../ui/LanguageSelector';
import { Scissors, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const [socials, setSocials] = useState<{ instagram?: string; facebook?: string; whatsapp?: string }>({});
  const [contactInfo, setContactInfo] = useState<{ phone?: string; email?: string; address?: string }>({
    phone: '+212 5 22 00 11 22',
    email: 'contact@atlasblade.ma',
    address: 'Avenue Mohammed V, Casablanca, Morocco',
  });

  useEffect(() => {
    async function loadFooterSettings() {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('settings').select('*');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((s) => (map[s.key] = s.value));

          if (map.phone) setContactInfo((prev) => ({ ...prev, phone: map.phone }));
          if (map.email) setContactInfo((prev) => ({ ...prev, email: map.email }));
          if (map.address) setContactInfo((prev) => ({ ...prev, address: map.address }));

          const soc: any = {};
          if (map.instagram_url) soc.instagram = map.instagram_url;
          if (map.facebook_url) soc.facebook = map.facebook_url;
          if (map.whatsapp) soc.whatsapp = map.whatsapp;
          setSocials(soc);
        }
      } catch (err) {
        // Fallback default info
      }
    }
    loadFooterSettings();
  }, []);

  return (
    <footer className="bg-stone-950 border-t border-amber-500/20 text-stone-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wider text-amber-100">
              ATLAS BLADE
            </span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            {t('common.tagline')}
          </p>
          <div className="pt-2">
            <LanguageSelector />
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div>
          <h4 className="font-serif text-stone-200 font-bold mb-3 uppercase tracking-wider text-xs border-b border-amber-500/30 pb-1 inline-block">
            {t('nav.home')} & Links
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => navigate('/')} className="hover:text-amber-400 transition-colors">
                {t('nav.home')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/services')} className="hover:text-amber-400 transition-colors">
                {t('nav.services')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/about')} className="hover:text-amber-400 transition-colors">
                {t('nav.about')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/how-to-use')} className="hover:text-amber-400 transition-colors">
                {t('nav.howToUse')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/terms')} className="hover:text-amber-400 transition-colors">
                {t('nav.terms')}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/contact')} className="hover:text-amber-400 transition-colors">
                {t('nav.contact')}
              </button>
            </li>
          </ul>
        </div>

        {/* Opening Hours */}
        <div>
          <h4 className="font-serif text-stone-200 font-bold mb-3 uppercase tracking-wider text-xs border-b border-amber-500/30 pb-1 inline-block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {t('common.hours')}
          </h4>
          <ul className="space-y-2 text-xs text-stone-300">
            <li className="flex justify-between">
              <span>Mon - Thu:</span>
              <span className="font-mono text-amber-300">09:00 - 21:00</span>
            </li>
            <li className="flex justify-between">
              <span>Friday:</span>
              <span className="font-mono text-amber-300">14:00 - 22:00</span>
            </li>
            <li className="flex justify-between">
              <span>Sat - Sun:</span>
              <span className="font-mono text-amber-300">09:00 - 22:00</span>
            </li>
          </ul>
        </div>

        {/* Shop Location & Contact */}
        <div>
          <h4 className="font-serif text-stone-200 font-bold mb-3 uppercase tracking-wider text-xs border-b border-amber-500/30 pb-1 inline-block">
            {t('contact.contactInfoTitle')}
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-300">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{contactInfo.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`tel:${contactInfo.phone}`} className="hover:text-amber-300 font-mono">
                {contactInfo.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href={`mailto:${contactInfo.email}`} className="hover:text-amber-300 font-mono">
                {contactInfo.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-900 bg-stone-950/80 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Atlas Blade Barbershop. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400">
            <button onClick={() => navigate('/terms')} className="hover:underline">
              {t('nav.terms')}
            </button>
            <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
              <ShieldCheck className="w-3.5 h-3.5" /> Supabase Protected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
