import { requireSupabase } from "@/config/supabaseClient";
import {
  assertConsentChecked,
  buildConsentPayload,
  logAuditEvent,
  sanitizeBeneficiaryPayload,
} from "./rgpdService";

const BENEFICIARY_LIST_SELECT = `
  id,
  organization_id,
  formateur_id,
  first_name,
  last_name,
  birth_year,
  phone,
  email,
  family_situation,
  children_count,
  french_level_estimate,
  priority_needs,
  status,
  rgpd_consent,
  entry_date,
  exit_date,
  exit_outcome,
  created_at,
  updated_at,
  formateur:profiles!beneficiaries_formateur_id_fkey(id, first_name, last_name, role)
`;

export async function listBeneficiaries({
  includeArchived = true,
  search = "",
} = {}) {
  const supabase = requireSupabase();
  let query = supabase
    .from("beneficiaries")
    .select(BENEFICIARY_LIST_SELECT)
    .order("updated_at", { ascending: false });

  if (!includeArchived) {
    query = query.neq("status", "archive");
  }

  if (search.trim()) {
    const safeSearch = search.trim().replaceAll(",", " ");
    query = query.or(
      `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listBeneficiaryOptions() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name, status")
    .neq("status", "archive")
    .order("last_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getBeneficiaryById(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiaries")
    .select(BENEFICIARY_LIST_SELECT)
    .eq("id", beneficiaryId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createBeneficiary({
  values,
  organizationId,
  actorId,
}) {
  const supabase = requireSupabase();
  const sanitized = sanitizeBeneficiaryPayload(values);
  assertConsentChecked(sanitized.rgpd_consent);

  const insertPayload = {
    ...sanitized,
    organization_id: organizationId,
    formateur_id: sanitized.formateur_id || actorId,
  };

  const { data, error } = await supabase
    .from("beneficiaries")
    .insert(insertPayload)
    .select(BENEFICIARY_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from("consents")
    .insert({
      ...buildConsentPayload({ beneficiaryId: data.id, collectedBy: actorId }),
      organization_id: organizationId,
    });

  await logAuditEvent({
    action: "create_beneficiary",
    targetTable: "beneficiaries",
    targetId: data.id,
    metadata: { status: data.status },
  });

  return data;
}

export async function updateBeneficiary({
  beneficiaryId,
  values,
}) {
  const supabase = requireSupabase();
  const sanitized = sanitizeBeneficiaryPayload(values);
  assertConsentChecked(sanitized.rgpd_consent);

  const { data, error } = await supabase
    .from("beneficiaries")
    .update(sanitized)
    .eq("id", beneficiaryId)
    .select(BENEFICIARY_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "update_beneficiary",
    targetTable: "beneficiaries",
    targetId: beneficiaryId,
    metadata: { status: data.status },
  });

  return data;
}

export async function archiveBeneficiary(beneficiaryId, shouldArchive = true) {
  const supabase = requireSupabase();
  const nextStatus = shouldArchive ? "archive" : "actif";
  const { data, error } = await supabase
    .from("beneficiaries")
    .update({ status: nextStatus })
    .eq("id", beneficiaryId)
    .select(BENEFICIARY_LIST_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: shouldArchive ? "archive_beneficiary" : "restore_beneficiary",
    targetTable: "beneficiaries",
    targetId: beneficiaryId,
    metadata: { status: nextStatus },
  });

  return data;
}

export async function deleteBeneficiary(beneficiaryId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("beneficiaries").delete().eq("id", beneficiaryId);

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "delete_beneficiary",
    targetTable: "beneficiaries",
    targetId: beneficiaryId,
  });

  return true;
}
