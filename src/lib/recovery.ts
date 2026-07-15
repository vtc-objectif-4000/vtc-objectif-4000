import {
  ActivityEntry,
  RentalOfferEntry,
  RecoveryScenarioEntry,
} from "../types";

export interface ForcedInactivityMetrics {
  suspendedDatesInMonth: string[];
  stopDaysCount: number;
  impactOnMonthlyGoal: number;
  estimatedResumeDate: string;
  remainingWorkDaysAfterResume: number;
  recalculatedDailyTarget: number;
  requiredBudget: number;
  availableBudget: number;
  remainingFunding: number;
  fundingProgress: number;
  checklistItems: string[];
  taskItems: string[];
}

export interface RentalOfferMetrics {
  startUpCost: number;
  weeklyCost: number;
  monthlyCost: number;
  dailyRealCost: number;
  minimumRevenueNeeded: number;
  requiredHours: number;
  profitabilityThreshold: number;
  estimatedBenefit: number;
  impactOnObjective: number;
  extraKmMonthly: number;
  extraKmMonthlyCost: number;
  monthlyOperatingCost: number;
}

export interface RecoveryScenarioMetrics {
  revenueRequired: number;
  paybackDays: number;
  dailyNetCapacity: number;
  impactOnObjective: number;
}

export interface RentalCalculationContext {
  averageNetHourly: number;
  plannedWorkDaysPerMonth: number;
  plannedWorkHoursPerDay: number;
  monthlyObjective: number;
  plannedKmPerMonth: number;
  energyCostPerKm: number;
  maintenanceCostPerKm: number;
  monthlyInsurance: number;
  monthlyFixedCosts: number;
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeDivide(value: number, divisor: number): number {
  return divisor > 0 ? value / divisor : 0;
}

function toDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateValue: string, days: number): string {
  const parsed = toDate(dateValue);
  if (!parsed) {
    return "";
  }

  parsed.setDate(parsed.getDate() + days);
  return formatDate(parsed);
}

