import { describe, expect, it } from "vitest";
import { calculateImpactStats } from "@/services/statsService";

describe("calculateImpactStats", () => {
  it("calcule les indicateurs dynamiques a partir des donnees par beneficiaire", () => {
    const result = calculateImpactStats({
      beneficiaries: [
        { id: "b1", status: "actif", exit_outcome: null },
        { id: "b2", status: "archive", exit_outcome: "formation" },
      ],
      diagnostics: [
        {
          beneficiary_id: "b1",
          created_at: "2026-01-01T10:00:00Z",
          french_average: 1,
          digital_average: 2,
          diagnostic_scores: [{ axis_code: "french_oral", score: 1 }],
        },
        {
          beneficiary_id: "b1",
          created_at: "2026-03-01T10:00:00Z",
          french_average: 3,
          digital_average: 4,
          diagnostic_scores: [{ axis_code: "french_oral", score: 3 }],
        },
        {
          beneficiary_id: "b2",
          created_at: "2026-02-01T10:00:00Z",
          french_average: 4,
          digital_average: 4,
          diagnostic_scores: [{ axis_code: "french_oral", score: 4 }],
        },
      ],
      beneficiaryModules: [
        { beneficiary_id: "b1", status: "termine" },
        { beneficiary_id: "b2", status: "en_cours" },
      ],
      beneficiarySkills: [
        { beneficiary_id: "b1", skill: { code: "work-cv", module: { code: "travail-insertion" } } },
        {
          beneficiary_id: "b1",
          skill: { code: "admin-sort-documents", module: { code: "autonomie-administrative" } },
        },
        { beneficiary_id: "b2", skill: { code: "school-read-notebook", module: { code: "parents-ecole" } } },
      ],
      attendances: [
        { beneficiary_id: "b1", status: "present" },
        { beneficiary_id: "b2", status: "retard" },
        { beneficiary_id: "b2", status: "absent" },
      ],
    });

    expect(result.totalBeneficiaries).toBe(2);
    expect(result.activeBeneficiaries).toBe(1);
    expect(result.archivedBeneficiaries).toBe(1);
    expect(result.averageFrenchProgress).toBe(2);
    expect(result.averageDigitalProgress).toBe(2);
    expect(result.beneficiariesWithCvValidated).toBe(1);
    expect(result.beneficiariesWithAdministrativeSkill).toBe(1);
    expect(result.parentsWithSchoolSkill).toBe(1);
    expect(result.attendanceRate).toBeCloseTo(66.67, 1);
    expect(result.exitsToEmploymentOrTraining).toBe(1);
  });
});
