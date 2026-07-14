export type Decision = "accepter" | "limite" | "refuser";

export type MaintenanceAlertStatus = "ok" | "bientot" | "maintenant" | "en-retard";

export const VEHICLE_TYPE_OPTIONS = [
  "Hybride essence",
  "Essence",
  "Diesel",
  "Électrique",
  "Hybride rechargeable",
] as const;

export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number];

export const ENERGY_TYPE_OPTIONS = [
  "SP95",
  "SP95-E10",
  "SP98",
  "Diesel",
  "Électricité",
] as const;

export type EnergyType = (typeof ENERGY_TYPE_OPTIONS)[number];

export const VEHICLE_STATUS_OPTIONS = [
  "Actif",
  "Archivé",
  "En panne",
  "En panne moteur",
  "En réparation",
  "En test",
  "Loué",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUS_OPTIONS)[number];

export const COST_MODE_OPTIONS = ["estimé", "réel", "mixte"] as const;

export type CostMode = (typeof COST_MODE_OPTIONS)[number];

export const POSSESSION_MODE_OPTIONS = [
  "Véhicule personnel payé comptant",
  "Véhicule avec crédit",
  "Location",
  "LLD",
  "LOA",
  "Véhicule prêté",
  "Autre",
] as const;

export type PossessionMode = (typeof POSSESSION_MODE_OPTIONS)[number];

export const DEPRECIATION_MODE_OPTIONS = ["mensuel", "au kilomètre", "mixte"] as const;

export type DepreciationMode = (typeof DEPRECIATION_MODE_OPTIONS)[number];

export const PLATFORM_STATUS_OPTIONS = ["actif", "archivé"] as const;

export type PlatformStatus = (typeof PLATFORM_STATUS_OPTIONS)[number];

export const EXPENSE_CATEGORY_OPTIONS = [
  "Carburant",
  "Recharge électrique",
  "Assurance",
  "Crédit",
  "Location / LLD / LOA",
  "Réparation",
  "Moteur",
  "Changement moteur",
  "Vidange",
  "Pneus",
  "Freins",
  "Contrôle technique",
  "Lavage",
  "Parking",
  "Péage",
  "Téléphone",
  "Abonnement application",
  "Comptabilité",
  "Frais administratifs",
  "Autre",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORY_OPTIONS)[number];

export const REPAIR_CATEGORY_OPTIONS = [
  "Moteur",
  "Freins",
  "Amortisseurs",
  "Pneus",
  "Batterie",
  "Vidange",
  "Liquide refroidissement",
  "Pompe à eau",
  "Thermostat",
  "Filtre",
  "Bougies",
  "Diagnostic",
  "Main-d’œuvre",
  "Autre",
] as const;

export type RepairCategory = (typeof REPAIR_CATEGORY_OPTIONS)[number];

export const REPAIR_STATUS_OPTIONS = [
  "À faire",
  "Pièces à acheter",
  "Pièces achetées",
  "Rendez-vous garage prévu",
  "En cours",
  "Terminé",
  "Annulé",
] as const;

export type RepairStatus = (typeof REPAIR_STATUS_OPTIONS)[number];

export const REPAIR_PRIORITY_OPTIONS = ["Normal", "Important", "Urgent"] as const;

export type RepairPriority = (typeof REPAIR_PRIORITY_OPTIONS)[number];

export const REPAIR_PART_STATUS_OPTIONS = [
  "À acheter",
  "Commandée",
  "Reçue",
  "Montée",
  "Annulée",
] as const;

export type RepairPartStatus = (typeof REPAIR_PART_STATUS_OPTIONS)[number];

export const ZONE_TYPE_OPTIONS = [
  "Paris",
  "Banlieue proche",
  "Banlieue éloignée",
  "Aéroport",
  "Gare",
  "Longue distance",
  "Autre",
] as const;

export type ZoneType = (typeof ZONE_TYPE_OPTIONS)[number];

export const TIME_SLOT_OPTIONS = ["matin", "midi", "après-midi", "soir", "nuit"] as const;

export type TimeSlot = (typeof TIME_SLOT_OPTIONS)[number];

export const QUOTE_TRIP_TYPE_OPTIONS = [
  "Course simple",
  "Aller-retour",
  "Aéroport / gare",
  "Longue distance",
  "Mise à disposition",
  "Autre",
] as const;

