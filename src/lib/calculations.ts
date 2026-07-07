import {
  AppSettings,
  DashboardStats,
  Decision,
  EnergyType,
  LIMIT_NET_HOURLY,
  MONTHLY_TARGET,
  MaintenanceAlert,
  MaintenanceSettings,
  TARGET_NET_HOURLY,
  TripInput,
  TripRecord,
  VehicleSettings,
  VehicleType,
} from "../types";

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeDivide(value: number, divisor: number): number {
  return divisor > 0 ? value / divisor : 0;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function isElectricVehicle(vehicle: Pick<VehicleSettings, "vehicleType" | "energyType">): boolean {
  return vehicle.vehicleType === "Électrique" || vehicle.energyType === "Électricité";
}

export function getDefaultEnergyTypeForVehicleType(vehicleType: VehicleType): EnergyType {
  if (vehicleType === "Électrique") {
    return "Électricité";
  }

  if (vehicleType === "Diesel") {
    return "Diesel";
  }

  return "SP95-E10";
}

export function getConsumptionUnitLabel(vehicle: Pick<VehicleSettings, "vehicleType" | "energyType">): string {
  return isElectricVehicle(vehicle) ? "kWh/100 km" : "L/100 km";
}

export function getEnergyPriceUnitLabel(vehicle: Pick<VehicleSettings, "vehicleType" | "energyType">): string {
  return isElectricVehicle(vehicle) ? "€/kWh" : "€/L";
}

export function getEnergyCostLabel(vehicle: Pick<VehicleSettings, "vehicleType" | "energyType">): string {
  return isElectricVehicle(vehicle) ? "Coût énergie" : "Coût carburant";
}

export function calculateConfiguredMaintenanceCostPerKm(
  vehicle: Pick<
    VehicleSettings,
    | "estimatedMaintenanceCostPerKm"
    | "estimatedTiresCostPerKm"
    | "estimatedBrakesCostPerKm"
    | "estimatedOilChangeCostPerKm"
  >,
): number {
  return roundTo(
    vehicle.estimatedMaintenanceCostPerKm +
      vehicle.estimatedTiresCostPerKm +
      vehicle.estimatedBrakesCostPerKm +
      vehicle.estimatedOilChangeCostPerKm,
    4,
  );
}

export function calculateAllocatedMinuteCost(
  monthlyCost: number,
  vehicle: Pick<VehicleSettings, "workingDaysPerMonth" | "workingHoursPerDay">,
): number {
  return safeDivide(
    monthlyCost,
    vehicle.workingDaysPerMonth * vehicle.workingHoursPerDay * 60,
  );
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
  _maintenance: MaintenanceSettings,
) {
  const totalMinutes = Math.max(
    input.approachMinutes + input.waitMinutes + input.tripMinutes,
    0,
  );
  const totalKm = Math.max(input.approachKm + input.tripKm, 0);
  const grossRevenue = Math.max(input.priceProposed, 0);
  const maintenanceCostPerKm = calculateConfiguredMaintenanceCostPerKm(vehicle);

  const fuelCost =
    totalKm * safeDivide(vehicle.averageConsumptionPer100Km, 100) * vehicle.energyPricePerUnit;
  const insuranceAllocated =
    calculateAllocatedMinuteCost(vehicle.monthlyInsurance, vehicle) * totalMinutes;
  const fixedCostsAllocated =
    calculateAllocatedMinuteCost(vehicle.monthlyFixedCosts, vehicle) * totalMinutes;
  const maintenanceReserved = totalKm * vehicle.estimatedMaintenanceCostPerKm;
  const tiresCost = totalKm * vehicle.estimatedTiresCostPerKm;
  const brakesCost = totalKm * vehicle.estimatedBrakesCostPerKm;
  const oilChangeCost = totalKm * vehicle.estimatedOilChangeCostPerKm;
  const totalCosts =
    fuelCost +
    insuranceAllocated +
    fixedCostsAllocated +
    maintenanceReserved +
    tiresCost +
    brakesCost +
    oilChangeCost;
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
    fixedCostsAllocated: roundTo(fixedCostsAllocated),
    maintenanceReserved: roundTo(maintenanceReserved),
    tiresCost: roundTo(tiresCost),
    brakesCost: roundTo(brakesCost),
    oilChangeCost: roundTo(oilChangeCost),
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

export function normalizeTripRecord(rawTrip: Partial<TripRecord>): TripRecord {
  const totalMinutes = asFiniteNumber(
    rawTrip.totalMinutes,
    asFiniteNumber(rawTrip.approachMinutes) +
      asFiniteNumber(rawTrip.waitMinutes) +
      asFiniteNumber(rawTrip.tripMinutes),
  );
  const totalKm = asFiniteNumber(
    rawTrip.totalKm,
    asFiniteNumber(rawTrip.approachKm) + asFiniteNumber(rawTrip.tripKm),
  );
  const maintenanceReserved = asFiniteNumber(rawTrip.maintenanceReserved);
  const tiresCost = asFiniteNumber(rawTrip.tiresCost);
  const brakesCost = asFiniteNumber(rawTrip.brakesCost);
  const oilChangeCost = asFiniteNumber(rawTrip.oilChangeCost);
  const fuelCost = asFiniteNumber(rawTrip.fuelCost);
  const insuranceAllocated = asFiniteNumber(rawTrip.insuranceAllocated);
  const fixedCostsAllocated = asFiniteNumber(rawTrip.fixedCostsAllocated);
  const grossRevenue = asFiniteNumber(rawTrip.grossRevenue, asFiniteNumber(rawTrip.priceProposed));
  const totalCosts = asFiniteNumber(
    rawTrip.totalCosts,
    fuelCost +
      insuranceAllocated +
      fixedCostsAllocated +
      maintenanceReserved +
      tiresCost +
      brakesCost +
      oilChangeCost,
  );
  const netIncome = asFiniteNumber(rawTrip.netIncome, grossRevenue - totalCosts);
  const grossHourly = asFiniteNumber(rawTrip.grossHourly, safeDivide(grossRevenue, totalMinutes) * 60);
  const netHourly = asFiniteNumber(rawTrip.netHourly, safeDivide(netIncome, totalMinutes) * 60);
  const minimumPriceWithCosts = asFiniteNumber(
    rawTrip.minimumPriceWithCosts,
    TARGET_NET_HOURLY * safeDivide(totalMinutes, 60) + totalCosts,
  );
  const gap = asFiniteNumber(rawTrip.gap, grossRevenue - minimumPriceWithCosts);
  const maintenanceCostPerKm = asFiniteNumber(
    rawTrip.maintenanceCostPerKm,
    totalKm > 0 ? (maintenanceReserved + tiresCost + brakesCost + oilChangeCost) / totalKm : 0,
  );
  const decision =
    rawTrip.decision === "accepter" ||
    rawTrip.decision === "limite" ||
    rawTrip.decision === "refuser"
      ? rawTrip.decision
      : getDecision(netHourly);

  return {
    id: typeof rawTrip.id === "string" && rawTrip.id ? rawTrip.id : buildId(),
    createdAt:
      typeof rawTrip.createdAt === "string" && rawTrip.createdAt
        ? rawTrip.createdAt
        : new Date().toISOString(),
    month:
      typeof rawTrip.month === "string" && rawTrip.month
        ? rawTrip.month
        : getMonthFromDate(typeof rawTrip.date === "string" ? rawTrip.date : new Date().toISOString()),
    date: typeof rawTrip.date === "string" ? rawTrip.date : new Date().toISOString().slice(0, 10),
    priceProposed: asFiniteNumber(rawTrip.priceProposed),
    approachMinutes: asFiniteNumber(rawTrip.approachMinutes),
    waitMinutes: asFiniteNumber(rawTrip.waitMinutes),
    tripMinutes: asFiniteNumber(rawTrip.tripMinutes),
    approachKm: asFiniteNumber(rawTrip.approachKm),
    tripKm: asFiniteNumber(rawTrip.tripKm),
    note: typeof rawTrip.note === "string" ? rawTrip.note : "",
    zone: typeof rawTrip.zone === "string" ? rawTrip.zone : "",
    comment: typeof rawTrip.comment === "string" ? rawTrip.comment : "",
    grossRevenue: roundTo(grossRevenue),
    totalMinutes: roundTo(totalMinutes),
    totalKm: roundTo(totalKm),
    fuelCost: roundTo(fuelCost),
    insuranceAllocated: roundTo(insuranceAllocated),
    fixedCostsAllocated: roundTo(fixedCostsAllocated),
    maintenanceReserved: roundTo(maintenanceReserved),
    tiresCost: roundTo(tiresCost),
    brakesCost: roundTo(brakesCost),
    oilChangeCost: roundTo(oilChangeCost),
    maintenanceCostPerKm: roundTo(maintenanceCostPerKm, 4),
    totalCosts: roundTo(totalCosts),
    netIncome: roundTo(netIncome),
    grossHourly: roundTo(grossHourly),
    netHourly: roundTo(netHourly),
    minimumPriceWithCosts: roundTo(minimumPriceWithCosts),
    gap: roundTo(gap),
    decision,
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
    "Carburant ou energie",
    "Assurance",
    "Frais fixes",
    "Entretien",
    "Pneus",
    "Freins",
    "Vidange",
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
      trip.fixedCostsAllocated,
      trip.maintenanceReserved,
      trip.tiresCost,
      trip.brakesCost,
      trip.oilChangeCost,
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
