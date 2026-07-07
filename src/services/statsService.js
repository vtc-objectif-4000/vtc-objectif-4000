import { AXES } from "@/data/axes";
import { requireSupabase } from "@/config/supabaseClient";

export function calculateImpactStats(dataset) {
  const beneficiaries = dataset.beneficiaries || [];
  const diagnostics = dataset.diagnostics || [];
  const beneficiaryModules = dataset.beneficiaryModules || [];
  const beneficiarySkills = dataset.beneficiarySkills || [];
  const attendances = dataset.attendances || [];

  const diagnosticsByBeneficiary = diagnostics.reduce((accumulator, diagnostic) => {
    const list = accumulator.get(diagnostic.beneficiary_id) || [];
    list.push(diagnostic);
    accumulator.set(diagnostic.beneficiary_id, list);
    return accumulator;
  }, new Map());

  for (const diagnosticList of diagnosticsByBeneficiary.values()) {
    diagnosticList.sort(
      (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    );
  }

  const progressPairs = Array.from(diagnosticsByBeneficiary.values())
    .filter((items) => items.length >= 2)
    .map((items) => ({
      french: Number(items.at(-1).french_average || 0) - Number(items[0].french_average || 0),
      digital: Number(items.at(-1).digital_average || 0) - Number(items[0].digital_average || 0),
    }));

  const averageFrenchProgress =
    progressPairs.length === 0
      ? 0
      : Number(
          (
            progressPairs.reduce((sum, item) => sum + item.french, 0) / progressPairs.length
          ).toFixed(2),
        );

  const averageDigitalProgress =
    progressPairs.length === 0
      ? 0
      : Number(
          (
            progressPairs.reduce((sum, item) => sum + item.digital, 0) / progressPairs.length
          ).toFixed(2),
        );

  const skillSetByBeneficiary = beneficiarySkills.reduce((accumulator, item) => {
    const set = accumulator.get(item.beneficiary_id) || [];
    set.push(item);
    accumulator.set(item.beneficiary_id, set);
    return accumulator;
  }, new Map());

  const beneficiariesWithCvValidated = new Set();
  const beneficiariesWithAdministrativeSkill = new Set();
  const parentsWithSchoolSkill = new Set();
  const beneficiariesWithWorkSkill = new Set();

  for (const skill of beneficiarySkills) {
    const moduleCode = skill.skill?.module?.code;
    const skillCode = skill.skill?.code;

    if (skillCode === "work-cv") {
      beneficiariesWithCvValidated.add(skill.beneficiary_id);
    }
    if (moduleCode === "autonomie-administrative") {
      beneficiariesWithAdministrativeSkill.add(skill.beneficiary_id);
    }
    if (moduleCode === "parents-ecole") {
      parentsWithSchoolSkill.add(skill.beneficiary_id);
    }
    if (moduleCode === "travail-insertion") {
      beneficiariesWithWorkSkill.add(skill.beneficiary_id);
    }
  }

  const concreteAttendanceRecords = attendances.filter((item) => item.status !== "inscrit");
  const attendedCount = concreteAttendanceRecords.filter((item) =>
    ["present", "retard"].includes(item.status),
  ).length;

  const latestDiagnostics = Array.from(diagnosticsByBeneficiary.values())
    .map((items) => items.at(-1))
    .filter(Boolean);

  const axisAverages = AXES.map((axis) => {
    const scores = latestDiagnostics
      .map((diagnostic) =>
        (diagnostic.diagnostic_scores || []).find((entry) => entry.axis_code === axis.id),
      )
      .filter(Boolean)
      .map((entry) => Number(entry.score));

    const average =
      scores.length === 0
        ? 0
        : Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));

    return {
      axisId: axis.id,
      label: axis.label,
      average,
    };
  });

  return {
    totalBeneficiaries: beneficiaries.length,
    activeBeneficiaries: beneficiaries.filter((item) => item.status === "actif").length,
    archivedBeneficiaries: beneficiaries.filter((item) => item.status === "archive").length,
    diagnosticsCount: diagnostics.length,
    averageFrenchProgress,
    averageDigitalProgress,
    validatedSkillsTotal: beneficiarySkills.length,
    beneficiariesWithCvValidated: beneficiariesWithCvValidated.size,
    beneficiariesWithAdministrativeSkill: beneficiariesWithAdministrativeSkill.size,
    parentsWithSchoolSkill: parentsWithSchoolSkill.size,
    beneficiariesWithWorkSkill: beneficiariesWithWorkSkill.size,
    attendanceRate:
      concreteAttendanceRecords.length === 0
        ? 0
        : Number(((attendedCount / concreteAttendanceRecords.length) * 100).toFixed(2)),
    exitsToEmploymentOrTraining: beneficiaries.filter((item) =>
      ["emploi", "formation"].includes(item.exit_outcome),
    ).length,
    completedModules: beneficiaryModules.filter((item) => item.status === "termine").length,
    axisAverages,
    latestDiagnosticsCount: latestDiagnostics.length,
    notesByBeneficiaryCount: skillSetByBeneficiary.size,
  };
}

export async function fetchImpactStats() {
  const supabase = requireSupabase();
  const [
    beneficiariesResponse,
    diagnosticsResponse,
    beneficiaryModulesResponse,
    beneficiarySkillsResponse,
    attendancesResponse,
  ] = await Promise.all([
    supabase.from("beneficiaries").select("id, status, exit_outcome"),
    supabase
      .from("diagnostics")
      .select(
        `
          id,
          beneficiary_id,
          created_at,
          french_average,
          digital_average,
          overall_average,
          diagnostic_scores(axis_code, score)
        `,
      ),
    supabase.from("beneficiary_modules").select("id, beneficiary_id, status"),
    supabase.from("beneficiary_skills").select(
      `
        beneficiary_id,
        validated_at,
        skill:skills(code, stat_key, module:modules(code))
      `,
    ),
    supabase.from("attendances").select("id, beneficiary_id, status"),
  ]);

  const responses = [
    beneficiariesResponse,
    diagnosticsResponse,
    beneficiaryModulesResponse,
    beneficiarySkillsResponse,
    attendancesResponse,
  ];

  const firstError = responses.find((response) => response.error)?.error;
  if (firstError) {
    throw firstError;
  }

  return calculateImpactStats({
    beneficiaries: beneficiariesResponse.data,
    diagnostics: diagnosticsResponse.data,
    beneficiaryModules: beneficiaryModulesResponse.data,
    beneficiarySkills: beneficiarySkillsResponse.data,
    attendances: attendancesResponse.data,
  });
}