export type QuoteTripType = (typeof QUOTE_TRIP_TYPE_OPTIONS)[number];

export const QUOTE_STATUS_OPTIONS = [
  "Brouillon",
  "Envoyé",
  "Accepté",
  "Refusé",
  "Annulé",
  "Transformé en course",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUS_OPTIONS)[number];

export const QUOTE_MARGIN_OPTIONS = ["0 %", "5 %", "10 %", "15 %", "20 %", "montant manuel"] as const;

export type QuoteMarginMode = (typeof QUOTE_MARGIN_OPTIONS)[number];

export const QUOTE_ROUNDING_OPTIONS = [
  "euro supérieur",
  "5 € supérieurs",
  "10 € supérieurs",
] as const;

export type QuoteRoundingMode = (typeof QUOTE_ROUNDING_OPTIONS)[number];

export const REMINDER_TYPE_OPTIONS = [
  "Vidange moteur",
  "Filtre à huile",
  "Liquide refroidissement",
  "Bougies",
  "Freins",
  "Pneus",
  "Batterie",
  "Contrôle technique",
  "Assurance",
  "Révision générale",
  "Vérification après réparation",
  "Changement moteur",
  "Autre",
] as const;

export type ReminderType = (typeof REMINDER_TYPE_OPTIONS)[number];

export const REMINDER_TRIGGER_OPTIONS = ["kilométrage", "date", "date + kilométrage"] as const;

export type ReminderTriggerType = (typeof REMINDER_TRIGGER_OPTIONS)[number];

export const REMINDER_STATUS_OPTIONS = ["OK", "Bientôt", "À faire maintenant", "En retard", "Fait"] as const;

export type ReminderStatus = (typeof REMINDER_STATUS_OPTIONS)[number];

export const WORK_DAY_STATUS_OPTIONS = ["rentable", "moyen", "mauvais", "non-travaillé"] as const;

export type WorkDayStatus = (typeof WORK_DAY_STATUS_OPTIONS)[number];

export const CONFIDENCE_LEVEL_OPTIONS = ["faible", "moyen", "bon"] as const;

export type ConfidenceLevel = (typeof CONFIDENCE_LEVEL_OPTIONS)[number];

export interface VehicleMaintenance {
  lastOilChangeKm: number;
  oilChangeIntervalKm: number;
  oilChangeCost: number;
  lastTiresChangeKm: number;
  tiresIntervalKm: number;
  tiresCost: number;
  lastBrakesChangeKm: number;
  brakesIntervalKm: number;
  brakesCost: number;
  recentRepairs: string;
  reminders: string;
  engineChangedDate: string;
  engineChangedMileage: number;
  engineChangeCostTtc: number;
  engineAmortizationMode: DepreciationMode;
  engineAmortizationMonths: number;
  engineAmortizationKm: number;
  engineComment: string;
}

export interface VehicleProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  profileName: string;
  brand: string;
  model: string;
  year: number;
  nickname: string;
  currentMileage: number;
  startingMileage: number;
  status: VehicleStatus;
  vehicleType: VehicleType;
  energyType: EnergyType;
  estimatedConsumptionPer100Km: number;
  estimatedEnergyPricePerUnit: number;
  estimatedMaintenanceCostPerKm: number;
  estimatedTiresCostPerKm: number;
  estimatedBrakesCostPerKm: number;
  estimatedOilChangeCostPerKm: number;
  estimatedMonthlyInsurance: number;
  estimatedMonthlyFixedCosts: number;
  plannedWorkDaysPerMonth: number;
  plannedWorkHoursPerDay: number;
  monthlyRevenueTarget: number;
  plannedKmPerMonth: number;
  costMode: CostMode;
  possessionMode: PossessionMode;
  purchasePrice: number;
  purchaseDate: string;
  purchaseMileage: number;
  estimatedResaleValue: number;
  amortizationDurationMonths: number;
  creditMonthlyPayment: number;
  creditRemainingMonths: number;
  creditRemainingDebt: number;
  leaseMonthlyPayment: number;
  leaseDownPayment: number;
  leaseDurationMonths: number;
  leaseIncludedKm: number;
  leaseExtraKmCost: number;
  includeDepreciation: boolean;
  depreciationMode: DepreciationMode;
  maintenance: VehicleMaintenance;
}

