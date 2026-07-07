import { AXES } from "@/data/axes";
import { requireSupabase } from "@/config/supabaseClient";
import { generatePathwayPlan, syncPathwayForBeneficiary } from "./pathwayService";
import { logAuditEvent } from "./rgpdService";

const DIAGNOSTIC_SELECT = `
  id,
  organization_id,
  beneficiary_id,
  created_by,
  summary,
  french_average,
  digital_average,
  overall_average,
  created_at,
  diagnostic_scores(id, axis_code, axis_label, score, comment, created_at)
`;

export function buildDiagnosticScoresPayload(scoreValues) {
  return AXES.map((axis) => {
    const value = scoreValues[axis.id];
    return {
      axis_code: axis.id,
      axis_label: axis.label,
      score: Number(typeof value === "object" ? value.score : value || 1),
      comment: typeof value === "object" ? value.comment || "" : "",
    };
  });
}

export function computeDiagnosticAverages(scoreRows) {
  const axisMap = scoreRows.reduce((accumulator, row) => {
    accumulator[row.axis_code] = Number(row.score);
    return accumulator;
  }, {});

  const frenchAverage =
    (axisMap.french_oral + axisMap.reading + axisMap.writing) / 3;
  const digitalAverage =
    (axisMap.digital_autonomy + axisMap.smartphone_email + axisMap.public_services) / 3;
  const overallAverage =
    scoreRows.reduce((sum, row) => sum + Number(row.score), 0) / scoreRows.length;

  return {
    frenchAverage: Number(frenchAverage.toFixed(2)),
    digitalAverage: Number(digitalAverage.toFixed(2)),
    overallAverage: Number(overallAverage.toFixed(2)),
  };
}

export async function createDiagnostic({
  beneficiaryId,
  organizationId,
  createdBy,
  summary,
  scores,
}) {
  const supabase = requireSupabase();
  const scoreRows = buildDiagnosticScoresPayload(scores);
  const averages = computeDiagnosticAverages(scoreRows);

  const { data: diagnostic, error: diagnosticError } = await supabase
    .from("diagnostics")
    .insert({
      organization_id: organizationId,
      beneficiary_id: beneficiaryId,
      created_by: createdBy,
      summary: summary || null,
      french_average: averages.frenchAverage,
      digital_average: averages.digitalAverage,
      overall_average: averages.overallAverage,
    })
    .select("id, organization_id, beneficiary_id, created_at")
    .single();

  if (diagnosticError) {
    throw diagnosticError;
  }

  const insertScores = scoreRows.map((scoreRow) => ({
    organization_id: organizationId,
    beneficiary_id: beneficiaryId,
    diagnostic_id: diagnostic.id,
    ...scoreRow,
  }));

  const { error: scoresError } = await supabase
    .from("diagnostic_scores")
    .insert(insertScores);

  if (scoresError) {
    throw scoresError;
  }

  const pathway = generatePathwayPlan(scoreRows);

  await syncPathwayForBeneficiary({
    beneficiaryId,
    organizationId,
    diagnosticId: diagnostic.id,
    assignments: pathway,
  });

  await logAuditEvent({
    action: "create_diagnostic",
    targetTable: "diagnostics",
    targetId: diagnostic.id,
    metadata: {
      beneficiaryId,
      overallAverage: averages.overallAverage,
    },
  });

  return {
    diagnostic: {
      ...diagnostic,
      ...averages,
      diagnostic_scores: insertScores,
    },
    pathway,
  };
}

export async function listDiagnosticsForBeneficiary(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("diagnostics")
    .select(DIAGNOSTIC_SELECT)
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getDiagnosticById(diagnosticId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("diagnostics")
    .select(DIAGNOSTIC_SELECT)
    .eq("id", diagnosticId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listDiagnosticsForExport() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("diagnostics")
    .select(
      `
        id,
        beneficiary_id,
        created_at,
        summary,
        french_average,
        digital_average,
        overall_average,
        beneficiary:beneficiaries(id, first_name, last_name),
        diagnostic_scores(axis_code, axis_label, score, comment)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
