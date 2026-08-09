import React, { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { UserRole } from '../../types/database';
import { Scissors, Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  navigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const { loginWithEmail, signupWithEmail, role, isConfigured, setDemoProfile } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signupWithEmail(email, password, fullName, selectedRole);
        if (error) throw error;
      }

      // Redirect to appropriate portal based on role
      if (selectedRole === 'owner') navigate('/owner/dashboard');
      else if (selectedRole === 'barber') navigate('/barber/dashboard');
      else navigate('/account/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPortalSwitch = (testRole: UserRole) => {
    setDemoProfile(testRole);
    if (testRole === 'owner') navigate('/owner/dashboard');
    else if (testRole === 'barber') navigate('/barber/dashboard');
    else navigate('/account/dashboard');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 mx-auto flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
          <Scissors className="w-6 h-6 transform -rotate-45" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-amber-100">
          {mode === 'login' ? t('common.login') : t('common.register')}
        </h1>
        <p className="text-stone-400 text-xs">
          Access your Atlas Blade portal and manage appointments.
        </p>
      </div>

      <div className="bg-stone-950 border border-amber-500/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Mohamed Alami"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Account Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="customer">{t('common.roles.customer')}</option>
                  <option value="barber">{t('common.roles.barber')}</option>
                  <option value="owner">{t('common.roles.owner')}</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300">{t('contact.emailLabel')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
          >
            {loading ? t('common.loading') : mode === 'login' ? t('common.login') : t('common.register')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>

        <div className="border-t border-stone-900 pt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-amber-400 hover:underline"
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>

        {/* Quick Portal Access Shortcuts for seamless browsing */}
        <div className="border-t border-stone-900 pt-4 space-y-2">
          <p className="text-[11px] text-stone-400 text-center font-mono">Quick Access Portals:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTestPortalSwitch('owner')}
              className="py-1.5 px-2 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-[10px] text-amber-300 font-semibold text-center"
            >
              Owner Portal
            </button>
            <button
              onClick={() => handleTestPortalSwitch('barber')}
              className="py-1.5 px-2 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-[10px] text-amber-300 font-semibold text-center"
            >
              Barber Portal
            </button>
            <button
              onClick={() => handleTestPortalSwitch('customer')}
              className="py-1.5 px-2 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-[10px] text-amber-300 font-semibold text-center"
            >
              Customer Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