export interface PlatformProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  commissionRate: number;
  fixedFeePerTrip: number;
  defaultBonus: number;
  comment: string;
  status: PlatformStatus;
}

export interface ExpenseEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  vehicleProfileId: string;
  category: ExpenseCategory;
  amountTtc: number;
  mileageAtExpense: number;
  paymentMethod: string;
  comment: string;
  receiptReference: string;
  recurring: boolean;
  includeInProfitability: boolean;
  amortize: boolean;
  amortizationMonths: number;
  amortizationKm: number;
}

export interface FuelEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  vehicleProfileId: string;
  odometerKm: number;
  litersAdded: number;
  amountPaid: number;
  pricePerLiter: number;
  station: string;
  fullRefill: boolean;
  comment: string;
}

export interface ChargeEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  vehicleProfileId: string;
  odometerKm: number;
  kwhAdded: number;
  amountPaid: number;
  pricePerKwh: number;
  location: string;
  fullCharge: boolean;
  comment: string;
}

export interface RepairEntry {
  id: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  category: RepairCategory;
  description: string;
  status: RepairStatus;
  priority: RepairPriority;
  isBlocking: boolean;
  odometer: number;
  odometerIsApproximate: boolean;
  mechanicName: string;
  plannedDate: string;
  completedDate: string;
  comment: string;
  partsTotalTtc: number;
  laborTotalTtc: number;
  otherFeesTtc: number;
  totalRepairTtc: number;
}

export interface RepairPartEntry {
  id: string;
  repairId: string;
  name: string;
  amountTtc: number;
  supplier: string;
  status: RepairPartStatus;
  comment: string;
}

export interface MaintenanceEntry {
  vehicleProfileId: string;
  maintenance: VehicleMaintenance;
}

export interface TripInput {
  date: string;
  startTime: string;
  vehicleProfileId: string;
  platformProfileId: string;
  costMode: CostMode;
  basePrice: number;
  tip: number;
  bonus: number;
  toll: number;
  parking: number;
  approachMinutes: number;
  waitMinutes: number;
  tripMinutes: number;
  approachKm: number;
  tripKm: number;
  zone: string;
  pickupZone: string;
  dropoffZone: string;
  pickupCity: string;
  dropoffCity: string;
  zoneType: ZoneType;
  timeSlot: TimeSlot;
  estimatedTripMinutes: number;
  actualTripMinutes: number;
  estimatedVsActualDifference: number;
  quoteId: string;
  comment: string;
}

export interface QuoteEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  plannedDate: string;
  plannedTime: string;
  vehicleProfileId: string;
  costMode: CostMode;
  tripType: QuoteTripType;
  clientName: string;
  clientPhone: string;
  comment: string;
  pickupZone: string;
  dropoffZone: string;
  pickupCity: string;
  dropoffCity: string;
  pickupAddress: string;
  dropoffAddress: string;
  zoneType: ZoneType;
  approachKm: number;
  tripKm: number;
  approachMinutes: number;
  waitMinutes: number;
  tripMinutes: number;
  tollTtc: number;
  parkingTtc: number;
  extraFeesTtc: number;
  safetyMarginMode: QuoteMarginMode;
  manualMarginTtc: number;
  roundingMode: QuoteRoundingMode;
  proposedPriceTtc: number;
  status: QuoteStatus;
  linkedTripId: string;
}

export interface ReminderEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  vehicleProfileId: string;
  type: ReminderType;
  title: string;
  triggerType: ReminderTriggerType;
  dueDate: string;
  dueMileage: number;
  sourceExpenseId: string;
  comment: string;
  status: ReminderStatus;
  completedAt: string;
  postponedUntil: string;
}

export interface VehicleSnapshot {
  id: string;
  profileName: string;
  status: VehicleStatus;
  vehicleType: VehicleType;
  energyType: EnergyType;
  costMode: CostMode;
}

export interface PlatformSnapshot {
  id: string;
  name: string;
  commissionRate: number;
  fixedFeePerTrip: number;
}

