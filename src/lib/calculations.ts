import {
  AppSettings,
  DashboardStats,
  Decision,
  LIMIT_NET_HOURLY,
  MONTHLY_TARGET,
  MaintenanceAlert,
  MaintenanceSettings,
  TARGET_NET_HOURLY,
  TripInput,
  TripRecord,
  VehicleSettings,
} from "../types";

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeDivide(value: number, divisor: number): number {
  return divisor > 0 ? value / divisor : 0;
}

export function getMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function calculateMaintenanceCostPerKm(settings: MaintenanceSettings): number {
  const oilPerKm = safeDivide(settings.oilChangeCost, settings.oilChangeIntervalKm);
  const brakesPerKm = safeDivide(settings.brakesCost, settings.brakesIntervalKm);
  const tiresPerKm = safeDivide(settings.tiresCost, settings.tiresIntervalKm);
  const monthlyMaintenancePerKm = safeDivide(
    settings.otherMonthlyMaintenance,
    settings.estimatedKmPerMonth,
  );

  return roundTo(
    oilPerKm +
      brakesPerKm +
      tiresPerKm +
      monthlyMaintenancePerKm +
      settings.extraManualReservePerKm,
    4,
  );
}

export function getDecision(netHourly: number): Decision {
  if (netHourly >= TARGET_NET_HOURLY) {
    return "accepter";
  }

  if (netHourly >= LIMIT_NET_HOURLY) {
    return "limite";
  }

  return "refuser";
}

export function calculateTripMetrics(
  input: TripInput,
  vehicle: VehicleSettings,
  maintenance: MaintenanceSettings,
) {
  const totalMinutes = Math.max(
    input.approachMinutes + input.waitMinutes + input.tripMinutes,
    0,
  );
  const totalKm = Math.max(input.approachKm + input.tripKm, 0);
  const grossRevenue = Math.max(input.priceProposed, 0);
  const maintenanceCostPerKm = calculateMaintenanceCostPerKm(maintenance);

  const fuelCost =
    totalKm * safeDivide(vehicle.fuelConsumptionPer100Km, 100) * vehicle.fuelPricePerLiter;
  const insuranceAllocated =
    safeDivide(
      vehicle.monthlyInsurance,
      vehicle.workingDaysPerMonth * vehicle.workingHoursPerDay * 60,
    ) * totalMinutes;
  const maintenanceReserved = totalKm * maintenanceCostPerKm;
  const totalCosts = fuelCost + insuranceAllocated + maintenanceReserved;
  const netIncome = grossRevenue - totalCosts;
  const grossHourly = safeDivide(grossRevenue, totalMinutes) * 60;
  const netHourly = safeDivide(netIncome, totalMinutes) * 60;
  const minimumPriceWithCosts = TARGET_NET_HOURLY * safeDivide(totalMinutes, 60) + totalCosts;
  const gap = grossRevenue - minimumPriceWithCosts;

  return {
    grossRevenue: roundTo(grossRevenue),
    totalMinutes: roundTo(totalMinutes),
    totalKm: roundTo(totalKm),
    fuelCost: roundTo(fuelCost),
    insuranceAllocated: roundTo(insuranceAllocated),
    maintenanceReserved: roundTo(maintenanceReserved),
    maintenanceCostPerKm: roundTo(maintenanceCostPerKm, 4),
    totalCosts: roundTo(totalCosts),
    netIncome: roundTo(netIncome),
    grossHourly: roundTo(grossHourly),
    netHourly: roundTo(netHourly),
    minimumPriceWithCosts: roundTo(minimumPriceWithCosts),
    gap: roundTo(gap),
    decision: getDecision(netHourly),
  };
}

function buildId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildTripRecord(input: TripInput, settings: AppSettings): TripRecord {
  const metrics = calculateTripMetrics(input, settings.vehicle, settings.maintenance);

  return {
    id: buildId(),
    createdAt: new Date().toISOString(),
    month: getMonthFromDate(input.date),
    ...input,
    ...metrics,
  };
}

