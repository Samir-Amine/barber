import React, { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { NotificationCenter } from '../ui/NotificationCenter';
import { Scissors, Calendar, User, LogOut, Menu, X, Shield, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const { t } = useTranslation();
  const { user, role, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getDashboardRoute = () => {
    if (role === 'owner') return '/owner/dashboard';
    if (role === 'barber') return '/barber/dashboard';
    return '/account/dashboard';
  };

  const navLinks = [
    { route: '/', label: t('nav.home') },
    { route: '/services', label: t('nav.services') },
    { route: '/about', label: t('nav.about') },
    { route: '/how-to-use', label: t('nav.howToUse') },
    { route: '/terms', label: t('nav.terms') },
    { route: '/contact', label: t('nav.contact') },
  ];

  const handleNav = (route: string) => {
    navigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-amber-500/20 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 transform -rotate-45" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-amber-100 group-hover:text-amber-400 transition-colors">
              ATLAS BLADE
            </span>
            <span className="block text-[10px] text-amber-500/80 tracking-widest uppercase font-mono">
              BARBERSHOP
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => handleNav(link.route)}
                className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                  isActive ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-amber-500' : 'text-stone-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Selector */}
          <LanguageSelector compact />

          {/* Book CTA */}
          <button
            onClick={() => handleNav('/booking')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs tracking-wide uppercase shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            {t('common.bookNow')}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 ltr:ml-2 rtl:mr-2">
              <NotificationCenter />
              <button
                onClick={() => handleNav(getDashboardRoute())}
                className="px-3 py-1.5 rounded-lg bg-stone-900 border border-amber-500/30 text-amber-300 hover:border-amber-400 text-xs font-medium flex items-center gap-1.5"
                title={t('common.dashboard')}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{role}</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors"
                title={t('common.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNav('/login')}
              className="px-3 py-2 text-xs font-semibold text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <User className="w-4 h-4" />
              {t('common.login')}
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSelector compact />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-stone-300 hover:text-amber-400 hover:bg-stone-900 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-stone-950 border-b border-amber-500/20 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.route}
                onClick={() => handleNav(link.route)}
                className={`text-left rtl:text-right px-3 py-2 rounded-lg text-sm font-medium ${
                  currentRoute === link.route
                    ? 'bg-amber-500/10 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-800 space-y-2">
            <button
              onClick={() => handleNav('/booking')}
              className="w-full py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs uppercase flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {t('common.bookNow')}
            </button>

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleNav(getDashboardRoute())}
                  className="px-3 py-2 rounded-lg bg-stone-900 text-amber-300 text-xs font-semibold flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  {t('common.dashboard')} ({role})
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-rose-400 hover:bg-stone-900 rounded-lg text-xs flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('/login')}
                className="w-full py-2 rounded-lg border border-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-900 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('common.login')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