export interface CostSnapshot {
  energySource: string;
  fixedSource: string;
  maintenanceSource: string;
  depreciationSource: string;
  energyCostPerKmUsed: number;
  fixedMonthlyCostUsed: number;
  insuranceMonthlyUsed: number;
  maintenancePerKmUsed: number;
  tiresPerKmUsed: number;
  brakesPerKmUsed: number;
  oilPerKmUsed: number;
  repairPerKmUsed: number;
  depreciationMonthlyUsed: number;
  depreciationPerKmUsed: number;
  commissionRateUsed: number;
  fixedFeePerTripUsed: number;
}

export interface TripRecord extends TripInput {
  id: string;
  createdAt: string;
  month: string;
  vehicleSnapshot: VehicleSnapshot;
  platformSnapshot: PlatformSnapshot;
  costSnapshot: CostSnapshot;
  grossRevenue: number;
  platformCommissionAmount: number;
  revenueAfterCommission: number;
  totalMinutes: number;
  totalKm: number;
  energyCost: number;
  insuranceAllocated: number;
  fixedCostsAllocated: number;
  depreciationAllocated: number;
  maintenanceReserved: number;
  tiresCost: number;
  brakesCost: number;
  oilChangeCost: number;
  repairAllocated: number;
  tollCost: number;
  parkingCost: number;
  totalCosts: number;
  netIncome: number;
  grossHourly: number;
  netHourly: number;
  totalCostPerKm: number;
  minimumPriceWithCosts: number;
  gap: number;
  decision: Decision;
  decisionReason: string;
}

export interface WorkDaySummary {
  date: string;
  vehicleId: string;
  totalRevenueTtc: number;
  totalNetTtc: number;
  totalExpensesTtc: number;
  totalHours: number;
  totalKm: number;
  courseCount: number;
  averageNetPerHour: number;
  mainZone: string;
  status: WorkDayStatus;
}

export interface ZoneStats {
  id: string;
  zoneName: string;
  city: string;
  zoneType: ZoneType;
  courseCount: number;
  totalRevenueTtc: number;
  totalNetTtc: number;
  averageNetPerHour: number;
  averageTripMinutes: number;
  averageKm: number;
  averageMinutesPerKm: number;
  averageWaitMinutes: number;
}

export interface TravelCalibration {
  id: string;
  fromZone: string;
  toZone: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
  sampleCount: number;
  averageMinutesPerKm: number;
  averageApproachMinutesPerKm: number;
  averageWaitMinutes: number;
  confidenceLevel: ConfidenceLevel;
  lastUpdated: string;
}

export interface TravelEstimate {
  approachMinutes: number;
  tripMinutes: number;
  totalMinutes: number;
  sampleCount: number;
  confidenceLevel: ConfidenceLevel;
  message: string;
}

export interface MaintenanceAlert {
  label: string;
  nextKm: number;
  remainingKm: number;
  status: MaintenanceAlertStatus;
}

export interface DashboardStats {
  grossRevenue: number;
  revenueAfterCommission: number;
  netIncome: number;
  totalCosts: number;
  totalExpensesMonth: number;
  totalDepreciation: number;
  totalEnergyCost: number;
  totalMaintenanceCost: number;
  tripCount: number;
  drivenKm: number;
  workedHours: number;
  averageGrossHourly: number;
  averageNetHourly: number;
  averageCostPerKm: number;
  netMarginPercentage: number;
}

export interface VehiclePerformance {
  vehicleProfileId: string;
  vehicleName: string;
  grossRevenue: number;
  netIncome: number;
  totalCosts: number;
  totalExpensesMonth: number;
  totalDepreciation: number;
  drivenKm: number;
  tripCount: number;
  averageNetHourly: number;
  averageCostPerKm: number;
  averageConsumptionReal: number;
  averageEnergyCostPerKm: number;
}

export interface PlatformPerformance {
  platformProfileId: string;
  platformName: string;
  grossRevenue: number;
  commissionTotal: number;
  netIncome: number;
  averageNetHourly: number;
  tripCount: number;
}

export interface VehicleEnergyMetrics {
  latestConsumptionPer100Km: number | null;
  averageLast3ConsumptionPer100Km: number | null;
  averageMonthConsumptionPer100Km: number | null;
  averageCostPerKm: number | null;
  averageDailyEnergyCost: number | null;
  averageEnergyCostPerTrip: number | null;
  totalMonthSpend: number;
}

export interface GlobalSettings {
  activeVehicleProfileId: string | null;
  activePlatformProfileId: string | null;
}

