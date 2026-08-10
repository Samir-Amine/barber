import React, { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthContext';
import { UserRole } from '../../types/database';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  navigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { t } = useTranslation();

  const {
    loginWithEmail,
    signupWithEmail,
    role,
    setDemoProfile,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectByRole = (userRole: UserRole | null | undefined) => {
    if (userRole === 'owner') {
      navigate('/owner/dashboard');
      return;
    }

    if (userRole === 'barber') {
      navigate('/barber/dashboard');
      return;
    }

    navigate('/account/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await loginWithEmail(email, password);

        if (error) {
          throw error;
        }

        /*
         * IMPORTANT:
         * On logi we use the authenticated user's real role.
         * We do NOT let the registration form determine the role.
         */
        redirectByRole(role);
      } else {
        /*
         * NEW USERS ARE ALWAYS CUSTOMERS.
         *
         * There is intentionally no role selector in the registration form.
         * Barbers and owners must be assigned by the admin.
         */
        const { error } = await signupWithEmail(
          email,
          password,
          fullName,
          'customer'
        );

        if (error) {
          throw error;
        }

        /*
         * A newly registered account is a customer.
         */
        navigate('/account/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);

      setErrorMsg(
        err?.message ||
          t('common.error') ||
          'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestPortalSwitch = (testRole: UserRole) => {
    setDemoProfile(testRole);

    redirectByRole(testRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-stone-950">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-amber-100">
            {mode === 'login'
              ? t('common.login')
              : t('common.register')}
          </h1>

          <p className="mt-2 text-xs text-stone-400">
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">
                  Full Name
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Mohamed Alami"
                />

                <p className="text-[10px] text-stone-500">
                  New accounts are registered as customers. An administrator
                  can assign barber access when needed.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">
                {t('contact.emailLabel')}
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                placeholder="user@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-100 text-sm focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
            >
              {loading
                ? t('common.loading')
                : mode === 'login'
                  ? t('common.login')
                  : t('common.register')}

              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>

          <div className="border-t border-stone-900 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>

          {/* Development / testing shortcuts */}
          
        </div>
      </div>
    </div>
  );
};
