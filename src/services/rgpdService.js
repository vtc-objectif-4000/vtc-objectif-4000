import { APP_CONFIG } from "@/config/appConfig";
import { requireSupabase } from "@/config/supabaseClient";

export const RGPD_CONTENT = {
  principles: [
    "Minimiser les donnees saisies au strict necessaire.",
    "Collecter un consentement explicite avant toute creation de fiche beneficiaire.",
    "Ne pas saisir de donnees medicales sensibles ou de diagnostic clinique.",
    "Limiter les exports aux informations utiles et autorisees par role.",
    "Permettre l'archivage et la suppression en gardant une trace d'audit.",
  ],
  warnings: [
    "Le module sante couvre l'autonomie de parcours, pas des donnees de sante sensibles.",
    "Les donnees de demonstration ne doivent jamais etre presentees comme des resultats reels.",
    "La tracabilite est preparee via audit_logs et peut etre etendue avec des journaux techniques.",
  ],
};

export function assertConsentChecked(isChecked) {
  if (!isChecked) {
    throw new Error("Le consentement RGPD est obligatoire avant la creation ou la mise a jour.");
  }
}

export function sanitizeBeneficiaryPayload(payload) {
  const priorityNeeds = Array.isArray(payload.priority_needs)
    ? payload.priority_needs
    : String(payload.priority_needs || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    first_name: String(payload.first_name || "").trim(),
    last_name: String(payload.last_name || "").trim(),
    birth_year: payload.birth_year ? Number(payload.birth_year) : null,
    phone: String(payload.phone || "").trim(),
    email: payload.email ? String(payload.email).trim() : null,
    family_situation: payload.family_situation ? String(payload.family_situation).trim() : null,
    children_count: payload.children_count ? Number(payload.children_count) : 0,
    french_level_estimate: payload.french_level_estimate
      ? Number(payload.french_level_estimate)
      : null,
    priority_needs: priorityNeeds,
    status: payload.status || "actif",
    rgpd_consent: Boolean(payload.rgpd_consent),
    entry_date: payload.entry_date || new Date().toISOString().slice(0, 10),
    exit_date: payload.exit_date || null,
    exit_outcome: payload.exit_outcome || null,
    formateur_id: payload.formateur_id || null,
  };
}

export function sanitizeNotePayload(payload, canCreateSensitiveNote = false) {
  return {
    beneficiary_id: payload.beneficiary_id,
    note_type: payload.note_type || "general",
    content: String(payload.content || "").trim(),
    visibility: "interne",
    is_sensitive: canCreateSensitiveNote ? Boolean(payload.is_sensitive) : false,
  };
}

export function buildConsentPayload({ beneficiaryId, collectedBy }) {
  return {
    beneficiary_id: beneficiaryId,
    accepted: true,
    accepted_at: new Date().toISOString(),
    policy_version: APP_CONFIG.rgpdPolicyVersion,
    collected_by: collectedBy,
    source: "staff-form",
  };
}

export async function logAuditEvent({
  action,
  targetTable,
  targetId = null,
  metadata = {},
}) {
  try {
    const supabase = requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return null;
    }

    const { error } = await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      metadata,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Audit log non enregistre :", error.message);
    return null;
  }
}

export function getRgpdContent() {
  return RGPD_CONTENT;
}
