import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getSupabaseEnv } from '../supabase/client';
import { Profile, UserRole } from '../../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  isConfigured: boolean;
  loginWithEmail: (email: string, password?: string) => Promise<{ error: any }>;
  signupWithEmail: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDemoProfile: (demoRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRoleState] = useState<UserRole | null>(null);

  const { url, anonKey } = getSupabaseEnv();
  const isConfigured = Boolean(url && anonKey && supabase);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // If profile record doesn't exist yet, derive fallback from user metadata
        setProfile({
          id: userId,
          role: 'customer',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          avatar_url: null,
          phone: null,
          email: user?.email || null,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Error loading profile:', err);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password?: string) => {
    if (!supabase) return { error: new Error('Supabase client is not configured.') };
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'password123',
    });
    setLoading(false);
    return { error };
  };

  const signupWithEmail = async (email: string, password: string, fullName: string, role: UserRole = 'customer') => {
    if (!supabase) return { error: new Error('Supabase client is not configured.') };
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (!error && data.user) {
      // Upsert profile in Supabase profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString(),
      });
    }

    setLoading(false);
    return { error };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setDemoRoleState(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const setDemoProfile = (role: UserRole) => {
    setDemoRoleState(role);
  };

  const activeRole: UserRole = demoRole || profile?.role || 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: activeRole,
        loading,
        isConfigured,
        loginWithEmail,
        signupWithEmail,
        logout,
        refreshProfile,
        setDemoProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
