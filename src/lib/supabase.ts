import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

export let supabase: SupabaseClient | null = null;
export const PROFILE_AVATARS_BUCKET = 'profile-avatars';
export const supabaseConfigurationError = isSupabaseConfigured ? null : 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.';

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Supabase client initialization warning:', error);
  }
}

// Local Storage Keys for offline/demo resilience
export const STORAGE_KEYS = {
  AUTH_USER: 'hiremind_auth_user',
  CANDIDATES: 'hiremind_candidates',
  JOBS: 'hiremind_jobs',
  APPLICATIONS: 'hiremind_applications',
  RESUME_ANALYSES: 'hiremind_resume_analyses',
  INTERVIEWS: 'hiremind_interviews',
  SCHEDULED_INTERVIEWS: 'hiremind_scheduled_interviews',
  TEST_ATTEMPTS: 'hiremind_test_attempts',
  RANKING_WEIGHTS: 'hiremind_ranking_weights',
  NOTIFICATIONS: 'hiremind_notifications',
  USERS: 'hiremind_users'
};

export const getStoredItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const setStoredItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
};