export function calculateDashboardStats(
  trips: TripRecord[],
  month: string,
  workingDaysPerMonth: number,
): DashboardStats {
  const monthTrips = trips.filter((trip) => trip.month === month);
  const grossRevenue = monthTrips.reduce((sum, trip) => sum + trip.grossRevenue, 0);
  const netIncome = monthTrips.reduce((sum, trip) => sum + trip.netIncome, 0);
  const totalMinutes = monthTrips.reduce((sum, trip) => sum + trip.totalMinutes, 0);
  const drivenKm = monthTrips.reduce((sum, trip) => sum + trip.totalKm, 0);
  const activeDays = new Set(monthTrips.map((trip) => trip.date)).size;
  const workedHours = safeDivide(totalMinutes, 60);
  const remainingGoal = Math.max(MONTHLY_TARGET - grossRevenue, 0);
  const plannedDaysLeft = Math.max(workingDaysPerMonth - activeDays, 0);

  return {
    grossRevenue: roundTo(grossRevenue),
    netIncome: roundTo(netIncome),
    remainingGoal: roundTo(remainingGoal),
    achievedPercentage: roundTo(safeDivide(grossRevenue, MONTHLY_TARGET) * 100),
    activeDays,
    workedHours: roundTo(workedHours),
    drivenKm: roundTo(drivenKm),
    averageGrossHourly: roundTo(safeDivide(grossRevenue, workedHours)),
    averageNetHourly: roundTo(safeDivide(netIncome, workedHours)),
    averageGrossPerActiveDay: roundTo(safeDivide(grossRevenue, activeDays)),
    remainingPerPlannedDay:
      remainingGoal === 0
        ? 0
        : plannedDaysLeft > 0
          ? roundTo(remainingGoal / plannedDaysLeft)
          : null,
    daysNeededAt300: remainingGoal === 0 ? 0 : Math.ceil(remainingGoal / 300),
  };
}

function buildSingleMaintenanceAlert(
  label: string,
  currentMileage: number,
  lastMaintenanceKm: number,
  intervalKm: number,
): MaintenanceAlert {
  const nextKm = lastMaintenanceKm + intervalKm;
  const remainingKm = nextKm - currentMileage;
  const warningBuffer = Math.max(intervalKm * 0.1, 500);

  let status: MaintenanceAlert["status"] = "ok";

  if (currentMileage >= nextKm) {
    status = "maintenant";
  } else if (currentMileage >= nextKm - warningBuffer) {
    status = "bientot";
  }

  return {
    label,
    nextKm: roundTo(nextKm, 0),
    remainingKm: roundTo(remainingKm, 0),
    status,
  };
}

export function buildMaintenanceAlerts(
  currentMileage: number,
  maintenance: MaintenanceSettings,
): MaintenanceAlert[] {
  return [
    buildSingleMaintenanceAlert(
      "Vidange",
      currentMileage,
      maintenance.lastOilChangeKm,
      maintenance.oilChangeIntervalKm,
    ),
    buildSingleMaintenanceAlert(
      "Freins",
      currentMileage,
      maintenance.lastBrakesChangeKm,
      maintenance.brakesIntervalKm,
    ),
    buildSingleMaintenanceAlert(
      "Pneus",
      currentMileage,
      maintenance.lastTiresChangeKm,
      maintenance.tiresIntervalKm,
    ),
  ];
}

function escapeCsvValue(value: string | number): string {
  const normalized = String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildMonthlyCsv(trips: TripRecord[], month: string): string {
  const monthTrips = trips.filter((trip) => trip.month === month);
  const headers = [
    "Date",
    "Mois",
    "Prix propose",
    "Temps approche",
    "Temps attente",
    "Temps course",
    "Temps total",
    "Km approche",
    "Km course",
    "Km total",
    "Carburant",
    "Assurance",
    "Entretien",
    "Frais totaux",
    "Net reel",
    "EUR/h brut",
    "EUR/h net",
    "Prix minimum",
    "Ecart",
    "Decision",
    "Zone",
    "Note",
    "Commentaire",
  ];

  const rows = monthTrips.map((trip) =>
    [
      trip.date,
      trip.month,
      trip.priceProposed,
      trip.approachMinutes,
      trip.waitMinutes,
      trip.tripMinutes,
      trip.totalMinutes,
      trip.approachKm,
      trip.tripKm,
      trip.totalKm,
      trip.fuelCost,
      trip.insuranceAllocated,
      trip.maintenanceReserved,
      trip.totalCosts,
      trip.netIncome,
      trip.grossHourly,
      trip.netHourly,
      trip.minimumPriceWithCosts,
      trip.gap,
      trip.decision,
      trip.zone,
      trip.note,
      trip.comment,
    ]
      .map(escapeCsvValue)
      .join(";"),
  );

  return [headers.map(escapeCsvValue).join(";"), ...rows].join("\n");
}
