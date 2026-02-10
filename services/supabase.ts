
import { createClient } from '@supabase/supabase-js';

// আপনার প্রোভাইড করা ডাটাবেস লিংক থেকে প্রাপ্ত প্রজেক্ট URL
const supabaseUrl = 'https://edxydlrproekcaitmirs.supabase.co';

// Try to get the key from multiple possible environment variable locations
const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (process.env as any).VITE_SUPABASE_ANON_KEY ||
  (process.env as any).SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