function getMonthBounds(month: string): { start: string; end: string; days: number } {
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(days).padStart(2, "0")}`,
    days,
  };
}

function maxDate(left: string, right: string): string {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left > right ? left : right;
}

function minDate(left: string, right: string): string {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left < right ? left : right;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start || !end || start > end) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function splitChecklist(value: string): string[] {
  return value
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveSuspensionEndDate(activity: ActivityEntry, todayDate: string): string {
  if (activity.estimatedResumeDate) {
    return shiftDate(activity.estimatedResumeDate, -1);
  }

  if (activity.endDate) {
    return activity.endDate;
  }

  return todayDate;
}

function resolveWeeklyCost(offer: RentalOfferEntry): number {
  if (offer.weeklyPrice > 0) {
    return offer.weeklyPrice;
  }

  if (offer.dailyPrice > 0) {
    return offer.dailyPrice * 7;
  }

  return offer.monthlyPrice > 0 ? offer.monthlyPrice / 4.345 : 0;
}

function resolveMonthlyCost(offer: RentalOfferEntry): number {
  if (offer.monthlyPrice > 0) {
    return offer.monthlyPrice;
  }

  if (offer.weeklyPrice > 0) {
    return offer.weeklyPrice * 4.345;
  }

  return offer.dailyPrice > 0 ? offer.dailyPrice * 30 : 0;
}

function resolveDailyRentalCost(offer: RentalOfferEntry): number {
  if (offer.dailyPrice > 0) {
    return offer.dailyPrice;
  }

  if (offer.weeklyPrice > 0) {
    return offer.weeklyPrice / 7;
  }

  return offer.monthlyPrice > 0 ? offer.monthlyPrice / 30 : 0;
}

function resolveCommitmentCost(offer: RentalOfferEntry): number {
  const commitmentDays = Math.max(offer.minimumCommitmentDays || 1, 1);
  const dailyCost = resolveDailyRentalCost(offer);
  const weeklyCost = resolveWeeklyCost(offer);
  const monthlyCost = resolveMonthlyCost(offer);

  if (monthlyCost > 0 && commitmentDays >= 30) {
    return monthlyCost * Math.ceil(commitmentDays / 30);
  }

  if (weeklyCost > 0 && commitmentDays >= 7) {
    return weeklyCost * Math.ceil(commitmentDays / 7);
  }

  return dailyCost * commitmentDays;
}

export function isDateWithinRange(date: string, startDate: string, endDate: string): boolean {
  if (!date || !startDate || !endDate) {
    return false;
  }

  return date >= startDate && date <= endDate;
}

export function getSuspendedDatesForMonth(
  activity: ActivityEntry | null,
  month: string,
  todayDate: string,
): string[] {
  if (!activity || activity.status !== "activité suspendue" || !activity.startDate) {
    return [];
  }

  const monthBounds = getMonthBounds(month);
  const effectiveEndDate = resolveSuspensionEndDate(activity, todayDate);
  const overlapStart = maxDate(activity.startDate, monthBounds.start);
  const overlapEnd = minDate(effectiveEndDate, monthBounds.end);

  return enumerateDates(overlapStart, overlapEnd);
}

export function calculateForcedInactivityMetrics(args: {
  activity: ActivityEntry | null;
  month: string;
  todayDate: string;
  monthlyObjective: number;
  remainingGoal: number;
  plannedWorkDaysPerMonth: number;
  workedActiveDays: number;
  dailyTargetReference: number;
}): ForcedInactivityMetrics {
  const {
    activity,
    month,
    todayDate,
    monthlyObjective,
    remainingGoal,
    plannedWorkDaysPerMonth,
    workedActiveDays,
    dailyTargetReference,
  } = args;

  if (!activity || activity.status !== "activité suspendue") {
    return {
      suspendedDatesInMonth: [],
      stopDaysCount: 0,
      impactOnMonthlyGoal: 0,
      estimatedResumeDate: "",
      remainingWorkDaysAfterResume: 0,
      recalculatedDailyTarget: 0,
      requiredBudget: 0,
      availableBudget: 0,
      remainingFunding: 0,
      fundingProgress: 0,
      checklistItems: [],
      taskItems: [],
    };
  }

  const effectiveEndDate = resolveSuspensionEndDate(activity, todayDate);
  const stopDaysCount = enumerateDates(
    activity.startDate,
    minDate(todayDate, effectiveEndDate),
  ).length;
  const suspendedDatesInMonth = getSuspendedDatesForMonth(activity, month, todayDate);
  const monthBounds = getMonthBounds(month);
  const resumeDate = activity.estimatedResumeDate || activity.endDate || "";
  const remainingCalendarDaysAfterResume =
    resumeDate && resumeDate.startsWith(month)
      ? Math.max(monthBounds.days - Number(resumeDate.slice(-2)) + 1, 0)
      : resumeDate > monthBounds.end
        ? 0
        : resumeDate
          ? monthBounds.days
          : 0;
  const remainingPlannedWorkDays = Math.max(plannedWorkDaysPerMonth - workedActiveDays, 0);
  const remainingWorkDaysAfterResume = Math.min(
    remainingPlannedWorkDays,
    remainingCalendarDaysAfterResume,
  );
  const requiredBudget = Math.max(activity.requiredBudget, 0);
  const availableBudget = Math.max(activity.availableBudget, 0);
  const remainingFunding = Math.max(requiredBudget - availableBudget, 0);
  const fundingProgress =
    requiredBudget > 0 ? roundTo((availableBudget / requiredBudget) * 100, 1) : 0;

  return {
    suspendedDatesInMonth,
    stopDaysCount,
    impactOnMonthlyGoal: roundTo(
      Math.min(monthlyObjective, suspendedDatesInMonth.length * dailyTargetReference),
    ),
    estimatedResumeDate: activity.estimatedResumeDate || activity.endDate || "",
    remainingWorkDaysAfterResume,
    recalculatedDailyTarget: roundTo(
      remainingGoal > 0 ? safeDivide(remainingGoal, Math.max(remainingWorkDaysAfterResume, 1)) : 0,
    ),
    requiredBudget: roundTo(requiredBudget),
    availableBudget: roundTo(availableBudget),
    remainingFunding: roundTo(remainingFunding),
    fundingProgress,
    checklistItems: splitChecklist(activity.stepsToComplete),
    taskItems: splitChecklist(activity.restartTasks),
  };
}

export function calculateRentalOfferMetrics(
  offer: RentalOfferEntry,
  context: RentalCalculationContext,
): RentalOfferMetrics {
  const weeklyCost = roundTo(resolveWeeklyCost(offer));
  const monthlyCost = roundTo(resolveMonthlyCost(offer));
  const dailyRentalCost = resolveDailyRentalCost(offer);
  const extraKmMonthly = Math.max(context.plannedKmPerMonth - offer.includedKm, 0);
  const extraKmMonthlyCost = roundTo(extraKmMonthly * offer.extraKmPrice);
  const insuranceMonthly = offer.insuranceIncluded ? 0 : context.monthlyInsurance;
  const maintenanceMonthly = offer.maintenanceIncluded
    ? 0
    : context.maintenanceCostPerKm * context.plannedKmPerMonth;
  const energyMonthly = context.energyCostPerKm * context.plannedKmPerMonth;
  const monthlyOperatingCost =
    monthlyCost +
    extraKmMonthlyCost +
    insuranceMonthly +
    maintenanceMonthly +
    energyMonthly +
    context.monthlyFixedCosts;
  const minimumRevenueNeeded =
    monthlyCost + extraKmMonthlyCost + insuranceMonthly + maintenanceMonthly;
  const dailyRealCost = safeDivide(
    minimumRevenueNeeded,
    Math.max(context.plannedWorkDaysPerMonth, 1),
  );
  const profitabilityThreshold = safeDivide(
    monthlyOperatingCost,
    Math.max(context.plannedWorkDaysPerMonth, 1),
  );

  return {
    startUpCost: roundTo(offer.securityDeposit + resolveCommitmentCost(offer)),
    weeklyCost,
    monthlyCost,
    dailyRealCost: roundTo(Math.max(dailyRentalCost, dailyRealCost)),
    minimumRevenueNeeded: roundTo(minimumRevenueNeeded),
    requiredHours: roundTo(
      safeDivide(
        minimumRevenueNeeded,
        Math.max(context.averageNetHourly, 30),
      ),
    ),
    profitabilityThreshold: roundTo(profitabilityThreshold),
    estimatedBenefit: roundTo(context.monthlyObjective - monthlyOperatingCost),
    impactOnObjective: roundTo(context.monthlyObjective - minimumRevenueNeeded),
    extraKmMonthly,
    extraKmMonthlyCost,
    monthlyOperatingCost: roundTo(monthlyOperatingCost),
  };
}

export function calculateRecoveryScenarioMetrics(
  scenario: RecoveryScenarioEntry,
  context: Pick<RentalCalculationContext, "averageNetHourly" | "plannedWorkHoursPerDay" | "monthlyObjective">,
): RecoveryScenarioMetrics {
  const dailyNetCapacity = roundTo(
    Math.max(context.averageNetHourly, 0) * Math.max(context.plannedWorkHoursPerDay, 0),
  );
  const revenueRequired =
    scenario.requiredRevenue > 0
      ? scenario.requiredRevenue
      : scenario.initialCost + scenario.monthlyCost;

  return {
    revenueRequired: roundTo(revenueRequired),
    paybackDays: roundTo(safeDivide(scenario.initialCost, Math.max(dailyNetCapacity, 1))),
    dailyNetCapacity,
    impactOnObjective: roundTo(context.monthlyObjective - revenueRequired),
  };
}
