import {
  ActivityEntry,
  ActivityStatus,
  AppSnapshot,
  ChargeEntry,
  ConfidenceLevel,
  CostMode,
  CostSnapshot,
  DashboardStats,
  Decision,
  DepreciationMode,
  EnergyType,
  ExpenseCategory,
  ExpenseEntry,
  FuelEntry,
  GlobalSettings,
  LEGACY_DEFAULT_PLATFORM_ID,
  LEGACY_DEFAULT_VEHICLE_ID,
  LIMIT_NET_HOURLY,
  MONTHLY_TARGET,
  MaintenanceAlert,
  PlatformPerformance,
  PlatformProfile,
  PlatformSnapshot,
  RepairCategory,
  RepairEntry,
  RepairPartEntry,
  QuoteEntry,
  RecoveryScenarioEntry,
  RecoveryScenarioStatus,
  RecoveryScenarioType,
  RepairPartStatus,
  RepairPriority,
  RepairStatus,
  ReminderEntry,
  RentalOfferEntry,
  RentalPowertrain,
  TARGET_NET_HOURLY,
  TimeSlot,
  TripInput,
  TripRecord,
  TravelCalibration,
  TravelEstimate,
  VehicleEnergyMetrics,
  VehiclePerformance,
  VehicleProfile,
  VehicleSnapshot,
  VehicleType,
  WorkDaySummary,
  ZoneStats,
  ZoneType,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_PLATFORM_PROFILES,
  DEFAULT_VEHICLE_PROFILE,
} from "../types";

type EntityLike = { id: string; createdAt: string; updatedAt: string };

interface VehicleActualCostSummary {
  insuranceMonthly: number | null;
  fixedMonthly: number | null;
  maintenancePerKm: number | null;
  tiresPerKm: number | null;
  brakesPerKm: number | null;
  oilPerKm: number | null;
  repairPerKm: number | null;
  repairMonthly: number | null;
  totalMonthSpend: number;
}

interface DepreciationResolution {
  monthlyAmount: number;
  perKmAmount: number;
}

interface ResolvedVehicleCosts {
  energyCostPerKm: number;
  energySource: string;
  insuranceMonthly: number;
  fixedMonthly: number;
  fixedSource: string;
  insuranceSource: string;
  maintenancePerKm: number;
  tiresPerKm: number;
  brakesPerKm: number;
  oilPerKm: number;
  repairPerKm: number;
  repairMonthly: number;
  maintenanceSource: string;
  depreciationMonthly: number;
  depreciationPerKm: number;
  depreciationSource: string;
}

interface FuelInterval {
  month: string;
  consumptionPer100Km: number;
  costPerKm: number;
  amountPaid: number;
}

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

function asString<T extends string | null>(value: unknown, fallback: T): string | T {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function monthToIndex(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + monthNumber;
}

function isMonthIncluded(targetMonth: string, startMonth: string, durationMonths: number): boolean {
  if (durationMonths <= 0) {
    return false;
  }

  const targetIndex = monthToIndex(targetMonth);
  const startIndex = monthToIndex(startMonth);
  return targetIndex >= startIndex && targetIndex < startIndex + durationMonths;
}

function isMaintenanceCategory(category: ExpenseCategory): boolean {
  return (
    category === "Réparation" ||
    category === "Moteur" ||
    category === "Changement moteur" ||
    category === "Vidange" ||
    category === "Pneus" ||
    category === "Freins" ||
    category === "Contrôle technique"
  );
}

function isFixedCategory(category: ExpenseCategory): boolean {
  return (
    category === "Assurance" ||
    category === "Crédit" ||
    category === "Location / LLD / LOA" ||
    category === "Téléphone" ||
    category === "Abonnement application" ||
    category === "Comptabilité" ||
    category === "Frais administratifs"
  );
}

function isRecurringServiceCategory(category: ExpenseCategory): boolean {
  return category === "Parking" || category === "Lavage" || category === "Autre";
}

export function getMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function cloneWithMeta<T extends EntityLike>(entity: T): T {
  return {
    ...entity,
    updatedAt: createTimestamp(),
  };
}

export function createVehicleProfile(partial?: Partial<VehicleProfile>): VehicleProfile {
  const now = createTimestamp();
  const base = DEFAULT_VEHICLE_PROFILE;

  return {
    ...base,
    id: partial?.id ?? buildId("vehicle"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    ...partial,
    maintenance: {
      ...base.maintenance,
      ...(partial?.maintenance ?? {}),
    },
  };
}

export function createPlatformProfile(partial?: Partial<PlatformProfile>): PlatformProfile {
  const now = createTimestamp();
  const base = DEFAULT_PLATFORM_PROFILES.find(
    (platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID,
  ) ?? DEFAULT_PLATFORM_PROFILES[0];

  return {
    ...base,
    id: partial?.id ?? buildId("platform"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    ...partial,
  };
}

export function createExpenseEntry(partial?: Partial<ExpenseEntry>): ExpenseEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("expense"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    date: partial?.date ?? now.slice(0, 10),
    vehicleProfileId: partial?.vehicleProfileId ?? LEGACY_DEFAULT_VEHICLE_ID,
    category: partial?.category ?? "Autre",
    amountTtc: partial?.amountTtc ?? 0,
    mileageAtExpense: partial?.mileageAtExpense ?? 0,
    paymentMethod: partial?.paymentMethod ?? "",
    comment: partial?.comment ?? "",
    receiptReference: partial?.receiptReference ?? "",
    recurring: partial?.recurring ?? false,
    includeInProfitability: partial?.includeInProfitability ?? true,
    amortize: partial?.amortize ?? false,
    amortizationMonths: partial?.amortizationMonths ?? 0,
    amortizationKm: partial?.amortizationKm ?? 0,
  };
}

export function createFuelEntry(partial?: Partial<FuelEntry>): FuelEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("fuel"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    date: partial?.date ?? now.slice(0, 10),
    vehicleProfileId: partial?.vehicleProfileId ?? LEGACY_DEFAULT_VEHICLE_ID,
    odometerKm: partial?.odometerKm ?? 0,
    litersAdded: partial?.litersAdded ?? 0,
    amountPaid: partial?.amountPaid ?? 0,
    pricePerLiter: partial?.pricePerLiter ?? 0,
    station: partial?.station ?? "",
    fullRefill: partial?.fullRefill ?? true,
    comment: partial?.comment ?? "",
  };
}

export function createChargeEntry(partial?: Partial<ChargeEntry>): ChargeEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("charge"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    date: partial?.date ?? now.slice(0, 10),
    vehicleProfileId: partial?.vehicleProfileId ?? LEGACY_DEFAULT_VEHICLE_ID,
    odometerKm: partial?.odometerKm ?? 0,
    kwhAdded: partial?.kwhAdded ?? 0,
    amountPaid: partial?.amountPaid ?? 0,
    pricePerKwh: partial?.pricePerKwh ?? 0,
    location: partial?.location ?? "",
    fullCharge: partial?.fullCharge ?? true,
    comment: partial?.comment ?? "",
  };
}

export function createRepairEntry(partial?: Partial<RepairEntry>): RepairEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("repair"),
    vehicleId: partial?.vehicleId ?? LEGACY_DEFAULT_VEHICLE_ID,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    title: partial?.title ?? "",
    category: partial?.category ?? "Autre",
    description: partial?.description ?? "",
    status: partial?.status ?? "À faire",
    priority: partial?.priority ?? "Normal",
    isBlocking: partial?.isBlocking ?? false,
    odometer: partial?.odometer ?? 0,
    odometerIsApproximate: partial?.odometerIsApproximate ?? false,
    mechanicName: partial?.mechanicName ?? "",
    plannedDate: partial?.plannedDate ?? "",
    completedDate: partial?.completedDate ?? "",
    comment: partial?.comment ?? "",
    partsTotalTtc: partial?.partsTotalTtc ?? 0,
    laborTotalTtc: partial?.laborTotalTtc ?? 0,
    otherFeesTtc: partial?.otherFeesTtc ?? 0,
    totalRepairTtc: partial?.totalRepairTtc ?? 0,
  };
}

export function createRepairPartEntry(partial?: Partial<RepairPartEntry>): RepairPartEntry {
  return {
    id: partial?.id ?? buildId("repair-part"),
    repairId: partial?.repairId ?? "",
    name: partial?.name ?? "",
    amountTtc: partial?.amountTtc ?? 0,
    supplier: partial?.supplier ?? "",
    status: partial?.status ?? "À acheter",
    comment: partial?.comment ?? "",
  };
}

export function getTimeSlotFromTime(time: string): TimeSlot {
  const hour = Number(time.slice(0, 2));

  if (!Number.isFinite(hour)) {
    return "matin";
  }

  if (hour >= 6 && hour < 10) {
    return "matin";
  }

  if (hour >= 10 && hour < 14) {
    return "midi";
  }

  if (hour >= 14 && hour < 17) {
    return "après-midi";
  }

  if (hour >= 17 && hour < 21) {
    return "soir";
  }

  return "nuit";
}

export function getDayOfWeekFromDate(date: string): number {
  const parsedDate = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getDay();
}

export function getConfidenceLevel(sampleCount: number): ConfidenceLevel {
  if (sampleCount > 10) {
    return "bon";
  }

  if (sampleCount >= 3) {
    return "moyen";
  }

  return "faible";
}

export function createQuoteEntry(partial?: Partial<QuoteEntry>): QuoteEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("quote"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    plannedDate: partial?.plannedDate ?? now.slice(0, 10),
    plannedTime: partial?.plannedTime ?? "09:00",
    vehicleProfileId: partial?.vehicleProfileId ?? LEGACY_DEFAULT_VEHICLE_ID,
    costMode: partial?.costMode ?? "estimé",
    tripType: partial?.tripType ?? "Course simple",
    clientName: partial?.clientName ?? "",
    clientPhone: partial?.clientPhone ?? "",
    comment: partial?.comment ?? "",
    pickupZone: partial?.pickupZone ?? "",
    dropoffZone: partial?.dropoffZone ?? "",
    pickupCity: partial?.pickupCity ?? "",
    dropoffCity: partial?.dropoffCity ?? "",
    pickupAddress: partial?.pickupAddress ?? "",
    dropoffAddress: partial?.dropoffAddress ?? "",
    zoneType: partial?.zoneType ?? "Autre",
    approachKm: partial?.approachKm ?? 0,
    tripKm: partial?.tripKm ?? 0,
    approachMinutes: partial?.approachMinutes ?? 0,
    waitMinutes: partial?.waitMinutes ?? 0,
    tripMinutes: partial?.tripMinutes ?? 0,
    tollTtc: partial?.tollTtc ?? 0,
    parkingTtc: partial?.parkingTtc ?? 0,
    extraFeesTtc: partial?.extraFeesTtc ?? 0,
    safetyMarginMode: partial?.safetyMarginMode ?? "10 %",
    manualMarginTtc: partial?.manualMarginTtc ?? 0,
    roundingMode: partial?.roundingMode ?? "5 € supérieurs",
    proposedPriceTtc: partial?.proposedPriceTtc ?? 0,
    status: partial?.status ?? "Brouillon",
    linkedTripId: partial?.linkedTripId ?? "",
  };
}

export function createReminderEntry(partial?: Partial<ReminderEntry>): ReminderEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("reminder"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    vehicleProfileId: partial?.vehicleProfileId ?? LEGACY_DEFAULT_VEHICLE_ID,
    type: partial?.type ?? "Autre",
    title: partial?.title ?? "Rappel",
    triggerType: partial?.triggerType ?? "kilométrage",
    dueDate: partial?.dueDate ?? "",
    dueMileage: partial?.dueMileage ?? 0,
    sourceExpenseId: partial?.sourceExpenseId ?? "",
    comment: partial?.comment ?? "",
    status: partial?.status ?? "OK",
    completedAt: partial?.completedAt ?? "",
    postponedUntil: partial?.postponedUntil ?? "",
  };
}

export function createActivityEntry(partial?: Partial<ActivityEntry>): ActivityEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("activity"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    status: partial?.status ?? "activité normale",
    startDate: partial?.startDate ?? now.slice(0, 10),
    endDate: partial?.endDate ?? "",
    reason: partial?.reason ?? "",
    vehicleId: partial?.vehicleId ?? LEGACY_DEFAULT_VEHICLE_ID,
    comment: partial?.comment ?? "",
    estimatedResumeDate: partial?.estimatedResumeDate ?? "",
    requiredBudget: partial?.requiredBudget ?? 0,
    availableBudget: partial?.availableBudget ?? 0,
    stepsToComplete: partial?.stepsToComplete ?? "",
    restartTasks: partial?.restartTasks ?? "",
  };
}

export function createRentalOfferEntry(partial?: Partial<RentalOfferEntry>): RentalOfferEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("rental-offer"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    providerName: partial?.providerName ?? "",
    vehicleCategory: partial?.vehicleCategory ?? "Berline",
    powertrain: partial?.powertrain ?? "Hybride",
    brand: partial?.brand ?? "",
    model: partial?.model ?? "",
    dailyPrice: partial?.dailyPrice ?? 0,
    weeklyPrice: partial?.weeklyPrice ?? 0,
    monthlyPrice: partial?.monthlyPrice ?? 0,
    securityDeposit: partial?.securityDeposit ?? 0,
    includedKm: partial?.includedKm ?? 0,
    extraKmPrice: partial?.extraKmPrice ?? 0,
    insuranceIncluded: partial?.insuranceIncluded ?? true,
    maintenanceIncluded: partial?.maintenanceIncluded ?? true,
    roadsideAssistanceIncluded: partial?.roadsideAssistanceIncluded ?? true,
    minimumAge: partial?.minimumAge ?? 0,
    minimumLicenseYears: partial?.minimumLicenseYears ?? 0,
    minimumCommitmentDays: partial?.minimumCommitmentDays ?? 1,
    availableFrom: partial?.availableFrom ?? "",
    contactDetails: partial?.contactDetails ?? "",
    notes: partial?.notes ?? "",
  };
}

