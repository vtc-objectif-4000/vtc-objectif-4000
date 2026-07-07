import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

export async function listValidatedSkillsForBeneficiary(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiary_skills")
    .select(
      `
        id,
        beneficiary_id,
        module_id,
        skill_id,
        validated_at,
        skill:skills(id, code, title, stat_key, module:modules(code, title))
      `,
    )
    .eq("beneficiary_id", beneficiaryId)
    .order("validated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function syncModuleStatusFromSkills(beneficiaryModuleId) {
  const supabase = requireSupabase();
  const { data: assignment, error: assignmentError } = await supabase
    .from("beneficiary_modules")
    .select(
      `
        id,
        module_id,
        module:modules(id, skills(id)),
        beneficiary_skills(id)
      `,
    )
    .eq("id", beneficiaryModuleId)
    .single();

  if (assignmentError) {
    throw assignmentError;
  }

  const totalSkills = assignment.module?.skills?.length || 0;
  const validatedCount = assignment.beneficiary_skills?.length || 0;

  let nextStatus = "a_faire";
  if (validatedCount > 0 && validatedCount < totalSkills) {
    nextStatus = "en_cours";
  }
  if (validatedCount > 0 && validatedCount === totalSkills) {
    nextStatus = "termine";
  }

  const patch = {
    status: nextStatus,
    started_at: validatedCount > 0 ? new Date().toISOString() : null,
    completed_at: nextStatus === "termine" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("beneficiary_modules")
    .update(patch)
    .eq("id", beneficiaryModuleId);

  if (error) {
    throw error;
  }
}

export async function toggleBeneficiarySkill({
  beneficiaryModuleId,
  beneficiaryId,
  organizationId,
  moduleId,
  skillId,
  actorId,
  validated,
}) {
  const supabase = requireSupabase();

  if (validated) {
    const { error } = await supabase.from("beneficiary_skills").upsert(
      {
        organization_id: organizationId,
        beneficiary_id: beneficiaryId,
        beneficiary_module_id: beneficiaryModuleId,
        module_id: moduleId,
        skill_id: skillId,
        validated_by: actorId,
        validated_at: new Date().toISOString(),
      },
      { onConflict: "beneficiary_id,skill_id" },
    );

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("beneficiary_skills")
      .delete()
      .eq("beneficiary_id", beneficiaryId)
      .eq("skill_id", skillId);

    if (error) {
      throw error;
    }
  }

  await syncModuleStatusFromSkills(beneficiaryModuleId);

  await logAuditEvent({
    action: validated ? "validate_skill" : "unvalidate_skill",
    targetTable: "beneficiary_skills",
    targetId: skillId,
    metadata: { beneficiaryId, moduleId },
  });

  return true;
}

export async function listValidatedSkillsForExport() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiary_skills")
    .select(
      `
        id,
        validated_at,
        beneficiary:beneficiaries(id, first_name, last_name),
        skill:skills(id, code, title, stat_key, module:modules(code, title))
      `,
    )
    .order("validated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
