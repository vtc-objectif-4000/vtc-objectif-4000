import { AXES_BY_ID } from "@/data/axes";
import { MODULES_BY_CODE } from "@/data/modules";
import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

const PRIORITY_ORDER = {
  prioritaire: 0,
  recommande: 1,
  acquis: 2,
};

export function scoreToPriority(score) {
  const numericScore = Number(score);

  if (numericScore <= 2) {
    return "prioritaire";
  }

  if (numericScore === 3) {
    return "recommande";
  }

  return "acquis";
}

export function normalizeDiagnosticScoreEntries(scoreInput) {
  if (Array.isArray(scoreInput)) {
    return scoreInput.map((entry) => ({
      axis_code: entry.axis_code || entry.axisId || entry.id,
      axis_label: entry.axis_label || entry.label || AXES_BY_ID[entry.axis_code || entry.axisId || entry.id]?.label,
      score: Number(entry.score),
      comment: entry.comment || "",
    }));
  }

  return Object.entries(scoreInput || {}).map(([axisCode, value]) => ({
    axis_code: axisCode,
    axis_label: AXES_BY_ID[axisCode]?.label,
    score: Number(typeof value === "object" ? value.score : value),
    comment: typeof value === "object" ? value.comment || "" : "",
  }));
}

export function generatePathwayPlan(scoreInput) {
  const assignments = new Map();
  const acquiredModules = new Map();

  for (const entry of normalizeDiagnosticScoreEntries(scoreInput)) {
    const axis = AXES_BY_ID[entry.axis_code];

    if (!axis) {
      continue;
    }

    const priority = scoreToPriority(entry.score);
    const moduleCode = axis.moduleCode;
    const moduleDefinition = MODULES_BY_CODE[moduleCode];

    if (!moduleDefinition) {
      continue;
    }

    const targetMap = priority === "acquis" ? acquiredModules : assignments;
    const existing = targetMap.get(moduleCode);

    if (!existing || PRIORITY_ORDER[priority] < PRIORITY_ORDER[existing.priority]) {
      targetMap.set(moduleCode, {
        moduleCode,
        moduleTitle: moduleDefinition.title,
        priority,
        sourceAxes: [axis.label],
      });
      continue;
    }

    existing.sourceAxes = Array.from(new Set([...existing.sourceAxes, axis.label]));
  }

  return {
    assignedModules: Array.from(assignments.values()).sort(
      (left, right) => PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority],
    ),
    acquiredModules: Array.from(acquiredModules.values()),
  };
}

export async function syncPathwayForBeneficiary({
  beneficiaryId,
  organizationId,
  diagnosticId,
  assignments,
}) {
  const supabase = requireSupabase();
  const moduleCodes = assignments.assignedModules.map((item) => item.moduleCode);

  if (moduleCodes.length === 0) {
    return [];
  }

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id, code, title")
    .eq("organization_id", organizationId)
    .in("code", moduleCodes);

  if (modulesError) {
    throw modulesError;
  }

  const payload = modules.map((moduleItem) => {
    const assignment = assignments.assignedModules.find(
      (candidate) => candidate.moduleCode === moduleItem.code,
    );

    return {
      organization_id: organizationId,
      beneficiary_id: beneficiaryId,
      module_id: moduleItem.id,
      module_code: moduleItem.code,
      priority: assignment.priority,
      status: "a_faire",
      assigned_from_diagnostic_id: diagnosticId,
    };
  });

  const { data, error } = await supabase
    .from("beneficiary_modules")
    .upsert(payload, { onConflict: "beneficiary_id,module_id" })
    .select("id, module_id, module_code, priority, status");

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "sync_pathway",
    targetTable: "beneficiary_modules",
    targetId: beneficiaryId,
    metadata: {
      diagnosticId,
      moduleCodes,
    },
  });

  return data ?? [];
}
