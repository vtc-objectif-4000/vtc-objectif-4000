import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

const USER_SELECT = `
  id,
  organization_id,
  first_name,
  last_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
`;

export async function listUsers() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select(USER_SELECT)
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listFormateurs() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select(USER_SELECT)
    .eq("role", "formateur")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateUserRole(userId, role) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "update_user_role",
    targetTable: "profiles",
    targetId: userId,
    metadata: { role },
  });

  return data;
}