export interface AppSnapshot {
  version: number;
  exportedAt: string;
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
  workDaySummaries: WorkDaySummary[];
  zoneStats: ZoneStats[];
  travelCalibrations: TravelCalibration[];
  trips: TripRecord[];
}

export const MONTHLY_TARGET = 4000;
export const TARGET_NET_HOURLY = 30;
export const LIMIT_NET_HOURLY = 27;

export const LEGACY_DEFAULT_VEHICLE_ID = "vehicle-default";
export const LEGACY_DEFAULT_PLATFORM_ID = "platform-client-prive";

export const DEFAULT_VEHICLE_PROFILE: VehicleProfile = {
  id: LEGACY_DEFAULT_VEHICLE_ID,
  createdAt: "",
  updatedAt: "",
  profileName: "Véhicule par défaut",
  brand: "Toyota",
  model: "Prius 3",
  year: 2011,
  nickname: "Prius noire",
  currentMileage: 120000,
  startingMileage: 120000,
  status: "Actif",
  vehicleType: "Hybride essence",
  energyType: "SP95-E10",
  estimatedConsumptionPer100Km: 5.2,
  estimatedEnergyPricePerUnit: 1.85,
  estimatedMaintenanceCostPerKm: 0.12,
  estimatedTiresCostPerKm: 0,
  estimatedBrakesCostPerKm: 0,
  estimatedOilChangeCostPerKm: 0,
  estimatedMonthlyInsurance: 120,
  estimatedMonthlyFixedCosts: 0,
  plannedWorkDaysPerMonth: 20,
  plannedWorkHoursPerDay: 8,
  monthlyRevenueTarget: 4000,
  plannedKmPerMonth: 3500,
  costMode: "estimé",
  possessionMode: "Véhicule personnel payé comptant",
  purchasePrice: 0,
  purchaseDate: "",
  purchaseMileage: 120000,
  estimatedResaleValue: 0,
  amortizationDurationMonths: 48,
  creditMonthlyPayment: 0,
  creditRemainingMonths: 0,
  creditRemainingDebt: 0,
  leaseMonthlyPayment: 0,
  leaseDownPayment: 0,
  leaseDurationMonths: 0,
  leaseIncludedKm: 0,
  leaseExtraKmCost: 0,
  includeDepreciation: false,
  depreciationMode: "mensuel",
  maintenance: {
    lastOilChangeKm: 118000,
    oilChangeIntervalKm: 15000,
    oilChangeCost: 140,
    lastTiresChangeKm: 100000,
    tiresIntervalKm: 45000,
    tiresCost: 520,
    lastBrakesChangeKm: 110000,
    brakesIntervalKm: 40000,
    brakesCost: 380,
    recentRepairs: "",
    reminders: "",
    engineChangedDate: "",
    engineChangedMileage: 0,
    engineChangeCostTtc: 0,
    engineAmortizationMode: "au kilomètre",
    engineAmortizationMonths: 0,
    engineAmortizationKm: 0,
    engineComment: "",
  },
};

export const DEFAULT_PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: "platform-uber",
    createdAt: "",
    updatedAt: "",
    name: "Uber",
    commissionRate: 25,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  },
  {
    id: "platform-bolt",
    createdAt: "",
    updatedAt: "",
    name: "Bolt",
    commissionRate: 20,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  },
  {
    id: "platform-heetch",
    createdAt: "",
    updatedAt: "",
    name: "Heetch",
    commissionRate: 15,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  },
  {
    id: "platform-freenow",
    createdAt: "",
    updatedAt: "",
    name: "FreeNow",
    commissionRate: 20,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "Ajustez la commission selon votre contrat FreeNow.",
    status: "actif",
  },
  {
    id: LEGACY_DEFAULT_PLATFORM_ID,
    createdAt: "",
    updatedAt: "",
    name: "Client privé",
    commissionRate: 0,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  },
  {
    id: "platform-autre",
    createdAt: "",
    updatedAt: "",
    name: "Autre",
    commissionRate: 0,
    fixedFeePerTrip: 0,
    defaultBonus: 0,
    comment: "",
    status: "actif",
  },
];

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  activeVehicleProfileId: LEGACY_DEFAULT_VEHICLE_ID,
  activePlatformProfileId: LEGACY_DEFAULT_PLATFORM_ID,
};
