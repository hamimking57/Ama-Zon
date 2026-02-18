
import { createClient } from '@supabase/supabase-js';

// আপনার প্রোভাইড করা ডাটাবেস লিংক
const supabaseUrl = 'https://edxydlrproekcaitmirs.supabase.co';

// আপনার প্রোভাইড করা API Key সরাসরি ব্যবহার করা হয়েছে যাতে কানেকশন গ্যারান্টিড থাকে
const supabaseAnonKey = 'sb_publishable_Y2JdOXuxnSkgH9m04R8Lxg_Z-lAf_sE';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
