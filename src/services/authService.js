import { USER_ROLES } from "@/config/appConfig";
import { requireSupabase } from "@/config/supabaseClient";

const PROFILE_SELECT = `
  id,
  organization_id,
  first_name,
  last_name,
  email,
  role,
  is_active,
  organization:organizations(id, name, slug)
`;

export async function signInWithPassword({ email, password }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  const supabase = requireSupabase();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export async function getCurrentProfile() {
  const supabase = requireSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? { ...data, user: session.user } : null;
}

export function onAuthStateChange(callback) {
  const supabase = requireSupabase();
  return supabase.auth.onAuthStateChange(callback);
}

export function isAdmin(profile) {
  return profile?.role === USER_ROLES.ADMIN;
}

export function isTrainer(profile) {
  return profile?.role === USER_ROLES.TRAINER;
}

export function canAccessSensitiveExports(profile) {
  return isAdmin(profile);
}
