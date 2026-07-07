import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

export function computeModuleProgress(moduleAssignment) {
  const skills = [...(moduleAssignment.module?.skills || [])].sort(
    (left, right) => (left.display_order || 0) - (right.display_order || 0),
  );
  const validatedIds = new Set(
    (moduleAssignment.beneficiary_skills || []).map((item) => item.skill_id),
  );

  const completedSkills = skills.filter((skill) => validatedIds.has(skill.id)).length;
  const totalSkills = skills.length;
  const progressPercent = totalSkills === 0 ? 0 : Math.round((completedSkills / totalSkills) * 100);

  return {
    ...moduleAssignment,
    skills: skills.map((skill) => ({
      ...skill,
      validated: validatedIds.has(skill.id),
      validation: (moduleAssignment.beneficiary_skills || []).find(
        (item) => item.skill_id === skill.id,
      ),
    })),
    completedSkills,
    totalSkills,
    progressPercent,
  };
}

export async function listModuleCatalog() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("modules")
    .select(
      `
        id,
        organization_id,
        code,
        title,
        description,
        color_token,
        display_order,
        skills(id, code, title, description, display_order, stat_key)
      `,
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listBeneficiaryModules(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiary_modules")
    .select(
      `
        id,
        organization_id,
        beneficiary_id,
        module_id,
        module_code,
        priority,
        status,
        started_at,
        completed_at,
        created_at,
        updated_at,
        module:modules(
          id,
          code,
          title,
          description,
          color_token,
          display_order,
          skills(id, code, title, description, display_order, stat_key)
        ),
        beneficiary_skills(id, skill_id, validated_at, validated_by)
      `,
    )
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(computeModuleProgress);
}

export async function assignModuleToBeneficiary({
  beneficiaryId,
  organizationId,
  moduleId,
  moduleCode,
  priority = "recommande",
}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiary_modules")
    .upsert(
      {
        organization_id: organizationId,
        beneficiary_id: beneficiaryId,
        module_id: moduleId,
        module_code: moduleCode,
        priority,
      },
      { onConflict: "beneficiary_id,module_id" },
    )
    .select("id, beneficiary_id, module_id, module_code, priority, status")
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "assign_module",
    targetTable: "beneficiary_modules",
    targetId: data.id,
    metadata: { moduleCode },
  });

  return data;
}

export async function updateBeneficiaryModuleStatus(beneficiaryModuleId, status) {
  const supabase = requireSupabase();
  const patch = {
    status,
    started_at: status === "en_cours" ? new Date().toISOString() : null,
    completed_at: status === "termine" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("beneficiary_modules")
    .update(patch)
    .eq("id", beneficiaryModuleId)
    .select("id, status, started_at, completed_at")
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "update_module_status",
    targetTable: "beneficiary_modules",
    targetId: beneficiaryModuleId,
    metadata: { status },
  });

  return data;
}

export async function listBeneficiaryModulesForExport() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("beneficiary_modules")
    .select(
      `
        id,
        module_code,
        priority,
        status,
        created_at,
        completed_at,
        beneficiary:beneficiaries(id, first_name, last_name),
        module:modules(code, title)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