export function createRecoveryScenarioEntry(
  partial?: Partial<RecoveryScenarioEntry>,
): RecoveryScenarioEntry {
  const now = createTimestamp();

  return {
    id: partial?.id ?? buildId("recovery-scenario"),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    type: partial?.type ?? "Réparer le véhicule actuel",
    title: partial?.title ?? "",
    linkedVehicleId: partial?.linkedVehicleId ?? LEGACY_DEFAULT_VEHICLE_ID,
    linkedRentalOfferId: partial?.linkedRentalOfferId ?? "",
    initialCost: partial?.initialCost ?? 0,
    monthlyCost: partial?.monthlyCost ?? 0,
    possibleResumeDate: partial?.possibleResumeDate ?? "",
    requiredRevenue: partial?.requiredRevenue ?? 0,
    advantages: partial?.advantages ?? "",
    constraints: partial?.constraints ?? "",
    risks: partial?.risks ?? "",
    status: partial?.status ?? "envisagé",
    comment: partial?.comment ?? "",
  };
}

export function createTripInput(
  vehicleProfileId = LEGACY_DEFAULT_VEHICLE_ID,
  platformProfileId = LEGACY_DEFAULT_PLATFORM_ID,
  costMode: CostMode = "estimé",
): TripInput {
  const today = createTimestamp().slice(0, 10);

  return {
    date: today,
    startTime: "09:00",
    vehicleProfileId,
    platformProfileId,
    costMode,
    basePrice: 0,
    tip: 0,
    bonus: 0,
    toll: 0,
    parking: 0,
    approachMinutes: 0,
    waitMinutes: 0,
    tripMinutes: 0,
    approachKm: 0,
    tripKm: 0,
    zone: "",
    pickupZone: "",
    dropoffZone: "",
    pickupCity: "",
    dropoffCity: "",
    zoneType: "Autre",
    timeSlot: "matin",
    estimatedTripMinutes: 0,
    actualTripMinutes: 0,
    estimatedVsActualDifference: 0,
    quoteId: "",
    comment: "",
  };
}

