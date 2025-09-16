import { createClient } from '@supabase/supabase-js';

// Vite automatically provides types for import.meta.env, so no need to redeclare ImportMetaEnv or ImportMeta.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
