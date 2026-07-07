export type Decision = "accepter" | "limite" | "refuser";

export type MaintenanceAlertStatus = "ok" | "bientot" | "maintenant";

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

export interface TripInput {
  date: string;
  priceProposed: number;
  approachMinutes: number;
  waitMinutes: number;
  tripMinutes: number;
  approachKm: number;
  tripKm: number;
  note: string;
  zone: string;
  comment: string;
}

export interface TripRecord extends TripInput {
  id: string;
  createdAt: string;
  month: string;
  grossRevenue: number;
  totalMinutes: number;
  totalKm: number;
  fuelCost: number;
  insuranceAllocated: number;
  fixedCostsAllocated: number;
  maintenanceReserved: number;
  tiresCost: number;
  brakesCost: number;
  oilChangeCost: number;
  maintenanceCostPerKm: number;
  totalCosts: number;
  netIncome: number;
  grossHourly: number;
  netHourly: number;
  minimumPriceWithCosts: number;
  gap: number;
  decision: Decision;
}

export interface VehicleSettings {
  vehicleName: string;
  brand: string;
  model: string;
  year: number;
  vehicleType: VehicleType;
  energyType: EnergyType;
  averageConsumptionPer100Km: number;
  energyPricePerUnit: number;
  currentMileage: number;
  monthlyInsurance: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  monthlyFixedCosts: number;
  estimatedMaintenanceCostPerKm: number;
  estimatedTiresCostPerKm: number;
  estimatedBrakesCostPerKm: number;
  estimatedOilChangeCostPerKm: number;
}

export interface MaintenanceSettings {
  lastOilChangeKm: number;
  oilChangeIntervalKm: number;
  oilChangeCost: number;
  lastBrakesChangeKm: number;
  brakesIntervalKm: number;
  brakesCost: number;
  lastTiresChangeKm: number;
  tiresIntervalKm: number;
  tiresCost: number;
  otherMonthlyMaintenance: number;
  estimatedKmPerMonth: number;
  extraManualReservePerKm: number;
}

export interface AppSettings {
  vehicle: VehicleSettings;
  maintenance: MaintenanceSettings;
}

export interface MaintenanceAlert {
  label: string;
  nextKm: number;
  remainingKm: number;
  status: MaintenanceAlertStatus;
}

export interface DashboardStats {
  grossRevenue: number;
  netIncome: number;
  remainingGoal: number;
  achievedPercentage: number;
  activeDays: number;
  workedHours: number;
  drivenKm: number;
  averageGrossHourly: number;
  averageNetHourly: number;
  averageGrossPerActiveDay: number;
  remainingPerPlannedDay: number | null;
  daysNeededAt300: number;
}

export interface AppSnapshot {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  trips: TripRecord[];
}

export const MONTHLY_TARGET = 4000;
export const TARGET_NET_HOURLY = 30;
export const LIMIT_NET_HOURLY = 27;

export const DEFAULT_VEHICLE_SETTINGS: VehicleSettings = {
  vehicleName: "Toyota Prius 3",
  brand: "Toyota",
  model: "Prius 3",
  year: 2011,
  vehicleType: "Hybride essence",
  energyType: "SP95-E10",
  averageConsumptionPer100Km: 5.2,
  energyPricePerUnit: 1.85,
  currentMileage: 120000,
  monthlyInsurance: 120,
  workingDaysPerMonth: 20,
  workingHoursPerDay: 8,
  monthlyFixedCosts: 0,
  estimatedMaintenanceCostPerKm: 0.12,
  estimatedTiresCostPerKm: 0,
  estimatedBrakesCostPerKm: 0,
  estimatedOilChangeCostPerKm: 0,
};

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  lastOilChangeKm: 118000,
  oilChangeIntervalKm: 15000,
  oilChangeCost: 140,
  lastBrakesChangeKm: 110000,
  brakesIntervalKm: 40000,
  brakesCost: 380,
  lastTiresChangeKm: 100000,
  tiresIntervalKm: 45000,
  tiresCost: 520,
  otherMonthlyMaintenance: 90,
  estimatedKmPerMonth: 3500,
  extraManualReservePerKm: 0.02,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  vehicle: DEFAULT_VEHICLE_SETTINGS,
  maintenance: DEFAULT_MAINTENANCE_SETTINGS,
};
