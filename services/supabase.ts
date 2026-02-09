
import { createClient } from '@supabase/supabase-js';

// আপনার প্রোভাইড করা ডাটাবেস লিংক থেকে প্রাপ্ত প্রজেক্ট URL
const supabaseUrl = 'https://edxydlrproekcaitmirs.supabase.co';

// Anon Key এনভায়রনমেন্ট ভেরিয়েবল থেকে নেওয়া হবে
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
