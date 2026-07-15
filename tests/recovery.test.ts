import { describe, expect, it } from "vitest";
import {
  createActivityEntry,
  createRecoveryScenarioEntry,
  createRentalOfferEntry,
} from "../src/lib/calculations";
import {
  calculateForcedInactivityMetrics,
  calculateRecoveryScenarioMetrics,
  calculateRentalOfferMetrics,
  getSuspendedDatesForMonth,
} from "../src/lib/recovery";

describe("forced inactivity planning", () => {
  it("excludes suspended days and recalculates the recovery target", () => {
    const activity = createActivityEntry({
      status: "activité suspendue",
      startDate: "2026-07-01",
      estimatedResumeDate: "2026-07-11",
      requiredBudget: 2000,
      availableBudget: 750,
      stepsToComplete: "Appeler le garage\nCommander la pièce",
      restartTasks: "Recharger le téléphone\nRéactiver les plateformes",
    });

    const suspendedDates = getSuspendedDatesForMonth(activity, "2026-07", "2026-07-05");
    const metrics = calculateForcedInactivityMetrics({
      activity,
      month: "2026-07",
      todayDate: "2026-07-05",
      monthlyObjective: 4000,
      remainingGoal: 3200,
      plannedWorkDaysPerMonth: 20,
      workedActiveDays: 2,
      dailyTargetReference: 200,
    });

    expect(suspendedDates).toHaveLength(10);
    expect(metrics.stopDaysCount).toBe(5);
    expect(metrics.impactOnMonthlyGoal).toBe(2000);
    expect(metrics.remainingWorkDaysAfterResume).toBe(18);
    expect(metrics.recalculatedDailyTarget).toBeCloseTo(177.78, 2);
    expect(metrics.remainingFunding).toBe(1250);
    expect(metrics.fundingProgress).toBe(37.5);
    expect(metrics.checklistItems).toEqual(["Appeler le garage", "Commander la pièce"]);
    expect(metrics.taskItems).toEqual([
      "Recharger le téléphone",
      "Réactiver les plateformes",
    ]);
  });
});

describe("rental offer metrics", () => {
  it("calculates the real rental effort and estimated remaining benefit", () => {
    const offer = createRentalOfferEntry({
      providerName: "Loueur Premium",
      dailyPrice: 60,
      weeklyPrice: 350,
      monthlyPrice: 1200,
      securityDeposit: 600,
      includedKm: 2500,
      extraKmPrice: 0.15,
      insuranceIncluded: false,
      maintenanceIncluded: false,
      minimumCommitmentDays: 14,
    });

    const metrics = calculateRentalOfferMetrics(offer, {
      averageNetHourly: 40,
      plannedWorkDaysPerMonth: 20,
      plannedWorkHoursPerDay: 8,
      monthlyObjective: 4000,
      plannedKmPerMonth: 3500,
      energyCostPerKm: 0.09,
      maintenanceCostPerKm: 0.12,
      monthlyInsurance: 120,
      monthlyFixedCosts: 200,
    });

    expect(metrics.startUpCost).toBe(1300);
    expect(metrics.weeklyCost).toBe(350);
    expect(metrics.monthlyCost).toBe(1200);
    expect(metrics.dailyRealCost).toBe(94.5);
    expect(metrics.minimumRevenueNeeded).toBe(1890);
    expect(metrics.requiredHours).toBeCloseTo(47.25, 2);
    expect(metrics.profitabilityThreshold).toBeCloseTo(120.25, 2);
    expect(metrics.estimatedBenefit).toBe(1595);
    expect(metrics.impactOnObjective).toBe(2110);
  });
});

describe("recovery scenario metrics", () => {
  it("estimates payback time and objective pressure for a scenario", () => {
    const scenario = createRecoveryScenarioEntry({
      type: "Acheter un véhicule",
      initialCost: 1800,
      monthlyCost: 450,
    });

    const metrics = calculateRecoveryScenarioMetrics(scenario, {
      averageNetHourly: 35,
      plannedWorkHoursPerDay: 8,
      monthlyObjective: 4000,
    });

    expect(metrics.revenueRequired).toBe(2250);
    expect(metrics.dailyNetCapacity).toBe(280);
    expect(metrics.paybackDays).toBeCloseTo(6.43, 2);
    expect(metrics.impactOnObjective).toBe(1750);
  });
});
