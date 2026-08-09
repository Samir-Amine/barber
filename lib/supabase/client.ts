import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable retrieval with fallback support for both Next.js and Vite conventions
export function getSupabaseEnv() {
  const url =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  const anonKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    console.warn('Supabase URL or Anon Key is missing in environment variables.');
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Convenience export for active client instance or null
export const supabase = getSupabaseClient();
