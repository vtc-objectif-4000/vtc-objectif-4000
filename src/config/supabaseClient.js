import { createClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "./appConfig";

export const isSupabaseConfigured = Boolean(
  APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey,
);

export const supabase = isSupabaseConfigured
  ? createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configure. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}
