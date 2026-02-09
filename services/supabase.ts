
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szkgaqvnhvhvldyjllps.supabase.co';
// Assuming the key is provided via environment, fallback to empty for safety
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