export function isElectricVehicle(vehicle: Pick<VehicleProfile, "vehicleType" | "energyType">): boolean {
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

export function getConsumptionUnitLabel(
  vehicle: Pick<VehicleProfile, "vehicleType" | "energyType">,
): string {
  return isElectricVehicle(vehicle) ? "kWh/100 km" : "L/100 km";
}

export function getEnergyPriceUnitLabel(
  vehicle: Pick<VehicleProfile, "vehicleType" | "energyType">,
): string {
  return isElectricVehicle(vehicle) ? "€/kWh" : "€/L";
}

export function getEnergyCostLabel(vehicle: Pick<VehicleProfile, "vehicleType" | "energyType">): string {
  return isElectricVehicle(vehicle) ? "Coût énergie" : "Coût carburant";
}

export function calculateAllocatedMinuteCost(
  monthlyCost: number,
  vehicle: Pick<VehicleProfile, "plannedWorkDaysPerMonth" | "plannedWorkHoursPerDay">,
): number {
  return safeDivide(
    monthlyCost,
    vehicle.plannedWorkDaysPerMonth * vehicle.plannedWorkHoursPerDay * 60,
  );
}

export function calculateConfiguredMaintenanceCostPerKm(
  vehicle: Pick<
    VehicleProfile,
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

export function calculateMaintenanceCostPerKm(
  vehicle: Pick<
    VehicleProfile,
    | "estimatedMaintenanceCostPerKm"
    | "estimatedTiresCostPerKm"
    | "estimatedBrakesCostPerKm"
    | "estimatedOilChangeCostPerKm"
  >,
): number {
  return calculateConfiguredMaintenanceCostPerKm(vehicle);
}

function calculateEstimatedEnergyCostPerKm(vehicle: VehicleProfile): number {
  return (
    safeDivide(vehicle.estimatedConsumptionPer100Km, 100) * vehicle.estimatedEnergyPricePerUnit
  );
}

function getVehicleSnapshot(vehicle: VehicleProfile): VehicleSnapshot {
  return {
    id: vehicle.id,
    profileName: vehicle.profileName,
    status: vehicle.status,
    vehicleType: vehicle.vehicleType,
    energyType: vehicle.energyType,
    costMode: vehicle.costMode,
  };
}

function getPlatformSnapshot(platform: PlatformProfile): PlatformSnapshot {
  return {
    id: platform.id,
    name: platform.name,
    commissionRate: platform.commissionRate,
    fixedFeePerTrip: platform.fixedFeePerTrip,
  };
}

function calculateVehicleDepreciation(vehicle: VehicleProfile): DepreciationResolution {
  if (!vehicle.includeDepreciation) {
    return { monthlyAmount: 0, perKmAmount: 0 };
  }

  const depreciableAmount = Math.max(
    vehicle.purchasePrice - vehicle.estimatedResaleValue,
    0,
  );
  const monthlyAmount = safeDivide(depreciableAmount, vehicle.amortizationDurationMonths);
  const totalExpectedKm = vehicle.plannedKmPerMonth * vehicle.amortizationDurationMonths;
  const perKmAmount = safeDivide(depreciableAmount, totalExpectedKm);

  if (vehicle.depreciationMode === "mensuel") {
    return { monthlyAmount, perKmAmount: 0 };
  }

  if (vehicle.depreciationMode === "au kilomètre") {
    return { monthlyAmount: 0, perKmAmount };
  }

  return {
    monthlyAmount: monthlyAmount / 2,
    perKmAmount: perKmAmount / 2,
  };
}

function calculateEstimatedFixedCosts(vehicle: VehicleProfile): {
  insuranceMonthly: number;
  fixedMonthly: number;
  depreciationMonthly: number;
  depreciationPerKm: number;
} {
  const depreciation = calculateVehicleDepreciation(vehicle);
  const monthlyIncludedKm = safeDivide(vehicle.leaseIncludedKm, vehicle.leaseDurationMonths);
  const leaseExtraCost =
    vehicle.leaseIncludedKm > 0 && vehicle.leaseDurationMonths > 0
      ? Math.max(vehicle.plannedKmPerMonth - monthlyIncludedKm, 0) * vehicle.leaseExtraKmCost
      : 0;
  const apportMonthly = safeDivide(vehicle.leaseDownPayment, vehicle.leaseDurationMonths);

  const fixedMonthly =
    vehicle.estimatedMonthlyFixedCosts +
    vehicle.creditMonthlyPayment +
    vehicle.leaseMonthlyPayment +
    apportMonthly +
    leaseExtraCost;

  return {
    insuranceMonthly: vehicle.estimatedMonthlyInsurance,
    fixedMonthly,
    depreciationMonthly: depreciation.monthlyAmount,
    depreciationPerKm: depreciation.perKmAmount,
  };
}

function normalizePriceUnit(amountPaid: number, volume: number, providedPrice: number): number {
  if (volume > 0 && amountPaid > 0) {
    return amountPaid / volume;
  }

  return providedPrice;
}

function buildFuelIntervals(entries: FuelEntry[]): FuelInterval[] {
  const fullEntries = [...entries]
    .filter((entry) => entry.fullRefill)
    .sort((a, b) => a.date.localeCompare(b.date) || a.odometerKm - b.odometerKm);
  const intervals: FuelInterval[] = [];

  for (let index = 1; index < fullEntries.length; index += 1) {
    const previous = fullEntries[index - 1];
    const current = fullEntries[index];
    const kmTraveled = current.odometerKm - previous.odometerKm;

    if (kmTraveled <= 0 || current.litersAdded <= 0 || current.amountPaid <= 0) {
      continue;
    }

    intervals.push({
      month: getMonthFromDate(current.date),
      consumptionPer100Km: (current.litersAdded / kmTraveled) * 100,
      costPerKm: current.amountPaid / kmTraveled,
      amountPaid: current.amountPaid,
    });
  }

  return intervals;
}

function buildChargeIntervals(entries: ChargeEntry[]): FuelInterval[] {
  const fullEntries = [...entries]
    .filter((entry) => entry.fullCharge)
    .sort((a, b) => a.date.localeCompare(b.date) || a.odometerKm - b.odometerKm);
  const intervals: FuelInterval[] = [];

  for (let index = 1; index < fullEntries.length; index += 1) {
    const previous = fullEntries[index - 1];
    const current = fullEntries[index];
    const kmTraveled = current.odometerKm - previous.odometerKm;

    if (kmTraveled <= 0 || current.kwhAdded <= 0 || current.amountPaid <= 0) {
      continue;
    }

    intervals.push({
      month: getMonthFromDate(current.date),
      consumptionPer100Km: (current.kwhAdded / kmTraveled) * 100,
      costPerKm: current.amountPaid / kmTraveled,
      amountPaid: current.amountPaid,
    });
  }

  return intervals;
}

function averageIntervals(intervals: FuelInterval[]): { consumption: number | null; costPerKm: number | null } {
  if (intervals.length === 0) {
    return { consumption: null, costPerKm: null };
  }

  return {
    consumption: roundTo(
      intervals.reduce((sum, interval) => sum + interval.consumptionPer100Km, 0) / intervals.length,
    ),
    costPerKm: roundTo(
      intervals.reduce((sum, interval) => sum + interval.costPerKm, 0) / intervals.length,
      4,
    ),
  };
}

export function getVehicleEnergyMetrics(
  vehicle: VehicleProfile,
  month: string,
  fuelEntries: FuelEntry[],
  chargeEntries: ChargeEntry[],
  trips: TripRecord[],
): VehicleEnergyMetrics {
  const relevantFuelEntries = fuelEntries.filter((entry) => entry.vehicleProfileId === vehicle.id);
  const relevantChargeEntries = chargeEntries.filter((entry) => entry.vehicleProfileId === vehicle.id);
  const intervals = isElectricVehicle(vehicle)
    ? buildChargeIntervals(relevantChargeEntries)
    : buildFuelIntervals(relevantFuelEntries);
  const latestInterval = intervals.length > 0 ? intervals[intervals.length - 1] : null;
  const last3Intervals = intervals.slice(-3);
  const monthIntervals = intervals.filter((interval) => interval.month === month);
  const monthSpend = isElectricVehicle(vehicle)
    ? relevantChargeEntries
        .filter((entry) => getMonthFromDate(entry.date) === month)
        .reduce((sum, entry) => sum + entry.amountPaid, 0)
    : relevantFuelEntries
        .filter((entry) => getMonthFromDate(entry.date) === month)
        .reduce((sum, entry) => sum + entry.amountPaid, 0);
  const uniqueDays = new Set(
    (isElectricVehicle(vehicle) ? relevantChargeEntries : relevantFuelEntries)
      .filter((entry) => getMonthFromDate(entry.date) === month)
      .map((entry) => entry.date),
  ).size;
  const tripCount = trips.filter(
    (trip) => trip.vehicleSnapshot.id === vehicle.id && trip.month === month,
  ).length;
  const last3Average = averageIntervals(last3Intervals);
  const monthAverage = averageIntervals(monthIntervals);

  return {
    latestConsumptionPer100Km: latestInterval ? roundTo(latestInterval.consumptionPer100Km) : null,
    averageLast3ConsumptionPer100Km: last3Average.consumption,
    averageMonthConsumptionPer100Km: monthAverage.consumption,
    averageCostPerKm: monthAverage.costPerKm ?? last3Average.costPerKm,
    averageDailyEnergyCost: uniqueDays > 0 ? roundTo(monthSpend / uniqueDays) : null,
    averageEnergyCostPerTrip: tripCount > 0 ? roundTo(monthSpend / tripCount) : null,
    totalMonthSpend: roundTo(monthSpend),
  };
}

function getVehicleActualCosts(
  vehicle: VehicleProfile,
  month: string,
  expenses: ExpenseEntry[],
): VehicleActualCostSummary {
  const vehicleExpenses = expenses.filter((expense) => expense.vehicleProfileId === vehicle.id);
  let insuranceMonthly = 0;
  let fixedMonthly = 0;
  let maintenancePerKm = 0;
  let tiresPerKm = 0;
  let brakesPerKm = 0;
  let oilPerKm = 0;
  let repairPerKm = 0;
  let repairMonthly = 0;
  let totalMonthSpend = 0;
  let hasInsurance = false;
  let hasFixed = false;
  let hasMaintenance = false;
  let hasTires = false;
  let hasBrakes = false;
  let hasOil = false;
  let hasRepair = false;
  let hasRepairMonthly = false;

  for (const expense of vehicleExpenses) {
    const expenseMonth = getMonthFromDate(expense.date);

    if (expenseMonth === month) {
      totalMonthSpend += expense.amountTtc;
    }

    if (!expense.includeInProfitability) {
      continue;
    }

    const recurringApplied = expense.recurring && monthToIndex(month) >= monthToIndex(expenseMonth);
    const monthlyAmortized =
      expense.amortize &&
      expense.amortizationMonths > 0 &&
      isMonthIncluded(month, expenseMonth, expense.amortizationMonths);
    const kmAmortized = expense.amortize && expense.amortizationKm > 0;
    const sameMonth = expenseMonth === month;

    let monthlyShare = 0;
    let perKmShare = 0;

    if (kmAmortized) {
      perKmShare = safeDivide(expense.amountTtc, expense.amortizationKm);
    } else if (monthlyAmortized) {
      monthlyShare = safeDivide(expense.amountTtc, expense.amortizationMonths);
    } else if (recurringApplied) {
      monthlyShare = expense.amountTtc;
    } else if (sameMonth) {
      monthlyShare = expense.amountTtc;
    } else {
      continue;
    }

    if (expense.category === "Assurance") {
      insuranceMonthly += monthlyShare;
      hasInsurance = true;
      continue;
    }

    if (expense.category === "Pneus") {
      if (perKmShare > 0) {
        tiresPerKm += perKmShare;
        hasTires = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
      continue;
    }

    if (expense.category === "Freins") {
      if (perKmShare > 0) {
        brakesPerKm += perKmShare;
        hasBrakes = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
      continue;
    }

    if (expense.category === "Vidange") {
      if (perKmShare > 0) {
        oilPerKm += perKmShare;
        hasOil = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
      continue;
    }

    if (
      expense.category === "Réparation" ||
      expense.category === "Moteur" ||
      expense.category === "Changement moteur"
    ) {
      if (perKmShare > 0) {
        repairPerKm += perKmShare;
        hasRepair = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
      continue;
    }

    if (expense.category === "Contrôle technique") {
      if (perKmShare > 0) {
        maintenancePerKm += perKmShare;
        hasMaintenance = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
      continue;
    }

    if (isFixedCategory(expense.category) || isRecurringServiceCategory(expense.category)) {
      fixedMonthly += monthlyShare;
      hasFixed = true;
      continue;
    }

    if (isMaintenanceCategory(expense.category)) {
      if (perKmShare > 0) {
        maintenancePerKm += perKmShare;
        hasMaintenance = true;
      } else {
        repairMonthly += monthlyShare;
        hasRepairMonthly = true;
      }
    }
  }

  return {
    insuranceMonthly: hasInsurance ? roundTo(insuranceMonthly) : null,
    fixedMonthly: hasFixed ? roundTo(fixedMonthly) : null,
    maintenancePerKm: hasMaintenance ? roundTo(maintenancePerKm, 4) : null,
    tiresPerKm: hasTires ? roundTo(tiresPerKm, 4) : null,
    brakesPerKm: hasBrakes ? roundTo(brakesPerKm, 4) : null,
    oilPerKm: hasOil ? roundTo(oilPerKm, 4) : null,
    repairPerKm: hasRepair ? roundTo(repairPerKm, 4) : null,
    repairMonthly: hasRepairMonthly ? roundTo(repairMonthly) : null,
    totalMonthSpend: roundTo(totalMonthSpend),
  };
}

function resolveValue(
  mode: CostMode,
  actualValue: number | null,
  estimatedValue: number,
  label: string,
): { value: number; source: string } {
  if (mode === "estimé") {
    return { value: estimatedValue, source: `${label} estimé` };
  }

  if (actualValue !== null) {
    return { value: actualValue, source: `${label} réel` };
  }

  if (mode === "réel") {
    return { value: estimatedValue, source: `${label} réel indisponible, estimation utilisée` };
  }

  return { value: estimatedValue, source: `${label} mixte via estimation` };
}

function resolveVehicleCosts(
  vehicle: VehicleProfile,
  mode: CostMode,
  month: string,
  expenses: ExpenseEntry[],
  fuelEntries: FuelEntry[],
  chargeEntries: ChargeEntry[],
  trips: TripRecord[],
): ResolvedVehicleCosts {
  const estimatedCosts = calculateEstimatedFixedCosts(vehicle);
  const actualCosts = getVehicleActualCosts(vehicle, month, expenses);
  const energyMetrics = getVehicleEnergyMetrics(vehicle, month, fuelEntries, chargeEntries, trips);

  const energyResolution = resolveValue(
    mode,
    energyMetrics.averageCostPerKm,
    calculateEstimatedEnergyCostPerKm(vehicle),
    "énergie",
  );
  const insuranceResolution = resolveValue(
    mode,
    actualCosts.insuranceMonthly,
    estimatedCosts.insuranceMonthly,
    "assurance",
  );
  const fixedResolution = resolveValue(
    mode,
    actualCosts.fixedMonthly,
    estimatedCosts.fixedMonthly,
    "frais fixes",
  );
  const maintenanceResolution = resolveValue(
    mode,
    actualCosts.maintenancePerKm,
    vehicle.estimatedMaintenanceCostPerKm,
    "entretien",
  );
  const tiresResolution = resolveValue(
    mode,
    actualCosts.tiresPerKm,
    vehicle.estimatedTiresCostPerKm,
    "pneus",
  );
  const brakesResolution = resolveValue(
    mode,
    actualCosts.brakesPerKm,
    vehicle.estimatedBrakesCostPerKm,
    "freins",
  );
  const oilResolution = resolveValue(
    mode,
    actualCosts.oilPerKm,
    vehicle.estimatedOilChangeCostPerKm,
    "vidange",
  );
  const repairPerKmResolution = resolveValue(mode, actualCosts.repairPerKm, 0, "réparations");
  const repairMonthlyResolution = resolveValue(mode, actualCosts.repairMonthly, 0, "réparations");

  return {
    energyCostPerKm: roundTo(energyResolution.value, 4),
    energySource: energyResolution.source,
    insuranceMonthly: roundTo(insuranceResolution.value),
    fixedMonthly: roundTo(fixedResolution.value),
    fixedSource: fixedResolution.source,
    insuranceSource: insuranceResolution.source,
    maintenancePerKm: roundTo(maintenanceResolution.value, 4),
    tiresPerKm: roundTo(tiresResolution.value, 4),
    brakesPerKm: roundTo(brakesResolution.value, 4),
    oilPerKm: roundTo(oilResolution.value, 4),
    repairPerKm: roundTo(repairPerKmResolution.value, 4),
    repairMonthly: roundTo(repairMonthlyResolution.value),
    maintenanceSource:
      `${maintenanceResolution.source}, ${tiresResolution.source}, ${brakesResolution.source}, ${oilResolution.source}`,
    depreciationMonthly: roundTo(estimatedCosts.depreciationMonthly),
    depreciationPerKm: roundTo(estimatedCosts.depreciationPerKm, 4),
    depreciationSource: vehicle.includeDepreciation
      ? `amortissement ${vehicle.depreciationMode}`
      : "amortissement désactivé",
  };
}

function buildDecisionReason(
  vehicle: VehicleProfile,
  platform: PlatformProfile,
  totalMinutes: number,
  approachMinutes: number,
  netHourly: number,
  energyCost: number,
  commissionAmount: number,
  fixedCostsAllocated: number,
): string {
  if (netHourly >= TARGET_NET_HOURLY) {
    return `Rentable avec ${vehicle.profileName}`;
  }

  if (approachMinutes > totalMinutes / 2) {
    return "Refuser : temps d’approche trop long";
  }

  if (commissionAmount > energyCost + fixedCostsAllocated && platform.commissionRate > 0) {
    return "Refuser : commission plateforme trop élevée";
  }

  if (vehicle.possessionMode === "LLD" || vehicle.possessionMode === "LOA") {
    return `Refuser : frais ${vehicle.profileName} trop élevés`;
  }

  if (netHourly >= LIMIT_NET_HOURLY) {
    return "Limite : carburant + commission trop élevés";
  }

  return "Refuser : marge nette trop faible";
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
  vehicle: VehicleProfile,
  platform: PlatformProfile,
  context: {
    expenses: ExpenseEntry[];
    fuelEntries: FuelEntry[];
    chargeEntries: ChargeEntry[];
    trips: TripRecord[];
  },
) {
  const totalMinutes = Math.max(
    input.approachMinutes + input.waitMinutes + input.tripMinutes,
    0,
  );
  const totalKm = Math.max(input.approachKm + input.tripKm, 0);
  const grossRevenue = Math.max(input.basePrice + input.tip + input.bonus, 0);
  const platformCommissionAmount =
    Math.max(input.basePrice, 0) * safeDivide(platform.commissionRate, 100) +
    platform.fixedFeePerTrip;
  const revenueAfterCommission = grossRevenue - platformCommissionAmount;
  const month = getMonthFromDate(input.date);
  const resolvedCosts = resolveVehicleCosts(
    vehicle,
    input.costMode,
    month,
    context.expenses,
    context.fuelEntries,
    context.chargeEntries,
    context.trips,
  );

  const energyCost = totalKm * resolvedCosts.energyCostPerKm;
  const insuranceAllocated =
    calculateAllocatedMinuteCost(resolvedCosts.insuranceMonthly, vehicle) * totalMinutes;
  const fixedCostsAllocated =
    calculateAllocatedMinuteCost(resolvedCosts.fixedMonthly, vehicle) * totalMinutes;
  const depreciationAllocated =
    calculateAllocatedMinuteCost(resolvedCosts.depreciationMonthly, vehicle) * totalMinutes +
    resolvedCosts.depreciationPerKm * totalKm;
  const maintenanceReserved = totalKm * resolvedCosts.maintenancePerKm;
  const tiresCost = totalKm * resolvedCosts.tiresPerKm;
  const brakesCost = totalKm * resolvedCosts.brakesPerKm;
  const oilChangeCost = totalKm * resolvedCosts.oilPerKm;
  const repairAllocated =
    totalKm * resolvedCosts.repairPerKm +
    calculateAllocatedMinuteCost(resolvedCosts.repairMonthly, vehicle) * totalMinutes;
  const tollCost = Math.max(input.toll, 0);
  const parkingCost = Math.max(input.parking, 0);
  const totalCosts =
    energyCost +
    insuranceAllocated +
    fixedCostsAllocated +
    depreciationAllocated +
    maintenanceReserved +
    tiresCost +
    brakesCost +
    oilChangeCost +
    repairAllocated +
    tollCost +
    parkingCost;
  const netIncome = revenueAfterCommission - totalCosts;
  const grossHourly = safeDivide(grossRevenue, totalMinutes) * 60;
  const netHourly = safeDivide(netIncome, totalMinutes) * 60;
  const totalCostPerKm = safeDivide(totalCosts, totalKm);
  const minimumPriceWithCosts = TARGET_NET_HOURLY * safeDivide(totalMinutes, 60) + totalCosts;
  const gap = revenueAfterCommission - minimumPriceWithCosts;
  const decision = getDecision(netHourly);
  const decisionReason = buildDecisionReason(
    vehicle,
    platform,
    totalMinutes,
    input.approachMinutes,
    netHourly,
    energyCost,
    platformCommissionAmount,
    fixedCostsAllocated,
  );

  const costSnapshot: CostSnapshot = {
    energySource: resolvedCosts.energySource,
    fixedSource: resolvedCosts.fixedSource,
    maintenanceSource: resolvedCosts.maintenanceSource,
    depreciationSource: resolvedCosts.depreciationSource,
    energyCostPerKmUsed: roundTo(resolvedCosts.energyCostPerKm, 4),
    fixedMonthlyCostUsed: roundTo(resolvedCosts.fixedMonthly),
    insuranceMonthlyUsed: roundTo(resolvedCosts.insuranceMonthly),
    maintenancePerKmUsed: roundTo(resolvedCosts.maintenancePerKm, 4),
    tiresPerKmUsed: roundTo(resolvedCosts.tiresPerKm, 4),
    brakesPerKmUsed: roundTo(resolvedCosts.brakesPerKm, 4),
    oilPerKmUsed: roundTo(resolvedCosts.oilPerKm, 4),
    repairPerKmUsed: roundTo(resolvedCosts.repairPerKm, 4),
    depreciationMonthlyUsed: roundTo(resolvedCosts.depreciationMonthly),
    depreciationPerKmUsed: roundTo(resolvedCosts.depreciationPerKm, 4),
    commissionRateUsed: roundTo(platform.commissionRate, 2),
    fixedFeePerTripUsed: roundTo(platform.fixedFeePerTrip),
  };

  return {
    costSnapshot,
    grossRevenue: roundTo(grossRevenue),
    platformCommissionAmount: roundTo(platformCommissionAmount),
    revenueAfterCommission: roundTo(revenueAfterCommission),
    totalMinutes: roundTo(totalMinutes),
    totalKm: roundTo(totalKm),
    energyCost: roundTo(energyCost),
    insuranceAllocated: roundTo(insuranceAllocated),
    fixedCostsAllocated: roundTo(fixedCostsAllocated),
    depreciationAllocated: roundTo(depreciationAllocated),
    maintenanceReserved: roundTo(maintenanceReserved),
    tiresCost: roundTo(tiresCost),
    brakesCost: roundTo(brakesCost),
    oilChangeCost: roundTo(oilChangeCost),
    repairAllocated: roundTo(repairAllocated),
    tollCost: roundTo(tollCost),
    parkingCost: roundTo(parkingCost),
    totalCosts: roundTo(totalCosts),
    netIncome: roundTo(netIncome),
    grossHourly: roundTo(grossHourly),
    netHourly: roundTo(netHourly),
    totalCostPerKm: roundTo(totalCostPerKm),
    minimumPriceWithCosts: roundTo(minimumPriceWithCosts),
    gap: roundTo(gap),
    decision,
    decisionReason,
  };
}

export function buildTripRecord(
  input: TripInput,
  vehicle: VehicleProfile,
  platform: PlatformProfile,
  context: {
    expenses: ExpenseEntry[];
    fuelEntries: FuelEntry[];
    chargeEntries: ChargeEntry[];
    trips: TripRecord[];
  },
): TripRecord {
  const metrics = calculateTripMetrics(input, vehicle, platform, context);
  const actualTripMinutes = input.actualTripMinutes || input.tripMinutes;
  const estimatedVsActualDifference =
    input.estimatedTripMinutes > 0 ? actualTripMinutes - input.estimatedTripMinutes : 0;

  return {
    id: buildId("trip"),
    createdAt: createTimestamp(),
    month: getMonthFromDate(input.date),
    vehicleSnapshot: getVehicleSnapshot(vehicle),
    platformSnapshot: getPlatformSnapshot(platform),
    ...input,
    timeSlot: input.timeSlot || getTimeSlotFromTime(input.startTime),
    actualTripMinutes,
    estimatedVsActualDifference: roundTo(estimatedVsActualDifference),
    ...metrics,
  };
}

export function normalizeVehicleProfile(rawValue: unknown): VehicleProfile {
  const source = isRecord(rawValue) ? rawValue : {};
  const maintenanceSource = isRecord(source.maintenance) ? source.maintenance : {};

  return createVehicleProfile({
    id: asString(source.id, buildId("vehicle")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    profileName: asString(source.profileName ?? source.vehicleName, DEFAULT_VEHICLE_PROFILE.profileName),
    brand: asString(source.brand, DEFAULT_VEHICLE_PROFILE.brand),
    model: asString(source.model, DEFAULT_VEHICLE_PROFILE.model),
    year: asFiniteNumber(source.year, DEFAULT_VEHICLE_PROFILE.year),
    nickname: asString(source.nickname, DEFAULT_VEHICLE_PROFILE.nickname),
    currentMileage: asFiniteNumber(source.currentMileage, DEFAULT_VEHICLE_PROFILE.currentMileage),
    startingMileage: asFiniteNumber(
      source.startingMileage ?? source.purchaseMileage,
      DEFAULT_VEHICLE_PROFILE.startingMileage,
    ),
    status: asString(source.status, DEFAULT_VEHICLE_PROFILE.status) as VehicleProfile["status"],
    vehicleType: asString(
      source.vehicleType,
      DEFAULT_VEHICLE_PROFILE.vehicleType,
    ) as VehicleProfile["vehicleType"],
    energyType: asString(
      source.energyType,
      DEFAULT_VEHICLE_PROFILE.energyType,
    ) as VehicleProfile["energyType"],
    estimatedConsumptionPer100Km: asFiniteNumber(
      source.estimatedConsumptionPer100Km ?? source.averageConsumptionPer100Km ?? source.fuelConsumptionPer100Km,
      DEFAULT_VEHICLE_PROFILE.estimatedConsumptionPer100Km,
    ),
    estimatedEnergyPricePerUnit: asFiniteNumber(
      source.estimatedEnergyPricePerUnit ?? source.energyPricePerUnit ?? source.fuelPricePerLiter,
      DEFAULT_VEHICLE_PROFILE.estimatedEnergyPricePerUnit,
    ),
    estimatedMaintenanceCostPerKm: asFiniteNumber(
      source.estimatedMaintenanceCostPerKm,
      DEFAULT_VEHICLE_PROFILE.estimatedMaintenanceCostPerKm,
    ),
    estimatedTiresCostPerKm: asFiniteNumber(
      source.estimatedTiresCostPerKm,
      DEFAULT_VEHICLE_PROFILE.estimatedTiresCostPerKm,
    ),
    estimatedBrakesCostPerKm: asFiniteNumber(
      source.estimatedBrakesCostPerKm,
      DEFAULT_VEHICLE_PROFILE.estimatedBrakesCostPerKm,
    ),
    estimatedOilChangeCostPerKm: asFiniteNumber(
      source.estimatedOilChangeCostPerKm,
      DEFAULT_VEHICLE_PROFILE.estimatedOilChangeCostPerKm,
    ),
    estimatedMonthlyInsurance: asFiniteNumber(
      source.estimatedMonthlyInsurance ?? source.monthlyInsurance,
      DEFAULT_VEHICLE_PROFILE.estimatedMonthlyInsurance,
    ),
    estimatedMonthlyFixedCosts: asFiniteNumber(
      source.estimatedMonthlyFixedCosts ?? source.monthlyFixedCosts,
      DEFAULT_VEHICLE_PROFILE.estimatedMonthlyFixedCosts,
    ),
    plannedWorkDaysPerMonth: asFiniteNumber(
      source.plannedWorkDaysPerMonth ?? source.workingDaysPerMonth,
      DEFAULT_VEHICLE_PROFILE.plannedWorkDaysPerMonth,
    ),
    plannedWorkHoursPerDay: asFiniteNumber(
      source.plannedWorkHoursPerDay ?? source.workingHoursPerDay,
      DEFAULT_VEHICLE_PROFILE.plannedWorkHoursPerDay,
    ),
    monthlyRevenueTarget: asFiniteNumber(
      source.monthlyRevenueTarget,
      DEFAULT_VEHICLE_PROFILE.monthlyRevenueTarget,
    ),
    plannedKmPerMonth: asFiniteNumber(
      source.plannedKmPerMonth ?? source.estimatedKmPerMonth,
      DEFAULT_VEHICLE_PROFILE.plannedKmPerMonth,
    ),
    costMode: asString(source.costMode, DEFAULT_VEHICLE_PROFILE.costMode) as CostMode,
    possessionMode: asString(
      source.possessionMode,
      DEFAULT_VEHICLE_PROFILE.possessionMode,
    ) as VehicleProfile["possessionMode"],
    purchasePrice: asFiniteNumber(source.purchasePrice, DEFAULT_VEHICLE_PROFILE.purchasePrice),
    purchaseDate: asString(source.purchaseDate, DEFAULT_VEHICLE_PROFILE.purchaseDate),
    purchaseMileage: asFiniteNumber(
      source.purchaseMileage,
      DEFAULT_VEHICLE_PROFILE.purchaseMileage,
    ),
    estimatedResaleValue: asFiniteNumber(
      source.estimatedResaleValue,
      DEFAULT_VEHICLE_PROFILE.estimatedResaleValue,
    ),
    amortizationDurationMonths: asFiniteNumber(
      source.amortizationDurationMonths,
      DEFAULT_VEHICLE_PROFILE.amortizationDurationMonths,
    ),
    creditMonthlyPayment: asFiniteNumber(
      source.creditMonthlyPayment,
      DEFAULT_VEHICLE_PROFILE.creditMonthlyPayment,
    ),
    creditRemainingMonths: asFiniteNumber(
      source.creditRemainingMonths,
      DEFAULT_VEHICLE_PROFILE.creditRemainingMonths,
    ),
    creditRemainingDebt: asFiniteNumber(
      source.creditRemainingDebt,
      DEFAULT_VEHICLE_PROFILE.creditRemainingDebt,
    ),
    leaseMonthlyPayment: asFiniteNumber(
      source.leaseMonthlyPayment,
      DEFAULT_VEHICLE_PROFILE.leaseMonthlyPayment,
    ),
    leaseDownPayment: asFiniteNumber(
      source.leaseDownPayment,
      DEFAULT_VEHICLE_PROFILE.leaseDownPayment,
    ),
    leaseDurationMonths: asFiniteNumber(
      source.leaseDurationMonths,
      DEFAULT_VEHICLE_PROFILE.leaseDurationMonths,
    ),
    leaseIncludedKm: asFiniteNumber(source.leaseIncludedKm, DEFAULT_VEHICLE_PROFILE.leaseIncludedKm),
    leaseExtraKmCost: asFiniteNumber(
      source.leaseExtraKmCost,
      DEFAULT_VEHICLE_PROFILE.leaseExtraKmCost,
    ),
    includeDepreciation:
      typeof source.includeDepreciation === "boolean"
        ? source.includeDepreciation
        : DEFAULT_VEHICLE_PROFILE.includeDepreciation,
    depreciationMode: asString(
      source.depreciationMode,
      DEFAULT_VEHICLE_PROFILE.depreciationMode,
    ) as DepreciationMode,
    maintenance: {
      lastOilChangeKm: asFiniteNumber(
        maintenanceSource.lastOilChangeKm ?? source.lastOilChangeKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.lastOilChangeKm,
      ),
      oilChangeIntervalKm: asFiniteNumber(
        maintenanceSource.oilChangeIntervalKm ?? source.oilChangeIntervalKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.oilChangeIntervalKm,
      ),
      oilChangeCost: asFiniteNumber(
        maintenanceSource.oilChangeCost ?? source.oilChangeCost,
        DEFAULT_VEHICLE_PROFILE.maintenance.oilChangeCost,
      ),
      lastTiresChangeKm: asFiniteNumber(
        maintenanceSource.lastTiresChangeKm ?? source.lastTiresChangeKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.lastTiresChangeKm,
      ),
      tiresIntervalKm: asFiniteNumber(
        maintenanceSource.tiresIntervalKm ?? source.tiresIntervalKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.tiresIntervalKm,
      ),
      tiresCost: asFiniteNumber(
        maintenanceSource.tiresCost ?? source.tiresCost,
        DEFAULT_VEHICLE_PROFILE.maintenance.tiresCost,
      ),
      lastBrakesChangeKm: asFiniteNumber(
        maintenanceSource.lastBrakesChangeKm ?? source.lastBrakesChangeKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.lastBrakesChangeKm,
      ),
      brakesIntervalKm: asFiniteNumber(
        maintenanceSource.brakesIntervalKm ?? source.brakesIntervalKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.brakesIntervalKm,
      ),
      brakesCost: asFiniteNumber(
        maintenanceSource.brakesCost ?? source.brakesCost,
        DEFAULT_VEHICLE_PROFILE.maintenance.brakesCost,
      ),
      recentRepairs: asString(
        maintenanceSource.recentRepairs,
        DEFAULT_VEHICLE_PROFILE.maintenance.recentRepairs,
      ),
      reminders: asString(
        maintenanceSource.reminders,
        DEFAULT_VEHICLE_PROFILE.maintenance.reminders,
      ),
      engineChangedDate: asString(
        maintenanceSource.engineChangedDate,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineChangedDate,
      ),
      engineChangedMileage: asFiniteNumber(
        maintenanceSource.engineChangedMileage,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineChangedMileage,
      ),
      engineChangeCostTtc: asFiniteNumber(
        maintenanceSource.engineChangeCostTtc,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineChangeCostTtc,
      ),
      engineAmortizationMode: asString(
        maintenanceSource.engineAmortizationMode,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineAmortizationMode,
      ) as DepreciationMode,
      engineAmortizationMonths: asFiniteNumber(
        maintenanceSource.engineAmortizationMonths,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineAmortizationMonths,
      ),
      engineAmortizationKm: asFiniteNumber(
        maintenanceSource.engineAmortizationKm,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineAmortizationKm,
      ),
      engineComment: asString(
        maintenanceSource.engineComment,
        DEFAULT_VEHICLE_PROFILE.maintenance.engineComment,
      ),
    },
  });
}

export function normalizePlatformProfile(rawValue: unknown): PlatformProfile {
  const source = isRecord(rawValue) ? rawValue : {};

  return createPlatformProfile({
    id: asString(source.id, buildId("platform")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    name: asString(source.name, "Plateforme"),
    commissionRate: asFiniteNumber(source.commissionRate, 0),
    fixedFeePerTrip: asFiniteNumber(source.fixedFeePerTrip, 0),
    defaultBonus: asFiniteNumber(source.defaultBonus, 0),
    comment: asString(source.comment, ""),
    status: asString(source.status, "actif") as PlatformProfile["status"],
  });
}

export function normalizeExpenseEntry(rawValue: unknown): ExpenseEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createExpenseEntry({
    id: asString(source.id, buildId("expense")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    date: asString(source.date, createTimestamp().slice(0, 10)),
    vehicleProfileId: asString(source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    category: asString(source.category, "Autre") as ExpenseCategory,
    amountTtc: asFiniteNumber(source.amountTtc ?? source.amount, 0),
    mileageAtExpense: asFiniteNumber(source.mileageAtExpense ?? source.mileage, 0),
    paymentMethod: asString(source.paymentMethod, ""),
    comment: asString(source.comment, ""),
    receiptReference: asString(source.receiptReference, ""),
    recurring: Boolean(source.recurring),
    includeInProfitability:
      typeof source.includeInProfitability === "boolean"
        ? source.includeInProfitability
        : true,
    amortize: Boolean(source.amortize),
    amortizationMonths: asFiniteNumber(source.amortizationMonths, 0),
    amortizationKm: asFiniteNumber(source.amortizationKm, 0),
  });
}

export function normalizeFuelEntry(rawValue: unknown): FuelEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createFuelEntry({
    id: asString(source.id, buildId("fuel")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    date: asString(source.date, createTimestamp().slice(0, 10)),
    vehicleProfileId: asString(source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    odometerKm: asFiniteNumber(source.odometerKm ?? source.mileageAtFill ?? source.currentMileage, 0),
    litersAdded: asFiniteNumber(source.litersAdded ?? source.liters, 0),
    amountPaid: asFiniteNumber(source.amountPaid, 0),
    pricePerLiter: normalizePriceUnit(
      asFiniteNumber(source.amountPaid, 0),
      asFiniteNumber(source.litersAdded ?? source.liters, 0),
      asFiniteNumber(source.pricePerLiter, 0),
    ),
    station: asString(source.station, ""),
    fullRefill: typeof source.fullRefill === "boolean" ? source.fullRefill : true,
    comment: asString(source.comment, ""),
  });
}

export function normalizeChargeEntry(rawValue: unknown): ChargeEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createChargeEntry({
    id: asString(source.id, buildId("charge")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    date: asString(source.date, createTimestamp().slice(0, 10)),
    vehicleProfileId: asString(source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    odometerKm: asFiniteNumber(source.odometerKm ?? source.currentMileage, 0),
    kwhAdded: asFiniteNumber(source.kwhAdded ?? source.kwh, 0),
    amountPaid: asFiniteNumber(source.amountPaid, 0),
    pricePerKwh: normalizePriceUnit(
      asFiniteNumber(source.amountPaid, 0),
      asFiniteNumber(source.kwhAdded ?? source.kwh, 0),
      asFiniteNumber(source.pricePerKwh, 0),
    ),
    location: asString(source.location, ""),
    fullCharge: typeof source.fullCharge === "boolean" ? source.fullCharge : true,
    comment: asString(source.comment, ""),
  });
}

export function normalizeRepairEntry(rawValue: unknown): RepairEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  const partsTotalTtc = asFiniteNumber(source.partsTotalTtc, 0);
  const laborTotalTtc = asFiniteNumber(source.laborTotalTtc, 0);
  const otherFeesTtc = asFiniteNumber(source.otherFeesTtc, 0);

  return createRepairEntry({
    id: asString(source.id, buildId("repair")),
    vehicleId: asString(source.vehicleId ?? source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    title: asString(source.title, ""),
    category: asString(source.category, "Autre") as RepairCategory,
    description: asString(source.description, ""),
    status: asString(source.status, "À faire") as RepairStatus,
    priority: asString(source.priority, "Normal") as RepairPriority,
    isBlocking: Boolean(source.isBlocking),
    odometer: asFiniteNumber(source.odometer, 0),
    odometerIsApproximate: Boolean(source.odometerIsApproximate),
    mechanicName: asString(source.mechanicName, ""),
    plannedDate: asString(source.plannedDate, ""),
    completedDate: asString(source.completedDate, ""),
    comment: asString(source.comment, ""),
    partsTotalTtc,
    laborTotalTtc,
    otherFeesTtc,
    totalRepairTtc: asFiniteNumber(source.totalRepairTtc, partsTotalTtc + laborTotalTtc + otherFeesTtc),
  });
}

export function normalizeRepairPartEntry(rawValue: unknown): RepairPartEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createRepairPartEntry({
    id: asString(source.id, buildId("repair-part")),
    repairId: asString(source.repairId, ""),
    name: asString(source.name, ""),
    amountTtc: asFiniteNumber(source.amountTtc, 0),
    supplier: asString(source.supplier, ""),
    status: asString(source.status, "À acheter") as RepairPartStatus,
    comment: asString(source.comment, ""),
  });
}

export function normalizeQuoteEntry(rawValue: unknown): QuoteEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createQuoteEntry({
    id: asString(source.id, buildId("quote")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    plannedDate: asString(source.plannedDate ?? source.date, createTimestamp().slice(0, 10)),
    plannedTime: asString(source.plannedTime ?? source.time, "09:00"),
    vehicleProfileId: asString(source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    costMode: asString(source.costMode, "estimé") as CostMode,
    tripType: asString(source.tripType, "Course simple") as QuoteEntry["tripType"],
    clientName: asString(source.clientName, ""),
    clientPhone: asString(source.clientPhone, ""),
    comment: asString(source.comment, ""),
    pickupZone: asString(source.pickupZone, ""),
    dropoffZone: asString(source.dropoffZone, ""),
    pickupCity: asString(source.pickupCity, ""),
    dropoffCity: asString(source.dropoffCity, ""),
    pickupAddress: asString(source.pickupAddress, ""),
    dropoffAddress: asString(source.dropoffAddress, ""),
    zoneType: asString(source.zoneType, "Autre") as ZoneType,
    approachKm: asFiniteNumber(source.approachKm, 0),
    tripKm: asFiniteNumber(source.tripKm, 0),
    approachMinutes: asFiniteNumber(source.approachMinutes, 0),
    waitMinutes: asFiniteNumber(source.waitMinutes, 0),
    tripMinutes: asFiniteNumber(source.tripMinutes, 0),
    tollTtc: asFiniteNumber(source.tollTtc ?? source.toll, 0),
    parkingTtc: asFiniteNumber(source.parkingTtc ?? source.parking, 0),
    extraFeesTtc: asFiniteNumber(source.extraFeesTtc, 0),
    safetyMarginMode: asString(source.safetyMarginMode, "10 %") as QuoteEntry["safetyMarginMode"],
    manualMarginTtc: asFiniteNumber(source.manualMarginTtc, 0),
    roundingMode: asString(source.roundingMode, "5 € supérieurs") as QuoteEntry["roundingMode"],
    proposedPriceTtc: asFiniteNumber(source.proposedPriceTtc, 0),
    status: asString(source.status, "Brouillon") as QuoteEntry["status"],
    linkedTripId: asString(source.linkedTripId, ""),
  });
}

export function normalizeReminderEntry(rawValue: unknown): ReminderEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createReminderEntry({
    id: asString(source.id, buildId("reminder")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    vehicleProfileId: asString(source.vehicleProfileId, LEGACY_DEFAULT_VEHICLE_ID),
    type: asString(source.type, "Autre") as ReminderEntry["type"],
    title: asString(source.title, "Rappel"),
    triggerType: asString(source.triggerType, "kilométrage") as ReminderEntry["triggerType"],
    dueDate: asString(source.dueDate, ""),
    dueMileage: asFiniteNumber(source.dueMileage, 0),
    sourceExpenseId: asString(source.sourceExpenseId, ""),
    comment: asString(source.comment, ""),
    status: asString(source.status, "OK") as ReminderEntry["status"],
    completedAt: asString(source.completedAt, ""),
    postponedUntil: asString(source.postponedUntil, ""),
  });
}

export function normalizeActivityEntry(rawValue: unknown): ActivityEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createActivityEntry({
    id: asString(source.id, buildId("activity")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    status: asString(
      source.status,
      "activité normale",
    ) as ActivityStatus,
    startDate: asString(source.startDate, createTimestamp().slice(0, 10)),
    endDate: asString(source.endDate, ""),
    reason: asString(source.reason, ""),
    vehicleId: asString(source.vehicleId, LEGACY_DEFAULT_VEHICLE_ID),
    comment: asString(source.comment, ""),
    estimatedResumeDate: asString(source.estimatedResumeDate, ""),
    requiredBudget: asFiniteNumber(source.requiredBudget, 0),
    availableBudget: asFiniteNumber(source.availableBudget, 0),
    stepsToComplete: asString(source.stepsToComplete, ""),
    restartTasks: asString(source.restartTasks, ""),
  });
}

export function normalizeRentalOfferEntry(rawValue: unknown): RentalOfferEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createRentalOfferEntry({
    id: asString(source.id, buildId("rental-offer")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    providerName: asString(source.providerName, ""),
    vehicleCategory: asString(source.vehicleCategory, "Berline"),
    powertrain: asString(source.powertrain, "Hybride") as RentalPowertrain,
    brand: asString(source.brand, ""),
    model: asString(source.model, ""),
    dailyPrice: asFiniteNumber(source.dailyPrice, 0),
    weeklyPrice: asFiniteNumber(source.weeklyPrice, 0),
    monthlyPrice: asFiniteNumber(source.monthlyPrice, 0),
    securityDeposit: asFiniteNumber(source.securityDeposit, 0),
    includedKm: asFiniteNumber(source.includedKm, 0),
    extraKmPrice: asFiniteNumber(source.extraKmPrice, 0),
    insuranceIncluded: source.insuranceIncluded === false ? false : true,
    maintenanceIncluded: source.maintenanceIncluded === false ? false : true,
    roadsideAssistanceIncluded:
      source.roadsideAssistanceIncluded === false ? false : true,
    minimumAge: asFiniteNumber(source.minimumAge, 0),
    minimumLicenseYears: asFiniteNumber(source.minimumLicenseYears, 0),
    minimumCommitmentDays: asFiniteNumber(source.minimumCommitmentDays, 1),
    availableFrom: asString(source.availableFrom, ""),
    contactDetails: asString(source.contactDetails, ""),
    notes: asString(source.notes, ""),
  });
}

export function normalizeRecoveryScenarioEntry(
  rawValue: unknown,
): RecoveryScenarioEntry {
  const source = isRecord(rawValue) ? rawValue : {};

  return createRecoveryScenarioEntry({
    id: asString(source.id, buildId("recovery-scenario")),
    createdAt: asString(source.createdAt, createTimestamp()),
    updatedAt: asString(source.updatedAt, createTimestamp()),
    type: asString(
      source.type,
      "Réparer le véhicule actuel",
    ) as RecoveryScenarioType,
    title: asString(source.title, ""),
    linkedVehicleId: asString(source.linkedVehicleId, LEGACY_DEFAULT_VEHICLE_ID),
    linkedRentalOfferId: asString(source.linkedRentalOfferId, ""),
    initialCost: asFiniteNumber(source.initialCost, 0),
    monthlyCost: asFiniteNumber(source.monthlyCost, 0),
    possibleResumeDate: asString(source.possibleResumeDate, ""),
    requiredRevenue: asFiniteNumber(source.requiredRevenue, 0),
    advantages: asString(source.advantages, ""),
    constraints: asString(source.constraints, ""),
    risks: asString(source.risks, ""),
    status: asString(source.status, "envisagé") as RecoveryScenarioStatus,
    comment: asString(source.comment, ""),
  });
}

export function normalizeGlobalSettings(rawValue: unknown): GlobalSettings {
  const source = isRecord(rawValue) ? rawValue : {};

  return {
    activeVehicleProfileId: asString(
      source.activeVehicleProfileId,
      DEFAULT_GLOBAL_SETTINGS.activeVehicleProfileId,
    ),
    activePlatformProfileId: asString(
      source.activePlatformProfileId,
      DEFAULT_GLOBAL_SETTINGS.activePlatformProfileId,
    ),
    activityStatus: asString(
      source.activityStatus,
      DEFAULT_GLOBAL_SETTINGS.activityStatus,
    ) as GlobalSettings["activityStatus"],
    activeActivityEntryId: asString(
      source.activeActivityEntryId,
      DEFAULT_GLOBAL_SETTINGS.activeActivityEntryId,
    ),
    retainedRecoveryScenarioId: asString(
      source.retainedRecoveryScenarioId,
      DEFAULT_GLOBAL_SETTINGS.retainedRecoveryScenarioId,
    ),
  };
}

export function normalizeTripRecord(
  rawTrip: unknown,
  fallbackVehicle: VehicleProfile,
  fallbackPlatform: PlatformProfile,
): TripRecord {
  const source = isRecord(rawTrip) ? rawTrip : {};
  const costMode = asString(
    source.costModeUsed ?? source.costMode,
    fallbackVehicle.costMode,
  ) as CostMode;
  const totalMinutes = asFiniteNumber(
    source.totalMinutes,
    asFiniteNumber(source.approachMinutes) +
      asFiniteNumber(source.waitMinutes) +
      asFiniteNumber(source.tripMinutes),
  );
  const totalKm = asFiniteNumber(
    source.totalKm,
    asFiniteNumber(source.approachKm) + asFiniteNumber(source.tripKm),
  );
  const basePrice = asFiniteNumber(source.basePrice, asFiniteNumber(source.priceProposed));
  const tip = asFiniteNumber(source.tip, 0);
  const bonus = asFiniteNumber(source.bonus, 0);
  const toll = asFiniteNumber(source.toll ?? source.tollCost, 0);
  const parking = asFiniteNumber(source.parking ?? source.parkingCost, 0);
  const grossRevenue = asFiniteNumber(source.grossRevenue, basePrice + tip + bonus);
  const platformCommissionAmount = asFiniteNumber(source.platformCommissionAmount, 0);
  const revenueAfterCommission = asFiniteNumber(
    source.revenueAfterCommission,
    grossRevenue - platformCommissionAmount,
  );
  const energyCost = asFiniteNumber(
    source.energyCost,
    asFiniteNumber(source.fuelCost),
  );
  const insuranceAllocated = asFiniteNumber(source.insuranceAllocated, 0);
  const fixedCostsAllocated = asFiniteNumber(source.fixedCostsAllocated, 0);
  const depreciationAllocated = asFiniteNumber(source.depreciationAllocated, 0);
  const maintenanceReserved = asFiniteNumber(source.maintenanceReserved, 0);
  const tiresCost = asFiniteNumber(source.tiresCost, 0);
  const brakesCost = asFiniteNumber(source.brakesCost, 0);
  const oilChangeCost = asFiniteNumber(source.oilChangeCost, 0);
  const repairAllocated = asFiniteNumber(source.repairAllocated, 0);
  const tollCost = asFiniteNumber(source.tollCost, toll);
  const parkingCost = asFiniteNumber(source.parkingCost, parking);
  const totalCosts = asFiniteNumber(
    source.totalCosts,
    energyCost +
      insuranceAllocated +
      fixedCostsAllocated +
      depreciationAllocated +
      maintenanceReserved +
      tiresCost +
      brakesCost +
      oilChangeCost +
      repairAllocated +
      tollCost +
      parkingCost,
  );
  const netIncome = asFiniteNumber(source.netIncome, revenueAfterCommission - totalCosts);
  const grossHourly = asFiniteNumber(source.grossHourly, safeDivide(grossRevenue, totalMinutes) * 60);
  const netHourly = asFiniteNumber(source.netHourly, safeDivide(netIncome, totalMinutes) * 60);
  const totalCostPerKm = asFiniteNumber(source.totalCostPerKm, safeDivide(totalCosts, totalKm));
  const minimumPriceWithCosts = asFiniteNumber(
    source.minimumPriceWithCosts,
    TARGET_NET_HOURLY * safeDivide(totalMinutes, 60) + totalCosts,
  );
  const gap = asFiniteNumber(source.gap, revenueAfterCommission - minimumPriceWithCosts);
  const vehicleSnapshotSource = isRecord(source.vehicleSnapshot) ? source.vehicleSnapshot : {};
  const platformSnapshotSource = isRecord(source.platformSnapshot) ? source.platformSnapshot : {};
  const costSnapshotSource = isRecord(source.costSnapshot) ? source.costSnapshot : {};
  const decisionValue = asString(source.decision, "");
  const startTime = asString(source.startTime, "");
  const estimatedTripMinutes = asFiniteNumber(source.estimatedTripMinutes, 0);
  const actualTripMinutes = asFiniteNumber(source.actualTripMinutes, asFiniteNumber(source.tripMinutes, 0));
  const decision =
    decisionValue === "accepter" || decisionValue === "limite" || decisionValue === "refuser"
      ? (decisionValue as Decision)
      : getDecision(netHourly);

  return {
    id: asString(source.id, buildId("trip")),
    createdAt: asString(source.createdAt, createTimestamp()),
    month: asString(source.month, getMonthFromDate(asString(source.date, createTimestamp()))),
    date: asString(source.date, createTimestamp().slice(0, 10)),
    startTime,
    vehicleProfileId: asString(source.vehicleProfileId, fallbackVehicle.id),
    platformProfileId: asString(source.platformProfileId, fallbackPlatform.id),
    costMode,
    basePrice,
    tip,
    bonus,
    toll,
    parking,
    approachMinutes: asFiniteNumber(source.approachMinutes, 0),
    waitMinutes: asFiniteNumber(source.waitMinutes, 0),
    tripMinutes: asFiniteNumber(source.tripMinutes, 0),
    approachKm: asFiniteNumber(source.approachKm, 0),
    tripKm: asFiniteNumber(source.tripKm, 0),
    zone: asString(source.zone, ""),
    pickupZone: asString(source.pickupZone, asString(source.zone, "")),
    dropoffZone: asString(source.dropoffZone, ""),
    pickupCity: asString(source.pickupCity, ""),
    dropoffCity: asString(source.dropoffCity, ""),
    zoneType: asString(source.zoneType, "Autre") as ZoneType,
    timeSlot: asString(source.timeSlot, startTime ? getTimeSlotFromTime(startTime) : "matin") as TimeSlot,
    estimatedTripMinutes,
    actualTripMinutes,
    estimatedVsActualDifference: asFiniteNumber(
      source.estimatedVsActualDifference,
      estimatedTripMinutes > 0 ? actualTripMinutes - estimatedTripMinutes : 0,
    ),
    quoteId: asString(source.quoteId, ""),
    comment: asString(source.comment, asString(source.note, "")),
    vehicleSnapshot: {
      id: asString(vehicleSnapshotSource.id, fallbackVehicle.id),
      profileName: asString(vehicleSnapshotSource.profileName, fallbackVehicle.profileName),
      status: asString(vehicleSnapshotSource.status, fallbackVehicle.status) as VehicleProfile["status"],
      vehicleType: asString(
        vehicleSnapshotSource.vehicleType,
        fallbackVehicle.vehicleType,
      ) as VehicleProfile["vehicleType"],
      energyType: asString(
        vehicleSnapshotSource.energyType,
        fallbackVehicle.energyType,
      ) as VehicleProfile["energyType"],
      costMode: asString(vehicleSnapshotSource.costMode, fallbackVehicle.costMode) as CostMode,
    },
    platformSnapshot: {
      id: asString(platformSnapshotSource.id, fallbackPlatform.id),
      name: asString(platformSnapshotSource.name, fallbackPlatform.name),
      commissionRate: asFiniteNumber(
        platformSnapshotSource.commissionRate,
        fallbackPlatform.commissionRate,
      ),
      fixedFeePerTrip: asFiniteNumber(
        platformSnapshotSource.fixedFeePerTrip,
        fallbackPlatform.fixedFeePerTrip,
      ),
    },
    costSnapshot: {
      energySource: asString(costSnapshotSource.energySource, "énergie estimée"),
      fixedSource: asString(costSnapshotSource.fixedSource, "frais fixes estimés"),
      maintenanceSource: asString(costSnapshotSource.maintenanceSource, "entretien estimé"),
      depreciationSource: asString(costSnapshotSource.depreciationSource, "amortissement désactivé"),
      energyCostPerKmUsed: asFiniteNumber(costSnapshotSource.energyCostPerKmUsed, 0),
      fixedMonthlyCostUsed: asFiniteNumber(costSnapshotSource.fixedMonthlyCostUsed, 0),
      insuranceMonthlyUsed: asFiniteNumber(costSnapshotSource.insuranceMonthlyUsed, 0),
      maintenancePerKmUsed: asFiniteNumber(costSnapshotSource.maintenancePerKmUsed, 0),
      tiresPerKmUsed: asFiniteNumber(costSnapshotSource.tiresPerKmUsed, 0),
      brakesPerKmUsed: asFiniteNumber(costSnapshotSource.brakesPerKmUsed, 0),
      oilPerKmUsed: asFiniteNumber(costSnapshotSource.oilPerKmUsed, 0),
      repairPerKmUsed: asFiniteNumber(costSnapshotSource.repairPerKmUsed, 0),
      depreciationMonthlyUsed: asFiniteNumber(costSnapshotSource.depreciationMonthlyUsed, 0),
      depreciationPerKmUsed: asFiniteNumber(costSnapshotSource.depreciationPerKmUsed, 0),
      commissionRateUsed: asFiniteNumber(costSnapshotSource.commissionRateUsed, 0),
      fixedFeePerTripUsed: asFiniteNumber(costSnapshotSource.fixedFeePerTripUsed, 0),
    },
    grossRevenue: roundTo(grossRevenue),
    platformCommissionAmount: roundTo(platformCommissionAmount),
    revenueAfterCommission: roundTo(revenueAfterCommission),
    totalMinutes: roundTo(totalMinutes),
    totalKm: roundTo(totalKm),
    energyCost: roundTo(energyCost),
    insuranceAllocated: roundTo(insuranceAllocated),
    fixedCostsAllocated: roundTo(fixedCostsAllocated),
    depreciationAllocated: roundTo(depreciationAllocated),
    maintenanceReserved: roundTo(maintenanceReserved),
    tiresCost: roundTo(tiresCost),
    brakesCost: roundTo(brakesCost),
    oilChangeCost: roundTo(oilChangeCost),
    repairAllocated: roundTo(repairAllocated),
    tollCost: roundTo(tollCost),
    parkingCost: roundTo(parkingCost),
    totalCosts: roundTo(totalCosts),
    netIncome: roundTo(netIncome),
    grossHourly: roundTo(grossHourly),
    netHourly: roundTo(netHourly),
    totalCostPerKm: roundTo(totalCostPerKm),
    minimumPriceWithCosts: roundTo(minimumPriceWithCosts),
    gap: roundTo(gap),
    decision,
    decisionReason: asString(source.decisionReason, formatDecisionLabel(decision)),
  };
}

export function createLegacyVehicleProfile(legacyVehicle: unknown, legacyMaintenance: unknown): VehicleProfile {
  const merged = isRecord(legacyVehicle) ? { ...legacyVehicle } : {};

  if (isRecord(legacyMaintenance)) {
    merged.maintenance = {
      lastOilChangeKm: legacyMaintenance.lastOilChangeKm,
      oilChangeIntervalKm: legacyMaintenance.oilChangeIntervalKm,
      oilChangeCost: legacyMaintenance.oilChangeCost,
      lastTiresChangeKm: legacyMaintenance.lastTiresChangeKm,
      tiresIntervalKm: legacyMaintenance.tiresIntervalKm,
      tiresCost: legacyMaintenance.tiresCost,
      lastBrakesChangeKm: legacyMaintenance.lastBrakesChangeKm,
      brakesIntervalKm: legacyMaintenance.brakesIntervalKm,
      brakesCost: legacyMaintenance.brakesCost,
      recentRepairs: "",
      reminders: "",
    };
  }

  return normalizeVehicleProfile({
    ...merged,
    id: LEGACY_DEFAULT_VEHICLE_ID,
    profileName: asString(
      isRecord(legacyVehicle) ? legacyVehicle.vehicleName : "",
      "Véhicule par défaut",
    ),
  });
}

export function getDefaultPlatformProfiles(): PlatformProfile[] {
  const now = createTimestamp();
  return DEFAULT_PLATFORM_PROFILES.map((platform) => ({
    ...platform,
    createdAt: platform.createdAt || now,
    updatedAt: platform.updatedAt || now,
  }));
}

export function normalizeLegacyOrCurrentSnapshot(
  rawSnapshot: unknown,
): {
  globalSettings: GlobalSettings;
  vehicles: VehicleProfile[];
  platforms: PlatformProfile[];
  expenses: ExpenseEntry[];
  fuelEntries: FuelEntry[];
  chargeEntries: ChargeEntry[];
  repairEntries: RepairEntry[];
  repairPartEntries: RepairPartEntry[];
  quoteEntries: QuoteEntry[];
  reminderEntries: ReminderEntry[];
  activityEntries: ActivityEntry[];
  rentalOffers: RentalOfferEntry[];
  recoveryScenarios: RecoveryScenarioEntry[];
  trips: TripRecord[];
} {
  const snapshot = isRecord(rawSnapshot) ? rawSnapshot : {};
  const vehicles =
    Array.isArray(snapshot.vehicles) && snapshot.vehicles.length > 0
      ? snapshot.vehicles.map(normalizeVehicleProfile)
      : [createLegacyVehicleProfile(snapshot.settings && isRecord(snapshot.settings) ? snapshot.settings.vehicle : null, snapshot.settings && isRecord(snapshot.settings) ? snapshot.settings.maintenance : null)];
  const platforms =
    Array.isArray(snapshot.platforms) && snapshot.platforms.length > 0
      ? snapshot.platforms.map(normalizePlatformProfile)
      : getDefaultPlatformProfiles();
  const fallbackVehicle = vehicles[0];
  const fallbackPlatform =
    platforms.find((platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID) ?? platforms[0];

  return {
    globalSettings: normalizeGlobalSettings(snapshot.globalSettings),
    vehicles,
    platforms,
    expenses: Array.isArray(snapshot.expenses) ? snapshot.expenses.map(normalizeExpenseEntry) : [],
    fuelEntries: Array.isArray(snapshot.fuelEntries) ? snapshot.fuelEntries.map(normalizeFuelEntry) : [],
    chargeEntries: Array.isArray(snapshot.chargeEntries)
      ? snapshot.chargeEntries.map(normalizeChargeEntry)
      : [],
    repairEntries: Array.isArray(snapshot.repairEntries)
      ? snapshot.repairEntries.map(normalizeRepairEntry)
      : [],
    repairPartEntries: Array.isArray(snapshot.repairPartEntries)
      ? snapshot.repairPartEntries.map(normalizeRepairPartEntry)
      : [],
    quoteEntries: Array.isArray(snapshot.quoteEntries)
      ? snapshot.quoteEntries.map(normalizeQuoteEntry)
      : [],
    reminderEntries: Array.isArray(snapshot.reminderEntries)
      ? snapshot.reminderEntries.map(normalizeReminderEntry)
      : [],
    activityEntries: Array.isArray(snapshot.activityEntries)
      ? snapshot.activityEntries.map(normalizeActivityEntry)
      : [],
    rentalOffers: Array.isArray(snapshot.rentalOffers)
      ? snapshot.rentalOffers.map(normalizeRentalOfferEntry)
      : [],
    recoveryScenarios: Array.isArray(snapshot.recoveryScenarios)
      ? snapshot.recoveryScenarios.map(normalizeRecoveryScenarioEntry)
      : [],
    trips: Array.isArray(snapshot.trips)
      ? snapshot.trips.map((trip) => normalizeTripRecord(trip, fallbackVehicle, fallbackPlatform))
      : [],
  };
}

export function calculateDashboardStats(
  trips: TripRecord[],
  expenses: ExpenseEntry[],
  month: string,
): DashboardStats {
  const monthTrips = trips.filter((trip) => trip.month === month);
  const monthExpenses = expenses.filter((expense) => getMonthFromDate(expense.date) === month);
  const grossRevenue = monthTrips.reduce((sum, trip) => sum + trip.grossRevenue, 0);
  const revenueAfterCommission = monthTrips.reduce(
    (sum, trip) => sum + trip.revenueAfterCommission,
    0,
  );
  const netIncome = monthTrips.reduce((sum, trip) => sum + trip.netIncome, 0);
  const totalCosts = monthTrips.reduce((sum, trip) => sum + trip.totalCosts, 0);
  const totalDepreciation = monthTrips.reduce(
    (sum, trip) => sum + trip.depreciationAllocated,
    0,
  );
  const totalEnergyCost = monthTrips.reduce((sum, trip) => sum + trip.energyCost, 0);
  const totalMaintenanceCost = monthTrips.reduce(
    (sum, trip) =>
      sum +
      trip.maintenanceReserved +
      trip.tiresCost +
      trip.brakesCost +
      trip.oilChangeCost +
      trip.repairAllocated,
    0,
  );
  const totalMinutes = monthTrips.reduce((sum, trip) => sum + trip.totalMinutes, 0);
  const drivenKm = monthTrips.reduce((sum, trip) => sum + trip.totalKm, 0);
  const workedHours = safeDivide(totalMinutes, 60);

  return {
    grossRevenue: roundTo(grossRevenue),
    revenueAfterCommission: roundTo(revenueAfterCommission),
    netIncome: roundTo(netIncome),
    totalCosts: roundTo(totalCosts),
    totalExpensesMonth: roundTo(monthExpenses.reduce((sum, expense) => sum + expense.amountTtc, 0)),
    totalDepreciation: roundTo(totalDepreciation),
    totalEnergyCost: roundTo(totalEnergyCost),
    totalMaintenanceCost: roundTo(totalMaintenanceCost),
    tripCount: monthTrips.length,
    drivenKm: roundTo(drivenKm),
    workedHours: roundTo(workedHours),
    averageGrossHourly: roundTo(safeDivide(grossRevenue, workedHours)),
    averageNetHourly: roundTo(safeDivide(netIncome, workedHours)),
    averageCostPerKm: roundTo(safeDivide(totalCosts, drivenKm)),
    netMarginPercentage: roundTo(safeDivide(netIncome, revenueAfterCommission) * 100),
  };
}

export function calculateVehiclePerformances(
  vehicles: VehicleProfile[],
  trips: TripRecord[],
  expenses: ExpenseEntry[],
  fuelEntries: FuelEntry[],
  chargeEntries: ChargeEntry[],
  month: string,
): VehiclePerformance[] {
  return vehicles.map((vehicle) => {
    const vehicleTrips = trips.filter(
      (trip) => trip.vehicleSnapshot.id === vehicle.id && trip.month === month,
    );
    const vehicleExpenses = expenses.filter(
      (expense) => expense.vehicleProfileId === vehicle.id && getMonthFromDate(expense.date) === month,
    );
    const totalMinutes = vehicleTrips.reduce((sum, trip) => sum + trip.totalMinutes, 0);
    const workedHours = safeDivide(totalMinutes, 60);
    const energyMetrics = getVehicleEnergyMetrics(vehicle, month, fuelEntries, chargeEntries, trips);

    return {
      vehicleProfileId: vehicle.id,
      vehicleName: vehicle.profileName,
      grossRevenue: roundTo(vehicleTrips.reduce((sum, trip) => sum + trip.grossRevenue, 0)),
      netIncome: roundTo(vehicleTrips.reduce((sum, trip) => sum + trip.netIncome, 0)),
      totalCosts: roundTo(vehicleTrips.reduce((sum, trip) => sum + trip.totalCosts, 0)),
      totalExpensesMonth: roundTo(vehicleExpenses.reduce((sum, expense) => sum + expense.amountTtc, 0)),
      totalDepreciation: roundTo(
        vehicleTrips.reduce((sum, trip) => sum + trip.depreciationAllocated, 0),
      ),
      drivenKm: roundTo(vehicleTrips.reduce((sum, trip) => sum + trip.totalKm, 0)),
      tripCount: vehicleTrips.length,
      averageNetHourly: roundTo(
        safeDivide(
          vehicleTrips.reduce((sum, trip) => sum + trip.netIncome, 0),
          workedHours,
        ),
      ),
      averageCostPerKm: roundTo(
        safeDivide(
          vehicleTrips.reduce((sum, trip) => sum + trip.totalCosts, 0),
          vehicleTrips.reduce((sum, trip) => sum + trip.totalKm, 0),
        ),
      ),
      averageConsumptionReal:
        energyMetrics.averageMonthConsumptionPer100Km ??
        energyMetrics.averageLast3ConsumptionPer100Km ??
        0,
      averageEnergyCostPerKm: energyMetrics.averageCostPerKm ?? 0,
    };
  });
}

export function calculatePlatformPerformances(
  platforms: PlatformProfile[],
  trips: TripRecord[],
  month: string,
): PlatformPerformance[] {
  return platforms.map((platform) => {
    const platformTrips = trips.filter(
      (trip) => trip.platformSnapshot.id === platform.id && trip.month === month,
    );
    const totalMinutes = platformTrips.reduce((sum, trip) => sum + trip.totalMinutes, 0);
    const workedHours = safeDivide(totalMinutes, 60);

    return {
      platformProfileId: platform.id,
      platformName: platform.name,
      grossRevenue: roundTo(platformTrips.reduce((sum, trip) => sum + trip.grossRevenue, 0)),
      commissionTotal: roundTo(
        platformTrips.reduce((sum, trip) => sum + trip.platformCommissionAmount, 0),
      ),
      netIncome: roundTo(platformTrips.reduce((sum, trip) => sum + trip.netIncome, 0)),
      averageNetHourly: roundTo(
        safeDivide(
          platformTrips.reduce((sum, trip) => sum + trip.netIncome, 0),
          workedHours,
        ),
      ),
      tripCount: platformTrips.length,
    };
  });
}

export function buildMaintenanceAlerts(
  currentMileage: number,
  vehicle: Pick<VehicleProfile, "maintenance">,
): MaintenanceAlert[] {
  const { maintenance } = vehicle;

  function buildAlert(label: string, lastKm: number, intervalKm: number): MaintenanceAlert {
    const nextKm = lastKm + intervalKm;
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

  return [
    buildAlert("Vidange", maintenance.lastOilChangeKm, maintenance.oilChangeIntervalKm),
    buildAlert("Pneus", maintenance.lastTiresChangeKm, maintenance.tiresIntervalKm),
    buildAlert("Freins", maintenance.lastBrakesChangeKm, maintenance.brakesIntervalKm),
  ];
}

function normalizeZoneName(value: string): string {
  return value.trim() || "Zone non renseignée";
}

function getCalibrationKey(
  fromZone: string,
  toZone: string,
  dayOfWeek: number,
  timeSlot: TimeSlot,
  zoneType: ZoneType,
): string {
  return `${normalizeZoneName(fromZone).toLowerCase()}|${normalizeZoneName(toZone).toLowerCase()}|${dayOfWeek}|${timeSlot}|${zoneType}`;
}

export function buildTravelCalibrations(trips: TripRecord[]): TravelCalibration[] {
  const groups = new Map<
    string,
    {
      fromZone: string;
      toZone: string;
      dayOfWeek: number;
      timeSlot: TimeSlot;
      minutesPerKmTotal: number;
      approachMinutesPerKmTotal: number;
      approachSampleCount: number;
      waitMinutesTotal: number;
      sampleCount: number;
      lastUpdated: string;
    }
  >();

  for (const trip of trips) {
    if (trip.tripKm <= 0 || trip.tripMinutes <= 0) {
      continue;
    }

    const fromZoneRaw = trip.pickupZone.trim();
    const toZoneRaw = trip.dropoffZone.trim();

    if (!fromZoneRaw || !toZoneRaw) {
      continue;
    }

    const fromZone = normalizeZoneName(fromZoneRaw);
    const toZone = normalizeZoneName(toZoneRaw);
    const dayOfWeek = getDayOfWeekFromDate(trip.date);
    const timeSlot = trip.timeSlot || getTimeSlotFromTime(trip.startTime);
    const key = getCalibrationKey(fromZone, toZone, dayOfWeek, timeSlot, trip.zoneType);
    const existing = groups.get(key) ?? {
      fromZone,
      toZone,
      dayOfWeek,
      timeSlot,
      minutesPerKmTotal: 0,
      approachMinutesPerKmTotal: 0,
      approachSampleCount: 0,
      waitMinutesTotal: 0,
      sampleCount: 0,
      lastUpdated: trip.createdAt,
    };

    existing.minutesPerKmTotal += trip.tripMinutes / trip.tripKm;
    if (trip.approachKm > 0 && trip.approachMinutes > 0) {
      existing.approachMinutesPerKmTotal += trip.approachMinutes / trip.approachKm;
      existing.approachSampleCount += 1;
    }
    existing.waitMinutesTotal += trip.waitMinutes;
    existing.sampleCount += 1;
    existing.lastUpdated = trip.createdAt > existing.lastUpdated ? trip.createdAt : existing.lastUpdated;
    groups.set(key, existing);
  }

  return [...groups.entries()].map(([id, group]) => ({
    id,
    fromZone: group.fromZone,
    toZone: group.toZone,
    dayOfWeek: group.dayOfWeek,
    timeSlot: group.timeSlot,
    sampleCount: group.sampleCount,
    averageMinutesPerKm: roundTo(group.minutesPerKmTotal / group.sampleCount, 2),
    averageApproachMinutesPerKm: roundTo(
      group.approachSampleCount > 0
        ? safeDivide(group.approachMinutesPerKmTotal, group.approachSampleCount)
        : 3,
      2,
    ),
    averageWaitMinutes: roundTo(group.waitMinutesTotal / group.sampleCount, 2),
    confidenceLevel: getConfidenceLevel(group.sampleCount),
    lastUpdated: group.lastUpdated,
  }));
}

export function estimateTravelFromHistory(
  trips: TripRecord[],
  params: {
    date: string;
    time: string;
    pickupZone: string;
    dropoffZone: string;
    zoneType: ZoneType;
    approachKm: number;
    tripKm: number;
  },
): TravelEstimate {
  if (!params.pickupZone.trim() || !params.dropoffZone.trim() || params.tripKm <= 0) {
    return {
      approachMinutes: roundTo(params.approachKm * 3),
      tripMinutes: roundTo(params.tripKm * 5),
      totalMinutes: roundTo(params.approachKm * 3 + params.tripKm * 5),
      sampleCount: 0,
      confidenceLevel: "faible",
      message: "Renseignez les zones et les kilomètres pour proposer une estimation.",
    };
  }

  const calibrations = buildTravelCalibrations(trips);
  const dayOfWeek = getDayOfWeekFromDate(params.date);
  const timeSlot = getTimeSlotFromTime(params.time);
  const fromZone = normalizeZoneName(params.pickupZone);
  const toZone = normalizeZoneName(params.dropoffZone);
  const exactId = getCalibrationKey(fromZone, toZone, dayOfWeek, timeSlot, params.zoneType);
  const exact = calibrations.find((calibration) => calibration.id === exactId);
  const sameRoute = calibrations.filter(
    (calibration) =>
      calibration.fromZone.toLowerCase() === fromZone.toLowerCase() &&
      calibration.toZone.toLowerCase() === toZone.toLowerCase(),
  );
  const fallbackPool = exact ? [exact] : sameRoute;
  const sampleCount = fallbackPool.reduce((sum, calibration) => sum + calibration.sampleCount, 0);

  if (fallbackPool.length > 0 && sampleCount > 0) {
    const minutesPerKm = safeDivide(
      fallbackPool.reduce(
        (sum, calibration) => sum + calibration.averageMinutesPerKm * calibration.sampleCount,
        0,
      ),
      sampleCount,
    );
    const approachMinutesPerKm = safeDivide(
      fallbackPool.reduce(
        (sum, calibration) =>
          sum + calibration.averageApproachMinutesPerKm * calibration.sampleCount,
        0,
      ),
      sampleCount,
    );
    const waitMinutes = safeDivide(
      fallbackPool.reduce(
        (sum, calibration) => sum + calibration.averageWaitMinutes * calibration.sampleCount,
        0,
      ),
      sampleCount,
    );
    const approachMinutes = roundTo(params.approachKm * approachMinutesPerKm);
    const tripMinutes = roundTo(params.tripKm * minutesPerKm);

    return {
      approachMinutes,
      tripMinutes,
      totalMinutes: roundTo(approachMinutes + waitMinutes + tripMinutes),
      sampleCount,
      confidenceLevel: getConfidenceLevel(sampleCount),
      message: `Estimation basée sur ${sampleCount} course(s) similaire(s).`,
    };
  }

  const defaultTripMinutes = params.tripKm * 5;
  const defaultApproachMinutes = params.approachKm * 3;

  return {
    approachMinutes: roundTo(defaultApproachMinutes),
    tripMinutes: roundTo(defaultTripMinutes),
    totalMinutes: roundTo(defaultApproachMinutes + defaultTripMinutes),
    sampleCount: 0,
    confidenceLevel: "faible",
    message: "Pas assez de données pour cette zone.",
  };
}

function getQuoteMarginAmount(quote: QuoteEntry, minimumPrice: number): number {
  if (quote.safetyMarginMode === "montant manuel") {
    return Math.max(quote.manualMarginTtc, 0);
  }

  const percentage = Number(quote.safetyMarginMode.replace(" %", ""));
  return minimumPrice * safeDivide(Number.isFinite(percentage) ? percentage : 0, 100);
}

function roundQuotePrice(value: number, mode: QuoteEntry["roundingMode"]): number {
  if (mode === "10 € supérieurs") {
    return Math.ceil(value / 10) * 10;
  }

  if (mode === "5 € supérieurs") {
    return Math.ceil(value / 5) * 5;
  }

  return Math.ceil(value);
}

export function calculateQuoteMetrics(
  quote: QuoteEntry,
  vehicle: VehicleProfile,
  context: {
    expenses: ExpenseEntry[];
    fuelEntries: FuelEntry[];
    chargeEntries: ChargeEntry[];
    trips: TripRecord[];
  },
) {
  const privatePlatform: PlatformProfile = {
    id: LEGACY_DEFAULT_PLATFORM_ID,
    createdAt: "",
    updatedAt: "",
    name: "Client privé",
    commissionRate: 0,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  };
  const tripInput: TripInput = {
    ...createTripInput(vehicle.id, privatePlatform.id, quote.costMode),
    date: quote.plannedDate,
    startTime: quote.plannedTime,
    approachMinutes: quote.approachMinutes,
    waitMinutes: quote.waitMinutes,
    tripMinutes: quote.tripMinutes,
    approachKm: quote.approachKm,
    tripKm: quote.tripKm,
    toll: quote.tollTtc,
    parking: quote.parkingTtc,
    pickupZone: quote.pickupZone,
    dropoffZone: quote.dropoffZone,
    pickupCity: quote.pickupCity,
    dropoffCity: quote.dropoffCity,
    zoneType: quote.zoneType,
    timeSlot: getTimeSlotFromTime(quote.plannedTime),
    zone: quote.pickupZone,
    basePrice: quote.proposedPriceTtc,
    comment: quote.comment,
  };
  const metrics = calculateTripMetrics(tripInput, vehicle, privatePlatform, context);
  const estimatedCosts = metrics.totalCosts + Math.max(quote.extraFeesTtc, 0);
  const targetNet = TARGET_NET_HOURLY * safeDivide(metrics.totalMinutes, 60);
  const minimumPriceTtc = estimatedCosts + targetNet;
  const suggestedPriceTtc = minimumPriceTtc + getQuoteMarginAmount(quote, minimumPriceTtc);
  const roundedPriceTtc = roundQuotePrice(suggestedPriceTtc, quote.roundingMode);
  const proposedPriceTtc = quote.proposedPriceTtc || roundedPriceTtc;
  const estimatedNetTtc = proposedPriceTtc - estimatedCosts;
  const estimatedNetHourly = safeDivide(estimatedNetTtc, metrics.totalMinutes) * 60;
  const decision =
    estimatedNetHourly >= TARGET_NET_HOURLY
      ? "rentable"
      : estimatedNetHourly >= LIMIT_NET_HOURLY
        ? "limite"
        : "trop bas";

  return {
    totalMinutes: metrics.totalMinutes,
    totalKm: metrics.totalKm,
    estimatedCostsTtc: roundTo(estimatedCosts),
    targetNetTtc: roundTo(targetNet),
    minimumPriceTtc: roundTo(minimumPriceTtc),
    suggestedPriceTtc: roundTo(suggestedPriceTtc),
    roundedPriceTtc: roundTo(roundedPriceTtc),
    proposedPriceTtc: roundTo(proposedPriceTtc),
    estimatedNetTtc: roundTo(estimatedNetTtc),
    estimatedNetHourly: roundTo(estimatedNetHourly),
    decision,
    warning:
      decision === "rentable"
        ? "Ce devis semble rentable selon les coûts du véhicule."
        : decision === "limite"
          ? "Prix limite : gardez une marge si le trajet s’allonge."
          : `Prix trop bas. Minimum conseillé : ${roundTo(roundedPriceTtc)} €`,
  };
}

export function buildWorkDaySummaries(
  trips: TripRecord[],
  expenses: ExpenseEntry[],
  month: string,
): WorkDaySummary[] {
  const days = new Map<string, WorkDaySummary>();
  const monthTrips = trips.filter((trip) => trip.month === month);
  const monthExpenses = expenses.filter((expense) => getMonthFromDate(expense.date) === month);

  for (const trip of monthTrips) {
    const current = days.get(trip.date) ?? {
      date: trip.date,
      vehicleId: trip.vehicleSnapshot.id,
      totalRevenueTtc: 0,
      totalNetTtc: 0,
      totalExpensesTtc: 0,
      totalHours: 0,
      totalKm: 0,
      courseCount: 0,
      averageNetPerHour: 0,
      mainZone: normalizeZoneName(trip.pickupZone || trip.zone),
      status: "non-travaillé" as WorkDaySummary["status"],
    };

    current.totalRevenueTtc += trip.grossRevenue;
    current.totalNetTtc += trip.netIncome;
    current.totalHours += safeDivide(trip.totalMinutes, 60);
    current.totalKm += trip.totalKm;
    current.courseCount += 1;
    current.mainZone = normalizeZoneName(trip.pickupZone || trip.zone || current.mainZone);
    days.set(trip.date, current);
  }

  for (const expense of monthExpenses) {
    const current = days.get(expense.date) ?? {
      date: expense.date,
      vehicleId: expense.vehicleProfileId,
      totalRevenueTtc: 0,
      totalNetTtc: 0,
      totalExpensesTtc: 0,
      totalHours: 0,
      totalKm: 0,
      courseCount: 0,
      averageNetPerHour: 0,
      mainZone: "",
      status: "non-travaillé" as WorkDaySummary["status"],
    };

    current.totalExpensesTtc += expense.amountTtc;
    current.totalNetTtc -= expense.amountTtc;
    days.set(expense.date, current);
  }

  return [...days.values()]
    .map((day) => {
      const averageNetPerHour = roundTo(safeDivide(day.totalNetTtc, day.totalHours));
      const status: WorkDaySummary["status"] =
        day.courseCount === 0
          ? "non-travaillé"
          : averageNetPerHour >= TARGET_NET_HOURLY
            ? "rentable"
            : averageNetPerHour >= LIMIT_NET_HOURLY
              ? "moyen"
              : "mauvais";

      return {
        ...day,
        totalRevenueTtc: roundTo(day.totalRevenueTtc),
        totalNetTtc: roundTo(day.totalNetTtc),
        totalExpensesTtc: roundTo(day.totalExpensesTtc),
        totalHours: roundTo(day.totalHours),
        totalKm: roundTo(day.totalKm),
        averageNetPerHour,
        status,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateZoneStats(trips: TripRecord[], month?: string): ZoneStats[] {
  const groups = new Map<string, { zone: ZoneStats; totalMinutes: number; totalKm: number }>();
  const filteredTrips = month ? trips.filter((trip) => trip.month === month) : trips;

  for (const trip of filteredTrips) {
    const zoneRaw = (trip.pickupZone || trip.zone).trim();

    if (!zoneRaw) {
      continue;
    }

    const zoneName = normalizeZoneName(zoneRaw);
    const id = `${zoneName.toLowerCase()}|${trip.pickupCity.toLowerCase()}|${trip.zoneType}`;
    const existing =
      groups.get(id) ??
      {
        zone: {
          id,
          zoneName,
          city: trip.pickupCity,
          zoneType: trip.zoneType,
          courseCount: 0,
          totalRevenueTtc: 0,
          totalNetTtc: 0,
          averageNetPerHour: 0,
          averageTripMinutes: 0,
          averageKm: 0,
          averageMinutesPerKm: 0,
          averageWaitMinutes: 0,
        },
        totalMinutes: 0,
        totalKm: 0,
      };

    existing.zone.courseCount += 1;
    existing.zone.totalRevenueTtc += trip.grossRevenue;
    existing.zone.totalNetTtc += trip.netIncome;
    existing.zone.averageTripMinutes += trip.tripMinutes;
    existing.zone.averageKm += trip.tripKm;
    existing.zone.averageWaitMinutes += trip.waitMinutes;
    existing.totalMinutes += trip.totalMinutes;
    existing.totalKm += trip.totalKm;
    groups.set(id, existing);
  }

  return [...groups.values()]
    .map(({ zone, totalMinutes, totalKm }) => ({
      ...zone,
      totalRevenueTtc: roundTo(zone.totalRevenueTtc),
      totalNetTtc: roundTo(zone.totalNetTtc),
      averageNetPerHour: roundTo(safeDivide(zone.totalNetTtc, safeDivide(totalMinutes, 60))),
      averageTripMinutes: roundTo(safeDivide(zone.averageTripMinutes, zone.courseCount)),
      averageKm: roundTo(safeDivide(zone.averageKm, zone.courseCount)),
      averageMinutesPerKm: roundTo(safeDivide(totalMinutes, totalKm)),
      averageWaitMinutes: roundTo(safeDivide(zone.averageWaitMinutes, zone.courseCount)),
    }))
    .sort((a, b) => b.averageNetPerHour - a.averageNetPerHour);
}

export function getReminderDisplayStatus(
  reminder: ReminderEntry,
  vehicle: VehicleProfile | null,
  today = createTimestamp().slice(0, 10),
): ReminderEntry["status"] {
  if (reminder.status === "Fait") {
    return "Fait";
  }

  if (reminder.postponedUntil && reminder.postponedUntil > today) {
    return "OK";
  }

  const currentMileage = vehicle?.currentMileage ?? 0;
  const dateDue = reminder.dueDate ? reminder.dueDate <= today : false;
  const dateSoon = reminder.dueDate
    ? reminder.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : false;
  const mileageDue = reminder.dueMileage > 0 && currentMileage >= reminder.dueMileage;
  const mileageSoon =
    reminder.dueMileage > 0 && currentMileage >= reminder.dueMileage - 500;

  if (dateDue || mileageDue) {
    return reminder.dueDate && reminder.dueDate < today ? "En retard" : "À faire maintenant";
  }

  if (dateSoon || mileageSoon) {
    return "Bientôt";
  }

  return "OK";
}

export function buildImportantReminders(
  reminders: ReminderEntry[],
  vehicles: VehicleProfile[],
  limit = 5,
): ReminderEntry[] {
  const priority: Record<ReminderEntry["status"], number> = {
    "En retard": 0,
    "À faire maintenant": 1,
    "Bientôt": 2,
    OK: 3,
    Fait: 4,
  };

  return reminders
    .filter((reminder) => reminder.status !== "Fait")
    .map((reminder) => {
      const vehicle = vehicles.find((item) => item.id === reminder.vehicleProfileId) ?? null;
      return {
        ...reminder,
        status: getReminderDisplayStatus(reminder, vehicle),
      };
    })
    .sort((a, b) => {
      const statusCompare = priority[a.status] - priority[b.status];
      if (statusCompare !== 0) {
        return statusCompare;
      }

      return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
    })
    .slice(0, limit);
}

export function buildEngineChangeReminders(expense: ExpenseEntry): ReminderEntry[] {
  const baseMileage = expense.mileageAtExpense;

  return [
    createReminderEntry({
      vehicleProfileId: expense.vehicleProfileId,
      type: "Changement moteur",
      title: "Vérifier niveau huile après changement moteur",
      triggerType: "kilométrage",
      dueMileage: baseMileage + 500,
      sourceExpenseId: expense.id,
      comment: "Contrôle moteur après 500 km.",
    }),
    createReminderEntry({
      vehicleProfileId: expense.vehicleProfileId,
      type: "Liquide refroidissement",
      title: "Vérifier liquide refroidissement",
      triggerType: "kilométrage",
      dueMileage: baseMileage + 500,
      sourceExpenseId: expense.id,
      comment: "Contrôle après changement moteur.",
    }),
    createReminderEntry({
      vehicleProfileId: expense.vehicleProfileId,
      type: "Vérification après réparation",
      title: "Contrôle garage après 1 000 km",
      triggerType: "kilométrage",
      dueMileage: baseMileage + 1000,
      sourceExpenseId: expense.id,
      comment: "Vérifier fuite moteur et comportement général.",
    }),
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
    "Vehicule",
    "Plateforme",
    "Mode calcul",
    "Prix brut",
    "Pourboire",
    "Bonus",
    "Revenu brut",
    "Commission",
    "Revenu apres commission",
    "Temps total",
    "Km total",
    "Carburant ou energie",
    "Amortissement",
    "Assurance",
    "Frais fixes imputes",
    "Entretien",
    "Pneus",
    "Freins",
    "Vidange",
    "Reparation imputee",
    "Peage",
    "Parking",
    "Frais totaux",
    "Net reel",
    "EUR/h net",
    "Cout au km",
    "Decision",
    "Raison",
    "Zone",
    "Zone depart",
    "Zone arrivee",
    "Ville depart",
    "Ville arrivee",
    "Type zone",
    "Creneau horaire",
    "Jour semaine",
    "Temps estime",
    "Temps reel",
    "Difference estimation reel",
    "Niveau confiance",
    "Prix devis TTC",
    "Commentaire",
  ];
  const calibrations = buildTravelCalibrations(trips);

  const rows = monthTrips.map((trip) => {
    const calibration = calibrations.find(
      (item) =>
        item.fromZone.toLowerCase() === normalizeZoneName(trip.pickupZone || trip.zone).toLowerCase() &&
        item.toZone.toLowerCase() === normalizeZoneName(trip.dropoffZone || trip.zone).toLowerCase() &&
        item.dayOfWeek === getDayOfWeekFromDate(trip.date) &&
        item.timeSlot === trip.timeSlot &&
        item.id.endsWith(`|${trip.zoneType}`),
    );

    return [
      trip.date,
      trip.vehicleSnapshot.profileName,
      trip.platformSnapshot.name,
      trip.costMode,
      trip.basePrice,
      trip.tip,
      trip.bonus,
      trip.grossRevenue,
      trip.platformCommissionAmount,
      trip.revenueAfterCommission,
      trip.totalMinutes,
      trip.totalKm,
      trip.energyCost,
      trip.depreciationAllocated,
      trip.insuranceAllocated,
      trip.fixedCostsAllocated,
      trip.maintenanceReserved,
      trip.tiresCost,
      trip.brakesCost,
      trip.oilChangeCost,
      trip.repairAllocated,
      trip.tollCost,
      trip.parkingCost,
      trip.totalCosts,
      trip.netIncome,
      trip.netHourly,
      trip.totalCostPerKm,
      trip.decision,
      trip.decisionReason,
      trip.zone,
      trip.pickupZone,
      trip.dropoffZone,
      trip.pickupCity,
      trip.dropoffCity,
      trip.zoneType,
      trip.timeSlot,
      getDayOfWeekFromDate(trip.date),
      trip.estimatedTripMinutes,
      trip.actualTripMinutes,
      trip.estimatedVsActualDifference,
      calibration?.confidenceLevel ?? "faible",
      trip.quoteId ? trip.basePrice : "",
      trip.comment,
    ]
      .map(escapeCsvValue)
      .join(";");
  });

  return [headers.map(escapeCsvValue).join(";"), ...rows].join("\n");
}

export function formatDecisionLabel(decision: Decision): string {
  if (decision === "accepter") {
    return "Accepter";
  }

  if (decision === "limite") {
    return "Limite";
  }

  return "Refuser";
}

export function buildExportSnapshot(
  globalSettings: GlobalSettings,
  vehicles: VehicleProfile[],
  platforms: PlatformProfile[],
  expenses: ExpenseEntry[],
  fuelEntries: FuelEntry[],
  chargeEntries: ChargeEntry[],
  repairEntries: RepairEntry[],
  repairPartEntries: RepairPartEntry[],
  quoteEntries: QuoteEntry[],
  reminderEntries: ReminderEntry[],
  activityEntries: ActivityEntry[],
  rentalOffers: RentalOfferEntry[],
  recoveryScenarios: RecoveryScenarioEntry[],
  trips: TripRecord[],
): AppSnapshot {
  const exportMonths = Array.from(
    new Set([
      ...trips.map((trip) => trip.month),
      ...expenses.map((expense) => getMonthFromDate(expense.date)),
    ]),
  ).filter(Boolean);

  return {
    version: 6,
    exportedAt: createTimestamp(),
    globalSettings,
    vehicles,
    platforms,
    expenses,
    fuelEntries,
    chargeEntries,
    repairEntries,
    repairPartEntries,
    quoteEntries,
    reminderEntries,
    activityEntries,
    rentalOffers,
    recoveryScenarios,
    workDaySummaries: exportMonths.flatMap((month) => buildWorkDaySummaries(trips, expenses, month)),
    zoneStats: calculateZoneStats(trips),
    travelCalibrations: buildTravelCalibrations(trips),
    trips,
  };
}
