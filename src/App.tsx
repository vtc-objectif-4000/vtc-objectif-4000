import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildExportSnapshot,
  buildEngineChangeReminders,
  buildImportantReminders,
  buildMaintenanceAlerts,
  buildMonthlyCsv,
  buildTripRecord,
  buildTravelCalibrations,
  buildWorkDaySummaries,
  calculateAllocatedMinuteCost,
  calculateConfiguredMaintenanceCostPerKm,
  calculateDashboardStats,
  calculatePlatformPerformances,
  calculateQuoteMetrics,
  calculateTripMetrics,
  calculateVehiclePerformances,
  calculateZoneStats,
  cloneWithMeta,
  createChargeEntry,
  createExpenseEntry,
  createFuelEntry,
  createPlatformProfile,
  createQuoteEntry,
  createRepairEntry,
  createRepairPartEntry,
  createReminderEntry,
  createTimestamp,
  createTripInput,
  createVehicleProfile,
  estimateTravelFromHistory,
  formatDecisionLabel,
  getConsumptionUnitLabel,
  getDayOfWeekFromDate,
  getDefaultEnergyTypeForVehicleType,
  getEnergyCostLabel,
  getEnergyPriceUnitLabel,
  getMonthFromDate,
  getReminderDisplayStatus,
  getTimeSlotFromTime,
  getVehicleEnergyMetrics,
  isElectricVehicle,
  normalizeLegacyOrCurrentSnapshot,
} from "./lib/calculations";
import {
  AppData,
  clearAllData,
  deleteChargeEntry,
  deleteExpenseEntry,
  deleteFuelEntry,
  deletePlatformProfile,
  deleteQuoteEntry,
  deleteRepairEntry,
  deleteRepairPartEntry,
  deleteReminderEntry,
  deleteTripsForMonth,
  deleteVehicleProfile,
  exportSnapshot,
  getAppData,
  importSnapshot,
  saveChargeEntry,
  saveExpenseEntry,
  saveFuelEntry,
  saveGlobalSettings,
  savePlatformProfile,
  saveQuoteEntry,
  saveRepairEntry,
  saveRepairPartEntry,
  saveReminderEntry,
  saveTrip,
  saveVehicleProfile,
} from "./lib/storage";
import {
  AppSnapshot,
  COST_MODE_OPTIONS,
  ChargeEntry,
  CostMode,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_PLATFORM_PROFILES,
  DEPRECIATION_MODE_OPTIONS,
  Decision,
  ENERGY_TYPE_OPTIONS,
  EXPENSE_CATEGORY_OPTIONS,
  ExpenseEntry,
  FuelEntry,
  GlobalSettings,
  LEGACY_DEFAULT_PLATFORM_ID,
  LEGACY_DEFAULT_VEHICLE_ID,
  MONTHLY_TARGET,
  PLATFORM_STATUS_OPTIONS,
  POSSESSION_MODE_OPTIONS,
  PlatformProfile,
  QUOTE_MARGIN_OPTIONS,
  QUOTE_ROUNDING_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  QUOTE_TRIP_TYPE_OPTIONS,
  QuoteEntry,
  REPAIR_CATEGORY_OPTIONS,
  REPAIR_PART_STATUS_OPTIONS,
  REPAIR_PRIORITY_OPTIONS,
  REPAIR_STATUS_OPTIONS,
  RepairEntry,
  RepairPartEntry,
  REMINDER_TRIGGER_OPTIONS,
  REMINDER_TYPE_OPTIONS,
  ReminderEntry,
  TripInput,
  TripRecord,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  VehicleProfile,
  ZONE_TYPE_OPTIONS,
} from "./types";

type TabId =
  | "dashboard"
  | "trip"
  | "calendar"
  | "vehicles"
  | "platforms"
  | "expenses"
  | "energy"
  | "maintenance"
  | "comparison"
  | "quotes"
  | "data";

type Notice = {
  tone: "success" | "warning" | "error";
  message: string;
};

type FilterValue = "all" | string;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "trip", label: "Courses" },
  { id: "calendar", label: "Calendrier" },
  { id: "vehicles", label: "Véhicules" },
  { id: "expenses", label: "Dépenses" },
  { id: "energy", label: "Carburant" },
  { id: "maintenance", label: "Entretien" },
  { id: "quotes", label: "Devis" },
  { id: "data", label: "Données" },
];

const REALTIME_PLATFORM_IDS = [
  "platform-uber",
  "platform-bolt",
  "platform-heetch",
  "platform-freenow",
] as const;

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function getLocalIsoDate(): string {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function getLocalTimeValue(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getCurrentMonthValue(): string {
  return getLocalIsoDate().slice(0, 7);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

function formatNumber(value: number, suffix = ""): string {
  return `${numberFormatter.format(value || 0)}${suffix}`;
}

function formatInteger(value: number, suffix = ""): string {
  return `${integerFormatter.format(value || 0)}${suffix}`;
}

function formatMonthLabel(month: string): string {
  if (!month) {
    return "Mois";
  }

  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}

function getDaysForMonth(month: string): string[] {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex) {
    return [];
  }

  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? ""),
  );
}

function sortTripsDescending(trips: TripRecord[]): TripRecord[] {
  return [...trips].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isSnapshotLike(value: unknown): value is AppSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasRecognizedShape =
    "globalSettings" in candidate ||
    "settings" in candidate ||
    Array.isArray(candidate.vehicles) ||
    Array.isArray(candidate.platforms) ||
    Array.isArray(candidate.trips) ||
    Array.isArray(candidate.expenses) ||
    Array.isArray(candidate.fuelEntries) ||
    Array.isArray(candidate.chargeEntries) ||
    Array.isArray(candidate.repairEntries) ||
    Array.isArray(candidate.repairPartEntries) ||
    Array.isArray(candidate.quoteEntries) ||
    Array.isArray(candidate.reminderEntries);

  if (!hasRecognizedShape) {
    return false;
  }

  const normalized = normalizeLegacyOrCurrentSnapshot(value);
  return Array.isArray(normalized.trips) && normalized.vehicles.length > 0;
}

function getVehicleLabel(vehicle: VehicleProfile): string {
  return vehicle.profileName || [vehicle.brand, vehicle.model].filter(Boolean).join(" ").trim() || "Véhicule";
}

function getPlatformLabel(platform: PlatformProfile): string {
  return platform.name || "Plateforme";
}

function getStatusClass(status: string): string {
  return status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function getFilterLabel(value: FilterValue, fallback: string): string {
  return value === "all" ? fallback : value;
}

function mergeRealtimePlatforms(platforms: PlatformProfile[]): PlatformProfile[] {
  const existingIds = new Set(platforms.map((platform) => platform.id));
  const missingRealtimePlatforms = DEFAULT_PLATFORM_PROFILES.filter(
    (platform) => platform.id === "platform-freenow" && !existingIds.has(platform.id),
  )
    .map((platform) => createPlatformProfile(platform));

  return missingRealtimePlatforms.length > 0
    ? sortByUpdatedAtDesc([...platforms, ...missingRealtimePlatforms])
    : platforms;
}

function isRepairClosed(status: RepairEntry["status"]): boolean {
  return status === "Terminé" || status === "Annulé";
}

function calculateRepairPartsTotal(parts: RepairPartEntry[]): number {
  return parts.reduce((sum, part) => sum + (part.amountTtc || 0), 0);
}

function syncRepairTotals(repair: RepairEntry, parts: RepairPartEntry[]): RepairEntry {
  const partsTotalTtc = calculateRepairPartsTotal(parts);
  return {
    ...repair,
    partsTotalTtc,
    totalRepairTtc: partsTotalTtc + repair.laborTotalTtc + repair.otherFeesTtc,
  };
}

function getExpenseCategoryFromRepairCategory(category: RepairEntry["category"]): ExpenseEntry["category"] {
  if (category === "Moteur") {
    return "Moteur";
  }

  if (category === "Vidange") {
    return "Vidange";
  }

  if (category === "Pneus") {
    return "Pneus";
  }

  if (category === "Freins") {
    return "Freins";
  }

  return "Réparation";
}

export default function App() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [dashboardVehicleFilter, setDashboardVehicleFilter] = useState<FilterValue>("all");
  const [dashboardPlatformFilter, setDashboardPlatformFilter] = useState<FilterValue>("all");
  const [dashboardCostModeFilter, setDashboardCostModeFilter] = useState<FilterValue>("all");
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [platforms, setPlatforms] = useState<PlatformProfile[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [chargeEntries, setChargeEntries] = useState<ChargeEntry[]>([]);
  const [repairEntries, setRepairEntries] = useState<RepairEntry[]>([]);
  const [repairPartEntries, setRepairPartEntries] = useState<RepairPartEntry[]>([]);
  const [quoteEntries, setQuoteEntries] = useState<QuoteEntry[]>([]);
  const [reminderEntries, setReminderEntries] = useState<ReminderEntry[]>([]);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [tripInput, setTripInput] = useState<TripInput>(
    createTripInput(LEGACY_DEFAULT_VEHICLE_ID, LEGACY_DEFAULT_PLATFORM_ID, "estimé"),
  );
  const [vehicleDraft, setVehicleDraft] = useState<VehicleProfile>(createVehicleProfile());
  const [platformDraft, setPlatformDraft] = useState<PlatformProfile>(createPlatformProfile());
  const [expenseDraft, setExpenseDraft] = useState<ExpenseEntry>(
    createExpenseEntry({ date: getLocalIsoDate() }),
  );
  const [fuelDraft, setFuelDraft] = useState<FuelEntry>(createFuelEntry({ date: getLocalIsoDate() }));
  const [chargeDraft, setChargeDraft] = useState<ChargeEntry>(
    createChargeEntry({ date: getLocalIsoDate() }),
  );
  const [quoteDraft, setQuoteDraft] = useState<QuoteEntry>(
    createQuoteEntry({ plannedDate: getLocalIsoDate() }),
  );
  const [repairDraft, setRepairDraft] = useState<RepairEntry>(
    createRepairEntry({ plannedDate: getLocalIsoDate() }),
  );
  const [repairPartDraft, setRepairPartDraft] = useState<RepairPartEntry>(createRepairPartEntry());
  const [reminderDraft, setReminderDraft] = useState<ReminderEntry>(createReminderEntry());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getLocalIsoDate());
  const [selectedVehicleEditorId, setSelectedVehicleEditorId] = useState<string | null>(null);
  const [selectedPlatformEditorId, setSelectedPlatformEditorId] = useState<string | null>(null);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function loadAllData() {
    const data = await getAppData();
    const sortedVehicles = sortByUpdatedAtDesc(data.vehicles);
    const sortedPlatforms = mergeRealtimePlatforms(sortByUpdatedAtDesc(data.platforms));
    const sortedExpenses = sortByUpdatedAtDesc(data.expenses);
    const sortedFuelEntries = sortByUpdatedAtDesc(data.fuelEntries);
    const sortedChargeEntries = sortByUpdatedAtDesc(data.chargeEntries);
    const sortedRepairEntries = sortByUpdatedAtDesc(data.repairEntries);
    const sortedRepairPartEntries = [...data.repairPartEntries].sort((a, b) => {
      const repairCompare = a.repairId.localeCompare(b.repairId);
      if (repairCompare !== 0) {
        return repairCompare;
      }

      return a.name.localeCompare(b.name);
    });
    const sortedQuoteEntries = sortByUpdatedAtDesc(data.quoteEntries);
    const sortedReminderEntries = sortByUpdatedAtDesc(data.reminderEntries);
    const sortedTrips = sortTripsDescending(data.trips);

    setVehicles(sortedVehicles);
    setPlatforms(sortedPlatforms);
    setExpenses(sortedExpenses);
    setFuelEntries(sortedFuelEntries);
    setChargeEntries(sortedChargeEntries);
    setRepairEntries(sortedRepairEntries);
    setRepairPartEntries(sortedRepairPartEntries);
    setQuoteEntries(sortedQuoteEntries);
    setReminderEntries(sortedReminderEntries);
    setTrips(sortedTrips);

    const activeVehicle =
      sortedVehicles.find((vehicle) => vehicle.id === data.globalSettings.activeVehicleProfileId) ??
      sortedVehicles[0];
    const activePlatform =
      sortedPlatforms.find((platform) => platform.id === data.globalSettings.activePlatformProfileId) ??
      sortedPlatforms[0];
    const nextGlobalSettings: GlobalSettings = {
      activeVehicleProfileId: activeVehicle?.id ?? null,
      activePlatformProfileId: activePlatform?.id ?? null,
    };

    setGlobalSettings(nextGlobalSettings);
    setVehicleDraft(activeVehicle ?? createVehicleProfile());
    setPlatformDraft(activePlatform ?? createPlatformProfile());
    setSelectedVehicleEditorId(activeVehicle?.id ?? null);
    setSelectedPlatformEditorId(activePlatform?.id ?? null);
    setTripInput((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
      platformProfileId: activePlatform?.id ?? current.platformProfileId,
      costMode: activeVehicle?.costMode ?? current.costMode,
    }));
    setExpenseDraft((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
    }));
    setFuelDraft((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
    }));
    setChargeDraft((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
    }));
    setQuoteDraft((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
      costMode: activeVehicle?.costMode ?? current.costMode,
    }));
    setSelectedRepairId((current) => {
      if (current && sortedRepairEntries.some((repair) => repair.id === current)) {
        return current;
      }

      return (
        sortedRepairEntries.find((repair) => repair.vehicleId === activeVehicle?.id)?.id ??
        sortedRepairEntries[0]?.id ??
        null
      );
    });
    setRepairDraft((current) => {
      const currentRepair =
        current.id && sortedRepairEntries.some((repair) => repair.id === current.id)
          ? sortedRepairEntries.find((repair) => repair.id === current.id) ?? null
          : null;

      if (currentRepair) {
        return currentRepair;
      }

      return createRepairEntry({
        vehicleId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
        odometer: activeVehicle?.currentMileage ?? 0,
        plannedDate: getLocalIsoDate(),
      });
    });
    setRepairPartDraft((current) => {
      if (current.id && sortedRepairPartEntries.some((part) => part.id === current.id)) {
        return sortedRepairPartEntries.find((part) => part.id === current.id) ?? current;
      }

      return createRepairPartEntry();
    });
    setReminderDraft((current) => ({
      ...current,
      vehicleProfileId: activeVehicle?.id ?? current.vehicleProfileId,
    }));
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (!active) {
          return;
        }

        await loadAllData();
      } catch (error) {
        if (active) {
          setNotice({
            tone: "error",
            message:
              error instanceof Error ? error.message : "Impossible de charger les données enregistrées.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const activeVehicle = useMemo(() => {
    return (
      vehicles.find((vehicle) => vehicle.id === globalSettings.activeVehicleProfileId) ??
      vehicles[0] ??
      null
    );
  }, [vehicles, globalSettings.activeVehicleProfileId]);

  const activePlatform = useMemo(() => {
    return (
      platforms.find((platform) => platform.id === globalSettings.activePlatformProfileId) ??
      platforms[0] ??
      null
    );
  }, [platforms, globalSettings.activePlatformProfileId]);

  const realtimePlatforms = useMemo(() => {
    return REALTIME_PLATFORM_IDS.map((platformId) => platforms.find((platform) => platform.id === platformId))
      .filter((platform): platform is PlatformProfile => Boolean(platform));
  }, [platforms]);

  const tripVehicle =
    vehicles.find((vehicle) => vehicle.id === tripInput.vehicleProfileId) ?? activeVehicle;
  const tripPlatform =
    platforms.find((platform) => platform.id === tripInput.platformProfileId) ?? activePlatform;

  const tripPreview =
    tripVehicle && tripPlatform
      ? calculateTripMetrics(tripInput, tripVehicle, tripPlatform, {
          expenses,
          fuelEntries,
          chargeEntries,
          trips,
        })
      : null;

  const visibleTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (trip.month !== selectedMonth) {
        return false;
      }

      if (dashboardVehicleFilter !== "all" && trip.vehicleSnapshot.id !== dashboardVehicleFilter) {
        return false;
      }

      if (dashboardPlatformFilter !== "all" && trip.platformSnapshot.id !== dashboardPlatformFilter) {
        return false;
      }

      if (dashboardCostModeFilter !== "all" && trip.costMode !== dashboardCostModeFilter) {
        return false;
      }

      return true;
    });
  }, [trips, selectedMonth, dashboardVehicleFilter, dashboardPlatformFilter, dashboardCostModeFilter]);

  const visibleExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (getMonthFromDate(expense.date) !== selectedMonth) {
        return false;
      }

      if (dashboardVehicleFilter !== "all" && expense.vehicleProfileId !== dashboardVehicleFilter) {
        return false;
      }

      return true;
    });
  }, [expenses, selectedMonth, dashboardVehicleFilter]);

  const dashboardStats = calculateDashboardStats(visibleTrips, visibleExpenses, selectedMonth);
  const vehiclePerformances = calculateVehiclePerformances(
    vehicles,
    trips,
    expenses,
    fuelEntries,
    chargeEntries,
    selectedMonth,
  );
  const platformPerformances = calculatePlatformPerformances(platforms, trips, selectedMonth);
  const comparisonBestVehicle =
    [...vehiclePerformances].sort((a, b) => b.averageNetHourly - a.averageNetHourly)[0] ?? null;
  const comparisonWorstVehicle =
    [...vehiclePerformances].sort((a, b) => b.averageCostPerKm - a.averageCostPerKm)[0] ?? null;
  const activeVehicleEnergyMetrics =
    activeVehicle
      ? getVehicleEnergyMetrics(activeVehicle, selectedMonth, fuelEntries, chargeEntries, trips)
      : null;
  const activeVehicleMaintenanceAlerts =
    activeVehicle ? buildMaintenanceAlerts(activeVehicle.currentMileage, activeVehicle) : [];
  const activeVehicleConfiguredCost =
    activeVehicle ? calculateConfiguredMaintenanceCostPerKm(activeVehicle) : 0;
  const activeVehicleInsuranceMinute =
    activeVehicle
      ? calculateAllocatedMinuteCost(activeVehicle.estimatedMonthlyInsurance, activeVehicle)
      : 0;
  const activeVehicleFixedMinute =
    activeVehicle
      ? calculateAllocatedMinuteCost(activeVehicle.estimatedMonthlyFixedCosts, activeVehicle)
      : 0;
  const selectedObjective =
    dashboardVehicleFilter === "all"
      ? Math.max(
          vehicles.reduce((sum, vehicle) => sum + vehicle.monthlyRevenueTarget, 0),
          MONTHLY_TARGET,
        )
      : vehicles.find((vehicle) => vehicle.id === dashboardVehicleFilter)?.monthlyRevenueTarget ??
        MONTHLY_TARGET;
  const remainingGoal = Math.max(selectedObjective - dashboardStats.grossRevenue, 0);
  const achievedPercentage =
    selectedObjective > 0 ? (dashboardStats.grossRevenue / selectedObjective) * 100 : 0;

  const monthTrips = trips.filter((trip) => trip.month === selectedMonth);
  const workDaySummaries = buildWorkDaySummaries(trips, expenses, selectedMonth);
  const monthDays = getDaysForMonth(selectedMonth);
  const selectedDaySummary = workDaySummaries.find((day) => day.date === selectedCalendarDate) ?? null;
  const selectedDayTrips = trips.filter((trip) => trip.date === selectedCalendarDate);
  const selectedDayExpenses = expenses.filter((expense) => expense.date === selectedCalendarDate);
  const selectedDayFuelEntries = fuelEntries.filter((entry) => entry.date === selectedCalendarDate);
  const selectedDayChargeEntries = chargeEntries.filter((entry) => entry.date === selectedCalendarDate);
  const zoneStats = calculateZoneStats(trips, selectedMonth);
  const travelCalibrations = buildTravelCalibrations(trips);
  const bestWorkDay =
    workDaySummaries
      .filter((day) => day.courseCount > 0)
      .sort((a, b) => b.averageNetPerHour - a.averageNetPerHour)[0] ?? null;
  const worstWorkDay =
    workDaySummaries
      .filter((day) => day.courseCount > 0)
      .sort((a, b) => a.averageNetPerHour - b.averageNetPerHour)[0] ?? null;
  const importantReminders = buildImportantReminders(reminderEntries, vehicles);
  const activeVehicleReminders = activeVehicle
    ? reminderEntries
        .filter((reminder) => reminder.vehicleProfileId === activeVehicle.id)
        .map((reminder) => ({
          ...reminder,
          status: getReminderDisplayStatus(reminder, activeVehicle),
        }))
    : [];
  const activeVehicleRepairs = activeVehicle
    ? repairEntries.filter((repair) => repair.vehicleId === activeVehicle.id)
    : [];
  const repairDraftPreview = syncRepairTotals(
    repairDraft,
    repairPartEntries.filter((part) => part.repairId === repairDraft.id),
  );
  const selectedRepair =
    activeVehicleRepairs.find((repair) => repair.id === selectedRepairId) ??
    activeVehicleRepairs[0] ??
    null;
  const selectedRepairParts = selectedRepair
    ? repairPartEntries.filter((part) => part.repairId === selectedRepair.id)
    : [];
  const selectedRepairVehicleLabel = selectedRepair
    ? getVehicleLabel(
        vehicles.find((vehicle) => vehicle.id === selectedRepair.vehicleId) ?? activeVehicle ?? vehicleDraft,
      )
    : "";
  const quoteVehicle =
    vehicles.find((vehicle) => vehicle.id === quoteDraft.vehicleProfileId) ?? activeVehicle;
  const quotePreview =
    quoteVehicle
      ? calculateQuoteMetrics(quoteDraft, quoteVehicle, {
          expenses,
          fuelEntries,
          chargeEntries,
          trips,
        })
      : null;
  const quoteTravelEstimate = estimateTravelFromHistory(trips, {
    date: quoteDraft.plannedDate,
    time: quoteDraft.plannedTime,
    pickupZone: quoteDraft.pickupZone,
    dropoffZone: quoteDraft.dropoffZone,
    zoneType: quoteDraft.zoneType,
    approachKm: quoteDraft.approachKm,
    tripKm: quoteDraft.tripKm,
  });
  const tripTravelEstimate = estimateTravelFromHistory(trips, {
    date: tripInput.date,
    time: tripInput.startTime,
    pickupZone: tripInput.pickupZone,
    dropoffZone: tripInput.dropoffZone,
    zoneType: tripInput.zoneType,
    approachKm: tripInput.approachKm,
    tripKm: tripInput.tripKm,
  });
  const zoneSuggestions = Array.from(
    new Set(
      [
        ...trips.flatMap((trip) => [trip.pickupZone, trip.dropoffZone, trip.zone]),
        ...quoteEntries.flatMap((quote) => [quote.pickupZone, quote.dropoffZone]),
      ]
        .map((zone) => zone.trim())
        .filter(Boolean),
    ),
  ).slice(0, 40);

  function setNumericTripField(field: keyof TripInput, rawValue: string) {
    setTripInput((current) => ({
      ...current,
      [field]: Number(rawValue) || 0,
    }));
  }

  function setTextTripField(field: keyof TripInput, value: string) {
    setTripInput((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function setTripSelectField(
    field: "vehicleProfileId" | "platformProfileId" | "costMode",
    value: string,
  ) {
    setTripInput((current) => ({
      ...current,
      [field]: value,
      ...(field === "vehicleProfileId"
        ? {
            costMode:
              vehicles.find((vehicle) => vehicle.id === value)?.costMode ?? current.costMode,
          }
        : {}),
    }));
  }

  function resetTripProposal(
    vehicleId = tripInput.vehicleProfileId,
    platformId = tripInput.platformProfileId,
  ) {
    const vehicle = vehicles.find((item) => item.id === vehicleId) ?? activeVehicle;
    const timeValue = getLocalTimeValue();
    setTripInput({
      ...createTripInput(
        vehicleId,
        platformId,
        vehicle?.costMode ?? tripInput.costMode,
      ),
      date: getLocalIsoDate(),
      startTime: timeValue,
      timeSlot: getTimeSlotFromTime(timeValue),
      bonus: platforms.find((platform) => platform.id === platformId)?.defaultBonus ?? 0,
    });
  }

  function selectRealtimePlatform(platformId: string) {
    const platform = platforms.find((item) => item.id === platformId) ?? null;
    setTripInput((current) => ({
      ...current,
      platformProfileId: platformId,
      bonus: current.bonus > 0 ? current.bonus : platform?.defaultBonus ?? 0,
    }));
  }

  function setVehicleDraftField<K extends keyof VehicleProfile>(field: K, value: VehicleProfile[K]) {
    setVehicleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function setVehicleMaintenanceField<K extends keyof VehicleProfile["maintenance"]>(
    field: K,
    value: VehicleProfile["maintenance"][K],
  ) {
    setVehicleDraft((current) => ({
      ...current,
      maintenance: {
        ...current.maintenance,
        [field]: value,
      },
    }));
  }

  function setPlatformDraftField<K extends keyof PlatformProfile>(
    field: K,
    value: PlatformProfile[K],
  ) {
    setPlatformDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateExpenseDraft<K extends keyof ExpenseEntry>(field: K, value: ExpenseEntry[K]) {
    setExpenseDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateFuelDraft<K extends keyof FuelEntry>(field: K, value: FuelEntry[K]) {
    setFuelDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateChargeDraft<K extends keyof ChargeEntry>(field: K, value: ChargeEntry[K]) {
    setChargeDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuoteDraft<K extends keyof QuoteEntry>(field: K, value: QuoteEntry[K]) {
    setQuoteDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateRepairDraft<K extends keyof RepairEntry>(field: K, value: RepairEntry[K]) {
    setRepairDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateRepairPartDraft<K extends keyof RepairPartEntry>(
    field: K,
    value: RepairPartEntry[K],
  ) {
    setRepairPartDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateReminderDraft<K extends keyof ReminderEntry>(
    field: K,
    value: ReminderEntry[K],
  ) {
    setReminderDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function persistGlobalSettings(nextSettings: GlobalSettings) {
    await saveGlobalSettings(nextSettings);
    setGlobalSettings(nextSettings);
  }

  function startNewRepair(vehicleId = activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID) {
    const vehicle = vehicles.find((item) => item.id === vehicleId) ?? activeVehicle;
    setRepairDraft(
      createRepairEntry({
        vehicleId,
        odometer: vehicle?.currentMileage ?? 0,
        plannedDate: getLocalIsoDate(),
      }),
    );
    setSelectedRepairId(null);
    setRepairPartDraft(createRepairPartEntry());
  }

  function startNewRepairPart(repairId = selectedRepair?.id ?? "") {
    setRepairPartDraft(
      createRepairPartEntry({
        repairId,
      }),
    );
  }

  async function handleSetActiveVehicle(vehicleId: string) {
    const nextActiveVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
    const nextSettings = {
      ...globalSettings,
      activeVehicleProfileId: vehicleId,
    };

    await persistGlobalSettings(nextSettings);
    if (nextActiveVehicle) {
      setSelectedVehicleEditorId(nextActiveVehicle.id);
      setVehicleDraft(nextActiveVehicle);
    }
    setTripInput((current) => ({
      ...current,
      vehicleProfileId: vehicleId,
      costMode:
        vehicles.find((vehicle) => vehicle.id === vehicleId)?.costMode ?? current.costMode,
    }));
    setExpenseDraft((current) => ({ ...current, vehicleProfileId: vehicleId }));
    setFuelDraft((current) => ({ ...current, vehicleProfileId: vehicleId }));
    setChargeDraft((current) => ({ ...current, vehicleProfileId: vehicleId }));
    setQuoteDraft((current) => ({
      ...current,
      vehicleProfileId: vehicleId,
      costMode: nextActiveVehicle?.costMode ?? current.costMode,
    }));
    const nextActiveRepair = repairEntries.find((repair) => repair.vehicleId === vehicleId) ?? null;
    setSelectedRepairId(nextActiveRepair?.id ?? null);
    setRepairDraft(
      nextActiveRepair ??
        createRepairEntry({
          vehicleId,
          odometer: nextActiveVehicle?.currentMileage ?? 0,
          plannedDate: getLocalIsoDate(),
        }),
    );
    setRepairPartDraft(createRepairPartEntry({ repairId: nextActiveRepair?.id ?? "" }));
    setReminderDraft((current) => ({ ...current, vehicleProfileId: vehicleId }));
  }

  async function handleSetActivePlatform(platformId: string) {
    const nextActivePlatform = platforms.find((platform) => platform.id === platformId) ?? null;
    const nextSettings = {
      ...globalSettings,
      activePlatformProfileId: platformId,
    };

    await persistGlobalSettings(nextSettings);
    if (nextActivePlatform) {
      setSelectedPlatformEditorId(nextActivePlatform.id);
      setPlatformDraft(nextActivePlatform);
    }
    setTripInput((current) => ({
      ...current,
      platformProfileId: platformId,
    }));
  }

  function startNewVehicle() {
    const nextVehicle = createVehicleProfile({
      profileName: "Nouveau véhicule",
      currentMileage: activeVehicle?.currentMileage ?? 0,
      startingMileage: activeVehicle?.currentMileage ?? 0,
    });
    setSelectedVehicleEditorId(nextVehicle.id);
    setVehicleDraft(nextVehicle);
  }

  function editVehicle(vehicle: VehicleProfile) {
    setSelectedVehicleEditorId(vehicle.id);
    setVehicleDraft(vehicle);
  }

  function duplicateVehicle(vehicle: VehicleProfile) {
    const duplicate = createVehicleProfile({
      ...vehicle,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      profileName: `${vehicle.profileName} copie`,
      status: "Actif",
    });
    setSelectedVehicleEditorId(duplicate.id);
    setVehicleDraft(duplicate);
  }

  async function handleSaveVehicle() {
    setSaving(true);

    try {
      const normalizedVehicle = cloneWithMeta(vehicleDraft);
      await saveVehicleProfile(normalizedVehicle);
      await loadAllData();
      setNotice({ tone: "success", message: "Profil véhicule enregistré." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'enregistrer le véhicule.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVehicleArchive(vehicle: VehicleProfile) {
    setSaving(true);

    try {
      const nextStatus = vehicle.status === "Archivé" ? "Actif" : "Archivé";
      await saveVehicleProfile(
        cloneWithMeta({
          ...vehicle,
          status: nextStatus,
        }),
      );
      await loadAllData();
      setNotice({
        tone: "success",
        message:
          nextStatus === "Archivé" ? "Véhicule archivé." : "Véhicule réactivé.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de modifier le véhicule.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVehicle(vehicle: VehicleProfile) {
    if (!window.confirm(`Supprimer définitivement le véhicule "${vehicle.profileName}" ?`)) {
      return;
    }

    setSaving(true);

    try {
      await deleteVehicleProfile(vehicle.id);
      await loadAllData();
      setNotice({ tone: "success", message: "Véhicule supprimé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer le véhicule.",
      });
    } finally {
      setSaving(false);
    }
  }

  function startNewPlatform() {
    const nextPlatform = createPlatformProfile({
      name: "Nouvelle plateforme",
    });
    setSelectedPlatformEditorId(nextPlatform.id);
    setPlatformDraft(nextPlatform);
  }

  function editPlatform(platform: PlatformProfile) {
    setSelectedPlatformEditorId(platform.id);
    setPlatformDraft(platform);
  }

  function duplicatePlatform(platform: PlatformProfile) {
    const duplicate = createPlatformProfile({
      ...platform,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      name: `${platform.name} copie`,
      status: "actif",
    });
    setSelectedPlatformEditorId(duplicate.id);
    setPlatformDraft(duplicate);
  }

  async function handleSavePlatform() {
    setSaving(true);

    try {
      const normalizedPlatform = cloneWithMeta(platformDraft);
      await savePlatformProfile(normalizedPlatform);
      await loadAllData();
      setNotice({ tone: "success", message: "Profil plateforme enregistré." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'enregistrer la plateforme.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePlatformArchive(platform: PlatformProfile) {
    setSaving(true);

    try {
      const nextStatus = platform.status === "archivé" ? "actif" : "archivé";
      await savePlatformProfile(
        cloneWithMeta({
          ...platform,
          status: nextStatus,
        }),
      );
      await loadAllData();
      setNotice({
        tone: "success",
        message:
          nextStatus === "archivé" ? "Plateforme archivée." : "Plateforme réactivée.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de modifier la plateforme.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlatform(platform: PlatformProfile) {
    if (!window.confirm(`Supprimer définitivement la plateforme "${platform.name}" ?`)) {
      return;
    }

    setSaving(true);

    try {
      await deletePlatformProfile(platform.id);
      await loadAllData();
      setNotice({ tone: "success", message: "Plateforme supprimée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de supprimer la plateforme.",
      });
    } finally {
      setSaving(false);
    }
  }

  function editRepair(repair: RepairEntry) {
    setSelectedRepairId(repair.id);
    setRepairDraft(repair);
    setRepairPartDraft(
      createRepairPartEntry({
        repairId: repair.id,
      }),
    );
  }

  function editRepairPart(part: RepairPartEntry) {
    setSelectedRepairId(part.repairId);
    setRepairPartDraft(part);
  }

  async function handleSaveRepair() {
    if (!repairDraft.vehicleId) {
      setNotice({ tone: "warning", message: "Sélectionnez le véhicule concerné par la réparation." });
      return;
    }

    if (!repairDraft.title.trim()) {
      setNotice({ tone: "warning", message: "Renseignez au moins un nom de réparation." });
      return;
    }

    setSaving(true);

    try {
      const relatedParts = repairPartEntries.filter((part) => part.repairId === repairDraft.id);
      const entry = cloneWithMeta(syncRepairTotals(repairDraft, relatedParts));
      await saveRepairEntry(entry);

      const matchingVehicle = vehicles.find((vehicle) => vehicle.id === entry.vehicleId);
      if (
        matchingVehicle &&
        entry.isBlocking &&
        !isRepairClosed(entry.status) &&
        matchingVehicle.status !== "En panne" &&
        matchingVehicle.status !== "En réparation"
      ) {
        await saveVehicleProfile(
          cloneWithMeta({
            ...matchingVehicle,
            status: "En réparation",
          }),
        );
      }

      await loadAllData();
      setSelectedRepairId(entry.id);
      setRepairDraft(entry);
      setRepairPartDraft(createRepairPartEntry({ repairId: entry.id }));
      setNotice({ tone: "success", message: "Réparation enregistrée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'enregistrer la réparation.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRepair(repairId: string) {
    const repair = repairEntries.find((entry) => entry.id === repairId);
    if (!repair) {
      return;
    }

    if (!window.confirm(`Supprimer la réparation "${repair.title || "Sans titre"}" ?`)) {
      return;
    }

    setSaving(true);

    try {
      for (const part of repairPartEntries.filter((entry) => entry.repairId === repairId)) {
        await deleteRepairPartEntry(part.id);
      }

      await deleteRepairEntry(repairId);
      await loadAllData();

      if (selectedRepairId === repairId) {
        startNewRepair(repair.vehicleId);
      }

      setNotice({ tone: "success", message: "Réparation supprimée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de supprimer la réparation.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRepairPart() {
    const repairId = repairPartDraft.repairId || selectedRepair?.id || "";

    if (!repairId) {
      setNotice({
        tone: "warning",
        message: "Enregistrez d’abord la réparation avant d’ajouter des pièces.",
      });
      return;
    }

    if (!repairPartDraft.name.trim()) {
      setNotice({ tone: "warning", message: "Renseignez le nom de la pièce ou du frais associé." });
      return;
    }

    setSaving(true);

    try {
      const entry: RepairPartEntry = {
        ...repairPartDraft,
        repairId,
      };

      await saveRepairPartEntry(entry);

      const matchingRepair = repairEntries.find((repair) => repair.id === repairId);
      if (matchingRepair) {
        const updatedParts = [
          ...repairPartEntries.filter((part) => part.repairId === repairId && part.id !== entry.id),
          entry,
        ];
        await saveRepairEntry(cloneWithMeta(syncRepairTotals(matchingRepair, updatedParts)));
      }

      await loadAllData();
      setSelectedRepairId(repairId);
      setRepairPartDraft(createRepairPartEntry({ repairId }));
      setNotice({ tone: "success", message: "Pièce enregistrée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer la pièce.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRepairPart(repairPartId: string) {
    const repairPart = repairPartEntries.find((entry) => entry.id === repairPartId);
    if (!repairPart) {
      return;
    }

    setSaving(true);

    try {
      await deleteRepairPartEntry(repairPartId);

      const matchingRepair = repairEntries.find((repair) => repair.id === repairPart.repairId);
      if (matchingRepair) {
        const updatedParts = repairPartEntries.filter(
          (part) => part.repairId === repairPart.repairId && part.id !== repairPartId,
        );
        await saveRepairEntry(cloneWithMeta(syncRepairTotals(matchingRepair, updatedParts)));
      }

      await loadAllData();
      setSelectedRepairId(repairPart.repairId);
      setRepairPartDraft(createRepairPartEntry({ repairId: repairPart.repairId }));
      setNotice({ tone: "success", message: "Pièce supprimée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer la pièce.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetVehicleAvailableAfterRepair(repair: RepairEntry) {
    const matchingVehicle = vehicles.find((vehicle) => vehicle.id === repair.vehicleId);
    if (!matchingVehicle) {
      setNotice({ tone: "warning", message: "Véhicule introuvable pour cette réparation." });
      return;
    }

    setSaving(true);

    try {
      await saveVehicleProfile(
        cloneWithMeta({
          ...matchingVehicle,
          status: "Actif",
        }),
      );
      await loadAllData();
      setNotice({ tone: "success", message: "Le véhicule est repassé en disponible." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de remettre le véhicule en service.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCreateExpenseFromRepair(repair: RepairEntry) {
    if (repair.status !== "Terminé") {
      setNotice({
        tone: "warning",
        message: "La réparation doit être terminée avant de créer une dépense.",
      });
      return;
    }

    const relatedParts = repairPartEntries.filter((part) => part.repairId === repair.id);
    const partsSummary = relatedParts
      .map((part) => `${part.name} ${formatCurrency(part.amountTtc)}`)
      .join(", ");

    const comment = [
      repair.description ? `Description : ${repair.description}` : "",
      partsSummary ? `Pièces : ${partsSummary}` : "",
      `Pièces TTC : ${formatCurrency(repair.partsTotalTtc)}`,
      `Main-d'œuvre TTC : ${formatCurrency(repair.laborTotalTtc)}`,
      `Autres frais TTC : ${formatCurrency(repair.otherFeesTtc)}`,
      repair.mechanicName ? `Garage / mécanicien : ${repair.mechanicName}` : "",
      repair.comment ? `Commentaire : ${repair.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setExpenseDraft(
      createExpenseEntry({
        date: repair.completedDate || repair.plannedDate || getLocalIsoDate(),
        vehicleProfileId: repair.vehicleId,
        category: getExpenseCategoryFromRepairCategory(repair.category),
        amountTtc: repair.totalRepairTtc,
        mileageAtExpense: repair.odometer,
        comment: `${repair.title}\n${comment}`.trim(),
      }),
    );
    setActiveTab("expenses");
    setNotice({
      tone: "success",
      message: "La dépense a été préremplie à partir de la réparation.",
    });
  }

  async function handleSaveExpense() {
    setSaving(true);

    try {
      const entry = cloneWithMeta(expenseDraft);
      await saveExpenseEntry(entry);

      const matchingVehicle = vehicles.find((vehicle) => vehicle.id === entry.vehicleProfileId);
      if (matchingVehicle) {
        const nextVehicle = {
          ...matchingVehicle,
          currentMileage:
            entry.mileageAtExpense > matchingVehicle.currentMileage
              ? entry.mileageAtExpense
              : matchingVehicle.currentMileage,
        };

        if (entry.category === "Vidange") {
          nextVehicle.maintenance.lastOilChangeKm = entry.mileageAtExpense;
        }

        if (entry.category === "Pneus") {
          nextVehicle.maintenance.lastTiresChangeKm = entry.mileageAtExpense;
        }

        if (entry.category === "Freins") {
          nextVehicle.maintenance.lastBrakesChangeKm = entry.mileageAtExpense;
        }

        if (entry.category === "Moteur" || entry.category === "Changement moteur") {
          nextVehicle.maintenance.engineChangedDate = entry.date;
          nextVehicle.maintenance.engineChangedMileage = entry.mileageAtExpense;
          nextVehicle.maintenance.engineChangeCostTtc = entry.amountTtc;
          nextVehicle.maintenance.engineAmortizationMonths = entry.amortizationMonths;
          nextVehicle.maintenance.engineAmortizationKm = entry.amortizationKm;
          nextVehicle.maintenance.engineComment = entry.comment;

          for (const reminder of buildEngineChangeReminders(entry)) {
            await saveReminderEntry(reminder);
          }
        }

        await saveVehicleProfile(cloneWithMeta(nextVehicle));
      }

      await loadAllData();
      setExpenseDraft(
        createExpenseEntry({
          date: getLocalIsoDate(),
          vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
        }),
      );
      setNotice({ tone: "success", message: "Dépense enregistrée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer la dépense.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFuelEntry() {
    setSaving(true);

    try {
      const entry = cloneWithMeta({
        ...fuelDraft,
        pricePerLiter:
          fuelDraft.litersAdded > 0 ? fuelDraft.amountPaid / fuelDraft.litersAdded : fuelDraft.pricePerLiter,
      });
      await saveFuelEntry(entry);

      const matchingVehicle = vehicles.find((vehicle) => vehicle.id === entry.vehicleProfileId);
      if (matchingVehicle && entry.odometerKm > matchingVehicle.currentMileage) {
        await saveVehicleProfile(
          cloneWithMeta({
            ...matchingVehicle,
            currentMileage: entry.odometerKm,
          }),
        );
      }

      await loadAllData();
      setFuelDraft(
        createFuelEntry({
          date: getLocalIsoDate(),
          vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
        }),
      );
      setNotice({ tone: "success", message: "Plein enregistré." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer le plein.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveChargeEntry() {
    setSaving(true);

    try {
      const entry = cloneWithMeta({
        ...chargeDraft,
        pricePerKwh:
          chargeDraft.kwhAdded > 0 ? chargeDraft.amountPaid / chargeDraft.kwhAdded : chargeDraft.pricePerKwh,
      });
      await saveChargeEntry(entry);

      const matchingVehicle = vehicles.find((vehicle) => vehicle.id === entry.vehicleProfileId);
      if (matchingVehicle && entry.odometerKm > matchingVehicle.currentMileage) {
        await saveVehicleProfile(
          cloneWithMeta({
            ...matchingVehicle,
            currentMileage: entry.odometerKm,
          }),
        );
      }

      await loadAllData();
      setChargeDraft(
        createChargeEntry({
          date: getLocalIsoDate(),
          vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
        }),
      );
      setNotice({ tone: "success", message: "Recharge enregistrée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'enregistrer la recharge.",
      });
    } finally {
      setSaving(false);
    }
  }

  function applyTripEstimate() {
    setTripInput((current) => ({
      ...current,
      approachMinutes: tripTravelEstimate.approachMinutes,
      tripMinutes: tripTravelEstimate.tripMinutes,
      estimatedTripMinutes: tripTravelEstimate.tripMinutes,
      actualTripMinutes: tripTravelEstimate.tripMinutes,
      timeSlot: getTimeSlotFromTime(current.startTime),
    }));
  }

  function applyQuoteEstimate() {
    setQuoteDraft((current) => ({
      ...current,
      approachMinutes: quoteTravelEstimate.approachMinutes,
      tripMinutes: quoteTravelEstimate.tripMinutes,
    }));
  }

  async function handleSaveQuote() {
    setSaving(true);

    try {
      await saveQuoteEntry(cloneWithMeta(quoteDraft));
      await loadAllData();
      setNotice({ tone: "success", message: "Devis enregistré." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer le devis.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTransformQuoteToTrip(quote: QuoteEntry) {
    const vehicle = vehicles.find((item) => item.id === quote.vehicleProfileId) ?? activeVehicle;
    const privatePlatform =
      platforms.find((platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID) ?? activePlatform;

    if (!vehicle || !privatePlatform) {
      setNotice({ tone: "warning", message: "Véhicule ou plateforme client privé introuvable." });
      return;
    }

    const quoteMetrics = calculateQuoteMetrics(quote, vehicle, {
      expenses,
      fuelEntries,
      chargeEntries,
      trips,
    });
    const tripFromQuote: TripInput = {
      ...createTripInput(vehicle.id, privatePlatform.id, quote.costMode),
      date: quote.plannedDate,
      startTime: quote.plannedTime,
      basePrice: quote.proposedPriceTtc || quoteMetrics.roundedPriceTtc,
      toll: quote.tollTtc,
      parking: quote.parkingTtc + quote.extraFeesTtc,
      approachMinutes: quote.approachMinutes,
      waitMinutes: quote.waitMinutes,
      tripMinutes: quote.tripMinutes,
      approachKm: quote.approachKm,
      tripKm: quote.tripKm,
      zone: quote.pickupZone,
      pickupZone: quote.pickupZone,
      dropoffZone: quote.dropoffZone,
      pickupCity: quote.pickupCity,
      dropoffCity: quote.dropoffCity,
      zoneType: quote.zoneType,
      timeSlot: getTimeSlotFromTime(quote.plannedTime),
      estimatedTripMinutes: quote.tripMinutes,
      actualTripMinutes: quote.tripMinutes,
      quoteId: quote.id,
      comment: quote.comment,
    };

    setSaving(true);

    try {
      const trip = buildTripRecord(tripFromQuote, vehicle, privatePlatform, {
        expenses,
        fuelEntries,
        chargeEntries,
        trips,
      });
      await saveTrip(trip);
      await saveQuoteEntry(
        cloneWithMeta({
          ...quote,
          status: "Transformé en course",
          linkedTripId: trip.id,
        }),
      );
      await loadAllData();
      setNotice({ tone: "success", message: "Devis transformé en course." });
      setActiveTab("trip");
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Impossible de transformer le devis.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReminder() {
    setSaving(true);

    try {
      await saveReminderEntry(cloneWithMeta(reminderDraft));
      await loadAllData();
      setReminderDraft(
        createReminderEntry({
          vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
        }),
      );
      setNotice({ tone: "success", message: "Rappel enregistré." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer le rappel.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteReminder(reminder: ReminderEntry) {
    await saveReminderEntry(
      cloneWithMeta({
        ...reminder,
        status: "Fait",
        completedAt: createTimestamp(),
      }),
    );
    await loadAllData();
  }

  async function handlePostponeReminder(reminder: ReminderEntry, days: number) {
    const postponedDate = new Date();
    postponedDate.setDate(postponedDate.getDate() + days);
    await saveReminderEntry(
      cloneWithMeta({
        ...reminder,
        postponedUntil: postponedDate.toISOString().slice(0, 10),
        dueDate: reminder.dueDate || postponedDate.toISOString().slice(0, 10),
      }),
    );
    await loadAllData();
  }

  async function handleSaveTrip() {
    if (!tripVehicle || !tripPlatform || !tripPreview) {
      return;
    }

    if (tripInput.basePrice <= 0 || tripPreview.totalMinutes <= 0) {
      setNotice({
        tone: "warning",
        message: "Renseignez au minimum un prix brut et un temps total supérieur à zéro.",
      });
      return;
    }

    setSaving(true);

    try {
      const preparedTripInput: TripInput = {
        ...tripInput,
        timeSlot: getTimeSlotFromTime(tripInput.startTime),
        actualTripMinutes: tripInput.tripMinutes,
        estimatedVsActualDifference:
          tripInput.estimatedTripMinutes > 0
            ? tripInput.tripMinutes - tripInput.estimatedTripMinutes
            : 0,
      };
      const trip = buildTripRecord(preparedTripInput, tripVehicle, tripPlatform, {
        expenses,
        fuelEntries,
        chargeEntries,
        trips,
      });
      await saveTrip(trip);
      await loadAllData();
      resetTripProposal(tripVehicle.id, tripPlatform.id);
      setActiveTab("dashboard");
      setNotice({
        tone:
          trip.decision === "accepter"
            ? "success"
            : trip.decision === "limite"
              ? "warning"
              : "error",
        message: `Course enregistrée : ${formatDecisionLabel(trip.decision)} à ${formatCurrency(
          trip.netHourly,
        )}/h net.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer la course.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setSaving(true);

    try {
      await deleteExpenseEntry(expenseId);
      await loadAllData();
      setNotice({ tone: "success", message: "Dépense supprimée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer la dépense.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFuelEntry(fuelEntryId: string) {
    setSaving(true);

    try {
      await deleteFuelEntry(fuelEntryId);
      await loadAllData();
      setNotice({ tone: "success", message: "Plein supprimé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer le plein.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteChargeEntry(chargeEntryId: string) {
    setSaving(true);

    try {
      await deleteChargeEntry(chargeEntryId);
      await loadAllData();
      setNotice({ tone: "success", message: "Recharge supprimée." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer la recharge.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuote(quoteId: string) {
    setSaving(true);

    try {
      await deleteQuoteEntry(quoteId);
      await loadAllData();
      setNotice({ tone: "success", message: "Devis supprimé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer le devis.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    setSaving(true);

    try {
      await deleteReminderEntry(reminderId);
      await loadAllData();
      setNotice({ tone: "success", message: "Rappel supprimé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible de supprimer le rappel.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleExportJson() {
    const snapshot = await exportSnapshot();
    downloadFile(
      `cap-4000-vtc-${selectedMonth || "sauvegarde"}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json",
    );
    setNotice({ tone: "success", message: "Export JSON généré." });
  }

  function handleExportCsv() {
    const csv = buildMonthlyCsv(trips, selectedMonth);
    downloadFile(`courses-${selectedMonth}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    setNotice({ tone: "success", message: `Export CSV du mois ${selectedMonth} généré.` });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as unknown;

      if (!isSnapshotLike(parsed)) {
        throw new Error("Le fichier JSON ne correspond pas au format attendu.");
      }

      await importSnapshot(parsed);
      await loadAllData();
      setNotice({ tone: "success", message: "Import JSON terminé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "L'import JSON a échoué. Vérifiez le fichier sélectionné.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleDeleteMonthTrips() {
    if (
      !window.confirm(`Supprimer toutes les courses enregistrées pour ${formatMonthLabel(selectedMonth)} ?`)
    ) {
      return;
    }

    setSaving(true);

    try {
      await deleteTripsForMonth(selectedMonth);
      await loadAllData();
      setNotice({
        tone: "success",
        message: `Toutes les courses du mois ${selectedMonth} ont été supprimées.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "La suppression des courses du mois a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAllData() {
    if (
      !window.confirm(
        "Cette action supprime toutes les courses, profils, dépenses et réglages. Voulez-vous continuer ?",
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      await clearAllData();
      await loadAllData();
      setNotice({
        tone: "success",
        message: "Toutes les données ont été supprimées.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "La suppression complète a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-background" />
      <main className="app-content">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Pilotage VTC multi-véhicules</p>
            <h1>Cap 4000 VTC</h1>
            <p className="hero-copy">
              Pilotez plusieurs véhicules, plusieurs plateformes, vos dépenses réelles, vos
              pleins et vos recharges avec des snapshots de coûts par course.
            </p>
          </div>
          <div className={tripPreview ? `decision-banner ${tripPreview.decision}` : "decision-banner accepter"}>
            <span className="decision-banner__label">Aperçu course</span>
            <strong>{tripPreview ? formatDecisionLabel(tripPreview.decision) : "Prêt"}</strong>
            <span>{tripPreview ? `${formatCurrency(tripPreview.netHourly)}/h net` : "Configurez une course"}</span>
          </div>
        </section>

        <section className="rules-card">
          <div>
            <strong>Véhicules actifs</strong>
            <span>{formatInteger(vehicles.filter((vehicle) => vehicle.status !== "Archivé").length)}</span>
          </div>
          <div>
            <strong>Plateformes actives</strong>
            <span>{formatInteger(platforms.filter((platform) => platform.status === "actif").length)}</span>
          </div>
          <div>
            <strong>Seuil net minimum</strong>
            <span>30 €/h</span>
          </div>
        </section>

        <nav className="tab-strip" aria-label="Navigation principale">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTab ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {notice ? (
          <section className={`notice ${notice.tone}`}>
            <p>{notice.message}</p>
            <button className="ghost-button" onClick={() => setNotice(null)} type="button">
              Fermer
            </button>
          </section>
        ) : null}

        {loading ? (
          <section className="panel-card">
            <p>Chargement des données enregistrées…</p>
          </section>
        ) : null}

        {!loading && activeTab === "dashboard" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tableau de bord</p>
                  <h2>{formatMonthLabel(selectedMonth)}</h2>
                </div>
                <label className="field compact">
                  <span>Mois</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </label>
              </div>

              <div className="filters-grid">
                <label className="field">
                  <span>Filtre véhicule</span>
                  <select
                    value={dashboardVehicleFilter}
                    onChange={(event) => setDashboardVehicleFilter(event.target.value)}
                  >
                    <option value="all">Tous les véhicules</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.profileName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Filtre plateforme</span>
                  <select
                    value={dashboardPlatformFilter}
                    onChange={(event) => setDashboardPlatformFilter(event.target.value)}
                  >
                    <option value="all">Toutes les plateformes</option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Mode de calcul</span>
                  <select
                    value={dashboardCostModeFilter}
                    onChange={(event) => setDashboardCostModeFilter(event.target.value)}
                  >
                    <option value="all">Tous les modes</option>
                    {COST_MODE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="progress-card">
                <div>
                  <span className="progress-card__label">Objectif brut suivi</span>
                  <strong>{formatCurrency(selectedObjective)}</strong>
                </div>
                <div>
                  <span className="progress-card__label">CA brut filtré</span>
                  <strong>{formatCurrency(dashboardStats.grossRevenue)}</strong>
                </div>
                <div>
                  <span className="progress-card__label">Objectif restant</span>
                  <strong>{formatCurrency(remainingGoal)}</strong>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(achievedPercentage, 100)}%` }}
                  />
                </div>
                <p className="progress-copy">{formatNumber(achievedPercentage, "% atteint")}</p>
              </div>

              <div className="quick-actions">
                <button className="ghost-button" type="button" onClick={() => setActiveTab("trip")}>
                  + Course
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveTab("expenses")}>
                  + Dépense
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveTab("energy")}>
                  + Plein
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setExpenseDraft(
                      createExpenseEntry({
                        date: getLocalIsoDate(),
                        vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
                        category: "Réparation",
                      }),
                    );
                    setActiveTab("expenses");
                  }}
                >
                  + Réparation
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveTab("maintenance")}>
                  + Entretien
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveTab("quotes")}>
                  + Devis
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveTab("vehicles")}>
                  Résultat véhicule
                </button>
              </div>
            </article>

            {activeVehicle ? (
              <article className="panel-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Santé du véhicule</p>
                    <h2>{activeVehicle.profileName}</h2>
                  </div>
                  <span
                    className={`status-chip ${
                      activeVehicleMaintenanceAlerts.some((alert) => alert.status === "maintenant")
                        ? "a-faire-maintenant"
                        : activeVehicleMaintenanceAlerts.some((alert) => alert.status === "bientot")
                          ? "bientot"
                          : "active"
                    }`}
                  >
                    {activeVehicleMaintenanceAlerts.some((alert) => alert.status === "maintenant")
                      ? "Problème urgent"
                      : activeVehicleMaintenanceAlerts.some((alert) => alert.status === "bientot")
                        ? "Entretien bientôt"
                        : "Bon état"}
                  </span>
                </div>
                <div className="metric-grid">
                  <MetricCard
                    label="Kilométrage actuel"
                    value={formatInteger(activeVehicle.currentMileage, " km")}
                  />
                  <MetricCard
                    label="Vidange restante"
                    value={formatInteger(
                      activeVehicle.maintenance.lastOilChangeKm +
                        activeVehicle.maintenance.oilChangeIntervalKm -
                        activeVehicle.currentMileage,
                      " km",
                    )}
                  />
                  <MetricCard
                    label="Pneus restants"
                    value={formatInteger(
                      activeVehicle.maintenance.lastTiresChangeKm +
                        activeVehicle.maintenance.tiresIntervalKm -
                        activeVehicle.currentMileage,
                      " km",
                    )}
                  />
                  <MetricCard
                    label="Freins restants"
                    value={formatInteger(
                      activeVehicle.maintenance.lastBrakesChangeKm +
                        activeVehicle.maintenance.brakesIntervalKm -
                        activeVehicle.currentMileage,
                      " km",
                    )}
                  />
                  <MetricCard
                    label="Rappels actifs"
                    value={formatInteger(activeVehicleReminders.filter((reminder) => reminder.status !== "Fait").length)}
                  />
                  <MetricCard
                    label="Moteur changé"
                    value={
                      activeVehicle.maintenance.engineChangedDate
                        ? activeVehicle.maintenance.engineChangedDate
                        : "Non renseigné"
                    }
                  />
                </div>
              </article>
            ) : null}

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">À ne pas oublier</p>
                  <h2>Priorités utiles</h2>
                </div>
              </div>
              <div className="stack-list">
                {importantReminders.length > 0 ? (
                  importantReminders.map((reminder) => (
                    <article key={reminder.id} className="list-card">
                      <div className="list-card__header">
                        <div>
                          <strong>{reminder.title}</strong>
                          <p>
                            {vehicles.find((vehicle) => vehicle.id === reminder.vehicleProfileId)?.profileName ??
                              "Véhicule"}{" "}
                            {reminder.dueMileage > 0 ? `• ${formatInteger(reminder.dueMileage, " km")}` : ""}
                            {reminder.dueDate ? `• ${reminder.dueDate}` : ""}
                          </p>
                        </div>
                        <span className={`status-chip ${getStatusClass(reminder.status)}`}>
                          {reminder.status}
                        </span>
                      </div>
                      <div className="action-row">
                        <button className="ghost-button" type="button" onClick={() => handleCompleteReminder(reminder)}>
                          Fait
                        </button>
                        <button className="ghost-button" type="button" onClick={() => handlePostponeReminder(reminder, 1)}>
                          Reporter demain
                        </button>
                        <button className="ghost-button" type="button" onClick={() => handlePostponeReminder(reminder, 7)}>
                          Reporter 1 semaine
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => {
                            setReminderDraft(reminder);
                            setActiveTab("maintenance");
                          }}
                        >
                          Modifier
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-copy">Aucun rappel urgent pour le moment.</p>
                )}
              </div>
            </article>

            <section className="metric-grid">
              <MetricCard label="CA brut" value={formatCurrency(dashboardStats.grossRevenue)} />
              <MetricCard
                label="Revenu après commission"
                value={formatCurrency(dashboardStats.revenueAfterCommission)}
              />
              <MetricCard label="Net réel" value={formatCurrency(dashboardStats.netIncome)} />
              <MetricCard label="Frais totaux" value={formatCurrency(dashboardStats.totalCosts)} />
              <MetricCard
                label="Dépenses réelles du mois"
                value={formatCurrency(dashboardStats.totalExpensesMonth)}
              />
              <MetricCard
                label="Amortissement imputé"
                value={formatCurrency(dashboardStats.totalDepreciation)}
              />
              <MetricCard
                label="Coût énergie réel"
                value={formatCurrency(dashboardStats.totalEnergyCost)}
              />
              <MetricCard
                label="Coût entretien réel"
                value={formatCurrency(dashboardStats.totalMaintenanceCost)}
              />
              <MetricCard label="Nombre de courses" value={formatInteger(dashboardStats.tripCount)} />
              <MetricCard label="Km total" value={formatNumber(dashboardStats.drivenKm, " km")} />
              <MetricCard label="Heures travaillées" value={formatNumber(dashboardStats.workedHours, " h")} />
              <MetricCard
                label="Moyenne brute €/h"
                value={`${formatCurrency(dashboardStats.averageGrossHourly)}/h`}
              />
              <MetricCard
                label="Moyenne nette €/h"
                value={`${formatCurrency(dashboardStats.averageNetHourly)}/h`}
              />
              <MetricCard
                label="Coût moyen au km"
                value={`${formatCurrency(dashboardStats.averageCostPerKm)}/km`}
              />
              <MetricCard
                label="Marge nette"
                value={formatNumber(dashboardStats.netMarginPercentage, "%")}
              />
            </section>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Par véhicule</p>
                  <h2>{getFilterLabel(dashboardVehicleFilter, "Tous les véhicules")}</h2>
                </div>
              </div>
              <div className="stack-list">
                {vehiclePerformances.map((item) => (
                  <article key={item.vehicleProfileId} className="list-card">
                    <div className="list-card__header">
                      <strong>{item.vehicleName}</strong>
                      <span className="status-chip active">€/h {formatCurrency(item.averageNetHourly)}</span>
                    </div>
                    <div className="list-card__metrics">
                      <span>CA: {formatCurrency(item.grossRevenue)}</span>
                      <span>Net: {formatCurrency(item.netIncome)}</span>
                      <span>Frais: {formatCurrency(item.totalCosts)}</span>
                      <span>Km: {formatNumber(item.drivenKm, " km")}</span>
                      <span>Conso réelle: {formatNumber(item.averageConsumptionReal)}</span>
                      <span>Coût/km: {formatCurrency(item.averageCostPerKm)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Par plateforme</p>
                  <h2>{getFilterLabel(dashboardPlatformFilter, "Toutes les plateformes")}</h2>
                </div>
              </div>
              <div className="stack-list">
                {platformPerformances.map((item) => (
                  <article key={item.platformProfileId} className="list-card">
                    <div className="list-card__header">
                      <strong>{item.platformName}</strong>
                      <span className="status-chip active">{formatInteger(item.tripCount)} courses</span>
                    </div>
                    <div className="list-card__metrics">
                      <span>CA: {formatCurrency(item.grossRevenue)}</span>
                      <span>Commission: {formatCurrency(item.commissionTotal)}</span>
                      <span>Net: {formatCurrency(item.netIncome)}</span>
                      <span>€/h net: {formatCurrency(item.averageNetHourly)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "trip" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Proposition en direct</p>
                  <h2>Analyse instantanée de course</h2>
                  <p className="section-copy">
                    Saisissez les informations visibles dans Uber, Bolt, Heetch ou FreeNow.
                    La décision rentable / limite / refuser se met à jour immédiatement.
                  </p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => resetTripProposal()}
                >
                  Nouvelle proposition
                </button>
              </div>

              <div className={tripPreview ? `live-signal ${tripPreview.decision}` : "live-signal attente"}>
                <div className="traffic-light" aria-hidden="true">
                  <span
                    className={
                      tripPreview?.decision === "refuser"
                        ? "traffic-light__lamp red active"
                        : "traffic-light__lamp red"
                    }
                  />
                  <span
                    className={
                      tripPreview?.decision === "limite"
                        ? "traffic-light__lamp orange active"
                        : "traffic-light__lamp orange"
                    }
                  />
                  <span
                    className={
                      tripPreview?.decision === "accepter"
                        ? "traffic-light__lamp green active"
                        : "traffic-light__lamp green"
                    }
                  />
                </div>

                <div className="live-signal__copy">
                  <span className="decision-banner__label">Décision instantanée</span>
                  <strong>
                    {tripPreview ? formatDecisionLabel(tripPreview.decision) : "En attente"}
                  </strong>
                  <p>
                    {tripPreview
                      ? tripPreview.decisionReason
                      : "Renseignez le prix, le temps total et les kilomètres pour afficher le feu."}
                  </p>
                </div>

                <div className="live-signal__metrics">
                  <span>{tripPreview ? `${formatCurrency(tripPreview.netHourly)}/h net` : "--"}</span>
                  <span>{tripPreview ? formatNumber(tripPreview.totalMinutes, " min") : "--"}</span>
                  <span>{tripPreview ? formatNumber(tripPreview.totalKm, " km") : "--"}</span>
                </div>
              </div>

              <div className="group-card">
                <h3>Plateformes rapides</h3>
                <div className="platform-quick-grid">
                  {realtimePlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      className={
                        platform.id === tripInput.platformProfileId
                          ? "platform-quick-button active"
                          : "platform-quick-button"
                      }
                      type="button"
                      onClick={() => selectRealtimePlatform(platform.id)}
                    >
                      <strong>{platform.name}</strong>
                      <span>
                        {formatNumber(platform.commissionRate, "%")}
                        {platform.comment ? " • réglable" : ""}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Véhicule utilisé</span>
                    <select
                      value={tripInput.vehicleProfileId}
                      onChange={(event) => setTripSelectField("vehicleProfileId", event.target.value)}
                    >
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.profileName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Prix brut proposé</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripInput.basePrice}
                      onChange={(event) => setNumericTripField("basePrice", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Temps approche (min)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tripInput.approachMinutes}
                      onChange={(event) => setNumericTripField("approachMinutes", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Temps attente (min)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tripInput.waitMinutes}
                      onChange={(event) => setNumericTripField("waitMinutes", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Temps course (min)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tripInput.tripMinutes}
                      onChange={(event) => setNumericTripField("tripMinutes", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Km approche</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={tripInput.approachKm}
                      onChange={(event) => setNumericTripField("approachKm", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Km course</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={tripInput.tripKm}
                      onChange={(event) => setNumericTripField("tripKm", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Bonus</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripInput.bonus}
                      onChange={(event) => setNumericTripField("bonus", event.target.value)}
                    />
                  </label>
                </div>

                <div className="estimate-strip">
                  <div>
                    <strong>{formatNumber(tripTravelEstimate.tripMinutes, " min estimées")}</strong>
                    <p>
                      {tripTravelEstimate.message} Confiance {tripTravelEstimate.confidenceLevel}.
                    </p>
                  </div>
                  <div className="chip-row">
                    <button className="ghost-button" type="button" onClick={applyTripEstimate}>
                      Appliquer l’estimation
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => resetTripProposal()}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              <details className="details-panel">
                <summary>Détails complémentaires</summary>
                <div className="form-grid">
                  <label className="field">
                    <span>Date</span>
                    <input
                      type="date"
                      value={tripInput.date}
                      onChange={(event) => setTextTripField("date", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Heure</span>
                    <input
                      type="time"
                      value={tripInput.startTime}
                      onChange={(event) =>
                        setTripInput((current) => ({
                          ...current,
                          startTime: event.target.value,
                          timeSlot: getTimeSlotFromTime(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Plateforme utilisée</span>
                    <select
                      value={tripInput.platformProfileId}
                      onChange={(event) => setTripSelectField("platformProfileId", event.target.value)}
                    >
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Mode de calcul</span>
                    <select
                      value={tripInput.costMode}
                      onChange={(event) => setTripSelectField("costMode", event.target.value)}
                    >
                      {COST_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Pourboire</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripInput.tip}
                      onChange={(event) => setNumericTripField("tip", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Péage</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripInput.toll}
                      onChange={(event) => setNumericTripField("toll", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Parking</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripInput.parking}
                      onChange={(event) => setNumericTripField("parking", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Temps estimé par l’app</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tripInput.estimatedTripMinutes}
                      onChange={(event) => setNumericTripField("estimatedTripMinutes", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Zone de départ</span>
                    <input
                      type="text"
                      list="zone-suggestions"
                      value={tripInput.pickupZone}
                      onChange={(event) =>
                        setTripInput((current) => ({
                          ...current,
                          pickupZone: event.target.value,
                          zone: event.target.value,
                        }))
                      }
                      placeholder="Paris 11, Orly, CDG..."
                    />
                  </label>
                  <label className="field">
                    <span>Zone d’arrivée</span>
                    <input
                      type="text"
                      list="zone-suggestions"
                      value={tripInput.dropoffZone}
                      onChange={(event) => setTextTripField("dropoffZone", event.target.value)}
                      placeholder="Paris 8, Gare de Lyon..."
                    />
                  </label>
                  <label className="field">
                    <span>Ville de départ</span>
                    <input
                      type="text"
                      value={tripInput.pickupCity}
                      onChange={(event) => setTextTripField("pickupCity", event.target.value)}
                      placeholder="Paris"
                    />
                  </label>
                  <label className="field">
                    <span>Ville d’arrivée</span>
                    <input
                      type="text"
                      value={tripInput.dropoffCity}
                      onChange={(event) => setTextTripField("dropoffCity", event.target.value)}
                      placeholder="Paris"
                    />
                  </label>
                  <label className="field">
                    <span>Type de zone</span>
                    <select
                      value={tripInput.zoneType}
                      onChange={(event) =>
                        setTripInput((current) => ({
                          ...current,
                          zoneType: event.target.value as TripInput["zoneType"],
                        }))
                      }
                    >
                      {ZONE_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field field--full">
                    <span>Commentaire</span>
                    <textarea
                      rows={3}
                      value={tripInput.comment}
                      onChange={(event) => setTextTripField("comment", event.target.value)}
                      placeholder="Commentaire, stratégie, zone."
                    />
                  </label>
                </div>
              </details>

              <datalist id="zone-suggestions">
                {zoneSuggestions.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </article>

            {tripPreview && tripVehicle && tripPlatform ? (
              <article className={`panel-card panel-card--decision ${tripPreview.decision}`}>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{tripVehicle.profileName} • {tripPlatform.name}</p>
                    <h2>{formatDecisionLabel(tripPreview.decision)}</h2>
                    <p className="section-copy">{tripPreview.decisionReason}</p>
                  </div>
                  <span className={`decision-chip ${tripPreview.decision}`}>
                    {formatCurrency(tripPreview.netHourly)}/h net
                  </span>
                </div>

                <div className="metric-grid">
                  <MetricCard label="Revenu brut" value={formatCurrency(tripPreview.grossRevenue)} />
                  <MetricCard label="Commission" value={formatCurrency(tripPreview.platformCommissionAmount)} />
                  <MetricCard
                    label="Revenu après commission"
                    value={formatCurrency(tripPreview.revenueAfterCommission)}
                  />
                  <MetricCard label="Temps total" value={formatNumber(tripPreview.totalMinutes, " min")} />
                  <MetricCard label="Km total" value={formatNumber(tripPreview.totalKm, " km")} />
                  <MetricCard
                    label={getEnergyCostLabel(tripVehicle)}
                    value={formatCurrency(tripPreview.energyCost)}
                  />
                  <MetricCard
                    label="Coût assurance"
                    value={formatCurrency(tripPreview.insuranceAllocated)}
                  />
                  <MetricCard
                    label="Coût frais fixes"
                    value={formatCurrency(tripPreview.fixedCostsAllocated)}
                  />
                  <MetricCard
                    label="Amortissement"
                    value={formatCurrency(tripPreview.depreciationAllocated)}
                  />
                  <MetricCard
                    label="Entretien"
                    value={formatCurrency(tripPreview.maintenanceReserved)}
                  />
                  <MetricCard label="Pneus" value={formatCurrency(tripPreview.tiresCost)} />
                  <MetricCard label="Freins" value={formatCurrency(tripPreview.brakesCost)} />
                  <MetricCard label="Vidange" value={formatCurrency(tripPreview.oilChangeCost)} />
                  <MetricCard
                    label="Réparation imputée"
                    value={formatCurrency(tripPreview.repairAllocated)}
                  />
                  <MetricCard label="Péage" value={formatCurrency(tripPreview.tollCost)} />
                  <MetricCard label="Parking" value={formatCurrency(tripPreview.parkingCost)} />
                  <MetricCard label="Frais totaux" value={formatCurrency(tripPreview.totalCosts)} />
                  <MetricCard label="Net réel" value={formatCurrency(tripPreview.netIncome)} />
                  <MetricCard label="€/h net" value={`${formatCurrency(tripPreview.netHourly)}/h`} />
                  <MetricCard
                    label="Coût au km"
                    value={`${formatCurrency(tripPreview.totalCostPerKm)}/km`}
                  />
                </div>

                <button
                  className={`primary-button ${tripPreview.decision}`}
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer la course"}
                </button>
              </article>
            ) : null}
          </section>
        ) : null}

        {!loading && activeTab === "calendar" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Calendrier</p>
                  <h2>{formatMonthLabel(selectedMonth)}</h2>
                </div>
                <label className="field compact">
                  <span>Mois</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </label>
              </div>

              <div className="calendar-grid">
                {monthDays.map((day) => {
                  const summary = workDaySummaries.find((item) => item.date === day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`calendar-day ${getStatusClass(summary?.status ?? "non travaillé")} ${
                        selectedCalendarDate === day ? "selected" : ""
                      }`}
                      onClick={() => setSelectedCalendarDate(day)}
                    >
                      <strong>{Number(day.slice(-2))}</strong>
                      <span>{summary ? formatCurrency(summary.totalNetTtc) : "Repos"}</span>
                    </button>
                  );
                })}
              </div>
            </article>

            <section className="metric-grid">
              <MetricCard
                label="Meilleur jour"
                value={bestWorkDay ? `${bestWorkDay.date} • ${formatCurrency(bestWorkDay.averageNetPerHour)}/h` : "N/A"}
              />
              <MetricCard
                label="Jour à surveiller"
                value={worstWorkDay ? `${worstWorkDay.date} • ${formatCurrency(worstWorkDay.averageNetPerHour)}/h` : "N/A"}
              />
              <MetricCard
                label="Trajets appris"
                value={formatInteger(travelCalibrations.reduce((sum, item) => sum + item.sampleCount, 0))}
              />
            </section>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Détail du jour</p>
                  <h2>{selectedCalendarDate}</h2>
                </div>
                <span className={`status-chip ${getStatusClass(selectedDaySummary?.status ?? "non travaillé")}`}>
                  {selectedDaySummary?.status ?? "non travaillé"}
                </span>
              </div>

              <div className="metric-grid">
                <MetricCard
                  label="CA brut"
                  value={formatCurrency(selectedDaySummary?.totalRevenueTtc ?? 0)}
                />
                <MetricCard
                  label="Net réel"
                  value={formatCurrency(selectedDaySummary?.totalNetTtc ?? 0)}
                />
                <MetricCard
                  label="Dépenses du jour"
                  value={formatCurrency(selectedDaySummary?.totalExpensesTtc ?? 0)}
                />
                <MetricCard
                  label="Courses"
                  value={formatInteger(selectedDaySummary?.courseCount ?? 0)}
                />
                <MetricCard
                  label="Heures"
                  value={formatNumber(selectedDaySummary?.totalHours ?? 0, " h")}
                />
                <MetricCard
                  label="Km"
                  value={formatNumber(selectedDaySummary?.totalKm ?? 0, " km")}
                />
              </div>

              <div className="stack-list">
                {selectedDayTrips.map((trip) => (
                  <article key={trip.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{trip.pickupZone || trip.zone} → {trip.dropoffZone || "Arrivée"}</strong>
                        <p>{trip.platformSnapshot.name} • {trip.vehicleSnapshot.profileName}</p>
                      </div>
                      <span className={`decision-chip ${trip.decision}`}>
                        {formatCurrency(trip.netHourly)}/h
                      </span>
                    </div>
                    <div className="list-card__metrics">
                      <span>Net: {formatCurrency(trip.netIncome)}</span>
                      <span>{formatNumber(trip.totalMinutes, " min")}</span>
                      <span>{formatNumber(trip.totalKm, " km")}</span>
                      <span>{trip.timeSlot}</span>
                    </div>
                  </article>
                ))}
                {selectedDayExpenses.map((expense) => (
                  <article key={expense.id} className="list-card">
                    <div className="list-card__header">
                      <strong>{expense.category}</strong>
                      <span className="status-chip warning">{formatCurrency(expense.amountTtc)}</span>
                    </div>
                  </article>
                ))}
                {[...selectedDayFuelEntries, ...selectedDayChargeEntries].length > 0 ? (
                  <p className="empty-copy">
                    Pleins / recharges : {formatInteger(selectedDayFuelEntries.length + selectedDayChargeEntries.length)}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Zones rentables</p>
                  <h2>Ce que les courses apprennent</h2>
                </div>
              </div>
              <div className="stack-list">
                {zoneStats.slice(0, 6).map((zone) => (
                  <article key={zone.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{zone.zoneName}</strong>
                        <p>{zone.city || zone.zoneType}</p>
                      </div>
                      <span className="status-chip active">
                        {formatCurrency(zone.averageNetPerHour)}/h
                      </span>
                    </div>
                    <div className="list-card__metrics">
                      <span>{formatInteger(zone.courseCount)} courses</span>
                      <span>Net: {formatCurrency(zone.totalNetTtc)}</span>
                      <span>Attente: {formatNumber(zone.averageWaitMinutes, " min")}</span>
                      <span>{formatNumber(zone.averageMinutesPerKm, " min/km")}</span>
                    </div>
                  </article>
                ))}
                {zoneStats.length === 0 ? (
                  <p className="empty-copy">Ajoutez des zones dans les courses pour lancer l’analyse.</p>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "vehicles" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Profils véhicules</p>
                  <h2>Gestion multi-véhicules</h2>
                </div>
                <button className="ghost-button" type="button" onClick={startNewVehicle}>
                  Créer un véhicule
                </button>
              </div>

              <div className="stack-list">
                {vehicles.map((vehicle) => (
                  <article key={vehicle.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{vehicle.profileName}</strong>
                        <p>{vehicle.brand} {vehicle.model} • {vehicle.nickname || vehicle.status}</p>
                      </div>
                      <div className="chip-row">
                        <span className={`status-chip ${getStatusClass(vehicle.status)}`}>{vehicle.status}</span>
                        {vehicle.id === globalSettings.activeVehicleProfileId ? (
                          <span className="status-chip active">Par défaut</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="list-card__metrics">
                      <span>{vehicle.vehicleType}</span>
                      <span>{vehicle.energyType}</span>
                      <span>{formatInteger(vehicle.currentMileage, " km")}</span>
                      <span>{vehicle.costMode}</span>
                    </div>
                    <div className="action-row">
                      <button className="ghost-button" type="button" onClick={() => editVehicle(vehicle)}>
                        Modifier
                      </button>
                      <button className="ghost-button" type="button" onClick={() => duplicateVehicle(vehicle)}>
                        Dupliquer
                      </button>
                      <button className="ghost-button" type="button" onClick={() => handleSetActiveVehicle(vehicle.id)}>
                        Définir actif
                      </button>
                      <button className="ghost-button" type="button" onClick={() => handleToggleVehicleArchive(vehicle)}>
                        {vehicle.status === "Archivé" ? "Réactiver" : "Archiver"}
                      </button>
                      <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteVehicle(vehicle)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Éditeur véhicule</p>
                  <h2>{vehicleDraft.profileName}</h2>
                </div>
              </div>

              <div className="group-grid">
                <section className="group-card">
                  <h3>Informations générales</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Nom du profil</span>
                      <input
                        type="text"
                        value={vehicleDraft.profileName}
                        onChange={(event) => setVehicleDraftField("profileName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Marque</span>
                      <input
                        type="text"
                        value={vehicleDraft.brand}
                        onChange={(event) => setVehicleDraftField("brand", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Modèle</span>
                      <input
                        type="text"
                        value={vehicleDraft.model}
                        onChange={(event) => setVehicleDraftField("model", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Année</span>
                      <input
                        type="number"
                        min="1900"
                        step="1"
                        value={vehicleDraft.year}
                        onChange={(event) => setVehicleDraftField("year", Number(event.target.value) || 0)}
                      />
                    </label>
                    <label className="field">
                      <span>Immatriculation / surnom</span>
                      <input
                        type="text"
                        value={vehicleDraft.nickname}
                        onChange={(event) => setVehicleDraftField("nickname", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Kilométrage actuel</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.currentMileage}
                        onChange={(event) =>
                          setVehicleDraftField("currentMileage", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Kilométrage début d’utilisation</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.startingMileage}
                        onChange={(event) =>
                          setVehicleDraftField("startingMileage", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Statut</span>
                      <select
                        value={vehicleDraft.status}
                        onChange={(event) => setVehicleDraftField("status", event.target.value as VehicleProfile["status"])}
                      >
                        {VEHICLE_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Type d’énergie</span>
                      <select
                        value={vehicleDraft.vehicleType}
                        onChange={(event) => {
                          const value = event.target.value as VehicleProfile["vehicleType"];
                          setVehicleDraft((current) => ({
                            ...current,
                            vehicleType: value,
                            energyType: getDefaultEnergyTypeForVehicleType(value),
                          }));
                        }}
                      >
                        {VEHICLE_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Carburant / énergie</span>
                      <select
                        value={vehicleDraft.energyType}
                        onChange={(event) => setVehicleDraftField("energyType", event.target.value as VehicleProfile["energyType"])}
                      >
                        {ENERGY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Mode de calcul</span>
                      <select
                        value={vehicleDraft.costMode}
                        onChange={(event) => setVehicleDraftField("costMode", event.target.value as CostMode)}
                      >
                        {COST_MODE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="group-card">
                  <h3>Valeurs estimées</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Consommation estimée</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={vehicleDraft.estimatedConsumptionPer100Km}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedConsumptionPer100Km", Number(event.target.value) || 0)
                        }
                      />
                      <small className="field-note">{getConsumptionUnitLabel(vehicleDraft)}</small>
                    </label>
                    <label className="field">
                      <span>Prix carburant estimé</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.estimatedEnergyPricePerUnit}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedEnergyPricePerUnit", Number(event.target.value) || 0)
                        }
                      />
                      <small className="field-note">{getEnergyPriceUnitLabel(vehicleDraft)}</small>
                    </label>
                    <label className="field">
                      <span>Entretien estimé €/km</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={vehicleDraft.estimatedMaintenanceCostPerKm}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedMaintenanceCostPerKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Pneus estimés €/km</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={vehicleDraft.estimatedTiresCostPerKm}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedTiresCostPerKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Freins estimés €/km</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={vehicleDraft.estimatedBrakesCostPerKm}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedBrakesCostPerKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Vidange estimée €/km</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={vehicleDraft.estimatedOilChangeCostPerKm}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedOilChangeCostPerKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Assurance mensuelle estimée</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.estimatedMonthlyInsurance}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedMonthlyInsurance", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Frais fixes mensuels estimés</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.estimatedMonthlyFixedCosts}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedMonthlyFixedCosts", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Jours travaillés prévus / mois</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={vehicleDraft.plannedWorkDaysPerMonth}
                        onChange={(event) =>
                          setVehicleDraftField("plannedWorkDaysPerMonth", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Heures prévues / jour</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={vehicleDraft.plannedWorkHoursPerDay}
                        onChange={(event) =>
                          setVehicleDraftField("plannedWorkHoursPerDay", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Objectif CA mensuel</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.monthlyRevenueTarget}
                        onChange={(event) =>
                          setVehicleDraftField("monthlyRevenueTarget", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Km prévus / mois</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.plannedKmPerMonth}
                        onChange={(event) =>
                          setVehicleDraftField("plannedKmPerMonth", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className="group-card">
                  <h3>Financement / amortissement</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Mode de possession</span>
                      <select
                        value={vehicleDraft.possessionMode}
                        onChange={(event) =>
                          setVehicleDraftField("possessionMode", event.target.value as VehicleProfile["possessionMode"])
                        }
                      >
                        {POSSESSION_MODE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Prix d’achat</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.purchasePrice}
                        onChange={(event) =>
                          setVehicleDraftField("purchasePrice", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Date d’achat</span>
                      <input
                        type="date"
                        value={vehicleDraft.purchaseDate}
                        onChange={(event) => setVehicleDraftField("purchaseDate", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Kilométrage à l’achat</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.purchaseMileage}
                        onChange={(event) =>
                          setVehicleDraftField("purchaseMileage", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Valeur de revente estimée</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.estimatedResaleValue}
                        onChange={(event) =>
                          setVehicleDraftField("estimatedResaleValue", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Durée d’amortissement (mois)</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={vehicleDraft.amortizationDurationMonths}
                        onChange={(event) =>
                          setVehicleDraftField("amortizationDurationMonths", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Mensualité crédit</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.creditMonthlyPayment}
                        onChange={(event) =>
                          setVehicleDraftField("creditMonthlyPayment", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Durée restante crédit</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.creditRemainingMonths}
                        onChange={(event) =>
                          setVehicleDraftField("creditRemainingMonths", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Montant restant dû</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.creditRemainingDebt}
                        onChange={(event) =>
                          setVehicleDraftField("creditRemainingDebt", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Mensualité location / LLD / LOA</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.leaseMonthlyPayment}
                        onChange={(event) =>
                          setVehicleDraftField("leaseMonthlyPayment", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Apport éventuel</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.leaseDownPayment}
                        onChange={(event) =>
                          setVehicleDraftField("leaseDownPayment", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Durée contrat</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.leaseDurationMonths}
                        onChange={(event) =>
                          setVehicleDraftField("leaseDurationMonths", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Kilométrage inclus</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.leaseIncludedKm}
                        onChange={(event) =>
                          setVehicleDraftField("leaseIncludedKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Coût km supplémentaire</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.leaseExtraKmCost}
                        onChange={(event) =>
                          setVehicleDraftField("leaseExtraKmCost", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field inline-check">
                      <span>Inclure l’amortissement</span>
                      <input
                        type="checkbox"
                        checked={vehicleDraft.includeDepreciation}
                        onChange={(event) =>
                          setVehicleDraftField("includeDepreciation", event.target.checked)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Mode d’amortissement</span>
                      <select
                        value={vehicleDraft.depreciationMode}
                        onChange={(event) =>
                          setVehicleDraftField("depreciationMode", event.target.value as VehicleProfile["depreciationMode"])
                        }
                      >
                        {DEPRECIATION_MODE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <button className="primary-button neutral" type="button" onClick={handleSaveVehicle} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer le véhicule"}
              </button>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "vehicles" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Profils plateformes</p>
                  <h2>Commissions et frais par course</h2>
                </div>
                <button className="ghost-button" type="button" onClick={startNewPlatform}>
                  Créer une plateforme
                </button>
              </div>

              <div className="stack-list">
                {platforms.map((platform) => (
                  <article key={platform.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{platform.name}</strong>
                        <p>{formatNumber(platform.commissionRate, "%")} de commission</p>
                      </div>
                      <div className="chip-row">
                        <span className={`status-chip ${getStatusClass(platform.status)}`}>
                          {platform.status}
                        </span>
                        {platform.id === globalSettings.activePlatformProfileId ? (
                          <span className="status-chip active">Par défaut</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="list-card__metrics">
                      <span>Frais fixes course: {formatCurrency(platform.fixedFeePerTrip)}</span>
                      <span>Bonus défaut: {formatCurrency(platform.defaultBonus)}</span>
                    </div>
                    <div className="action-row">
                      <button className="ghost-button" type="button" onClick={() => editPlatform(platform)}>
                        Modifier
                      </button>
                      <button className="ghost-button" type="button" onClick={() => duplicatePlatform(platform)}>
                        Dupliquer
                      </button>
                      <button className="ghost-button" type="button" onClick={() => handleSetActivePlatform(platform.id)}>
                        Définir actif
                      </button>
                      <button className="ghost-button" type="button" onClick={() => handleTogglePlatformArchive(platform)}>
                        {platform.status === "archivé" ? "Réactiver" : "Archiver"}
                      </button>
                      <button className="ghost-button danger-text" type="button" onClick={() => handleDeletePlatform(platform)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Éditeur plateforme</p>
                  <h2>{platformDraft.name}</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Nom</span>
                  <input
                    type="text"
                    value={platformDraft.name}
                    onChange={(event) => setPlatformDraftField("name", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Commission %</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={platformDraft.commissionRate}
                    onChange={(event) => setPlatformDraftField("commissionRate", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Frais fixes par course</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={platformDraft.fixedFeePerTrip}
                    onChange={(event) => setPlatformDraftField("fixedFeePerTrip", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Bonus éventuel</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={platformDraft.defaultBonus}
                    onChange={(event) => setPlatformDraftField("defaultBonus", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Statut</span>
                  <select
                    value={platformDraft.status}
                    onChange={(event) => setPlatformDraftField("status", event.target.value as PlatformProfile["status"])}
                  >
                    {PLATFORM_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field--full">
                  <span>Commentaire</span>
                  <textarea
                    rows={3}
                    value={platformDraft.comment}
                    onChange={(event) => setPlatformDraftField("comment", event.target.value)}
                  />
                </label>
              </div>

              <button className="primary-button neutral" type="button" onClick={handleSavePlatform} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer la plateforme"}
              </button>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "expenses" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Journal des dépenses</p>
                  <h2>Dépenses réelles</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={expenseDraft.date}
                    onChange={(event) => updateExpenseDraft("date", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Véhicule</span>
                  <select
                    value={expenseDraft.vehicleProfileId}
                    onChange={(event) => updateExpenseDraft("vehicleProfileId", event.target.value)}
                  >
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.profileName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Catégorie</span>
                  <select
                    value={expenseDraft.category}
                    onChange={(event) => updateExpenseDraft("category", event.target.value as ExpenseEntry["category"])}
                  >
                    {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Montant TTC</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseDraft.amountTtc}
                    onChange={(event) => updateExpenseDraft("amountTtc", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Kilométrage au moment de la dépense</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={expenseDraft.mileageAtExpense}
                    onChange={(event) => updateExpenseDraft("mileageAtExpense", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Moyen de paiement</span>
                  <input
                    type="text"
                    value={expenseDraft.paymentMethod}
                    onChange={(event) => updateExpenseDraft("paymentMethod", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Référence facture</span>
                  <input
                    type="text"
                    value={expenseDraft.receiptReference}
                    onChange={(event) => updateExpenseDraft("receiptReference", event.target.value)}
                  />
                </label>
                <label className="field inline-check">
                  <span>Récurrent</span>
                  <input
                    type="checkbox"
                    checked={expenseDraft.recurring}
                    onChange={(event) => updateExpenseDraft("recurring", event.target.checked)}
                  />
                </label>
                <label className="field inline-check">
                  <span>Inclure dans la rentabilité</span>
                  <input
                    type="checkbox"
                    checked={expenseDraft.includeInProfitability}
                    onChange={(event) =>
                      updateExpenseDraft("includeInProfitability", event.target.checked)
                    }
                  />
                </label>
                <label className="field inline-check">
                  <span>Amortir cette dépense</span>
                  <input
                    type="checkbox"
                    checked={expenseDraft.amortize}
                    onChange={(event) => updateExpenseDraft("amortize", event.target.checked)}
                  />
                </label>
                <label className="field">
                  <span>Amortissement en mois</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={expenseDraft.amortizationMonths}
                    onChange={(event) =>
                      updateExpenseDraft("amortizationMonths", Number(event.target.value) || 0)
                    }
                  />
                </label>
                <label className="field">
                  <span>Amortissement en km</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={expenseDraft.amortizationKm}
                    onChange={(event) =>
                      updateExpenseDraft("amortizationKm", Number(event.target.value) || 0)
                    }
                  />
                </label>
                <label className="field field--full">
                  <span>Commentaire</span>
                  <textarea
                    rows={3}
                    value={expenseDraft.comment}
                    onChange={(event) => updateExpenseDraft("comment", event.target.value)}
                  />
                </label>
              </div>

              <button className="primary-button neutral" type="button" onClick={handleSaveExpense} disabled={saving}>
                {saving ? "Enregistrement..." : "Ajouter la dépense"}
              </button>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Historique récent</p>
                  <h2>{formatInteger(expenses.length)} dépense(s)</h2>
                </div>
              </div>
              <div className="stack-list">
                {expenses.slice(0, 12).map((expense) => (
                  <article key={expense.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{expense.category}</strong>
                        <p>{expense.date} • {vehicles.find((vehicle) => vehicle.id === expense.vehicleProfileId)?.profileName ?? "Véhicule"}</p>
                      </div>
                      <span className="status-chip active">{formatCurrency(expense.amountTtc)}</span>
                    </div>
                    <div className="list-card__metrics">
                      <span>{expense.recurring ? "Récurrente" : "Ponctuelle"}</span>
                      <span>{expense.amortize ? "Amortie" : "Non amortie"}</span>
                      <span>{expense.includeInProfitability ? "Incluse" : "Exclue"}</span>
                    </div>
                    <div className="action-row">
                      <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteExpense(expense.id)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "energy" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Pleins / énergie</p>
                  <h2>{activeVehicle ? activeVehicle.profileName : "Sélectionnez un véhicule"}</h2>
                </div>
              </div>

              {activeVehicle ? (
                <>
                  <div className="metric-grid">
                    <MetricCard
                      label="Dernière consommation réelle"
                      value={
                        activeVehicleEnergyMetrics?.latestConsumptionPer100Km != null
                          ? formatNumber(
                              activeVehicleEnergyMetrics?.latestConsumptionPer100Km ?? 0,
                              ` ${getConsumptionUnitLabel(activeVehicle)}`,
                            )
                          : "N/A"
                      }
                    />
                    <MetricCard
                      label="Moyenne 3 derniers"
                      value={
                        activeVehicleEnergyMetrics?.averageLast3ConsumptionPer100Km != null
                          ? formatNumber(
                              activeVehicleEnergyMetrics?.averageLast3ConsumptionPer100Km ?? 0,
                              ` ${getConsumptionUnitLabel(activeVehicle)}`,
                            )
                          : "N/A"
                      }
                    />
                    <MetricCard
                      label="Moyenne du mois"
                      value={
                        activeVehicleEnergyMetrics?.averageMonthConsumptionPer100Km != null
                          ? formatNumber(
                              activeVehicleEnergyMetrics?.averageMonthConsumptionPer100Km ?? 0,
                              ` ${getConsumptionUnitLabel(activeVehicle)}`,
                            )
                          : "N/A"
                      }
                    />
                    <MetricCard
                      label="Coût énergie réel au km"
                      value={
                        activeVehicleEnergyMetrics?.averageCostPerKm != null
                          ? `${formatCurrency(activeVehicleEnergyMetrics?.averageCostPerKm ?? 0)}/km`
                          : "N/A"
                      }
                    />
                    <MetricCard
                      label="Coût énergie / jour"
                      value={
                        activeVehicleEnergyMetrics?.averageDailyEnergyCost != null
                          ? formatCurrency(activeVehicleEnergyMetrics?.averageDailyEnergyCost ?? 0)
                          : "N/A"
                      }
                    />
                    <MetricCard
                      label="Coût énergie / course"
                      value={
                        activeVehicleEnergyMetrics?.averageEnergyCostPerTrip != null
                          ? formatCurrency(activeVehicleEnergyMetrics?.averageEnergyCostPerTrip ?? 0)
                          : "N/A"
                      }
                    />
                  </div>

                  {!isElectricVehicle(activeVehicle) ? (
                    <div className="group-card">
                      <h3>Ajouter un plein</h3>
                      <div className="form-grid">
                        <label className="field">
                          <span>Date</span>
                          <input
                            type="date"
                            value={fuelDraft.date}
                            onChange={(event) => updateFuelDraft("date", event.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span>Véhicule</span>
                          <select
                            value={fuelDraft.vehicleProfileId}
                            onChange={(event) => updateFuelDraft("vehicleProfileId", event.target.value)}
                          >
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.profileName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Kilométrage compteur</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={fuelDraft.odometerKm}
                            onChange={(event) => updateFuelDraft("odometerKm", Number(event.target.value) || 0)}
                          />
                        </label>
                        <label className="field">
                          <span>Litres ajoutés</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fuelDraft.litersAdded}
                            onChange={(event) =>
                              updateFuelDraft("litersAdded", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Montant payé</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fuelDraft.amountPaid}
                            onChange={(event) =>
                              updateFuelDraft("amountPaid", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Prix au litre</span>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={fuelDraft.pricePerLiter}
                            onChange={(event) =>
                              updateFuelDraft("pricePerLiter", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Station</span>
                          <input
                            type="text"
                            value={fuelDraft.station}
                            onChange={(event) => updateFuelDraft("station", event.target.value)}
                          />
                        </label>
                        <label className="field inline-check">
                          <span>Plein complet</span>
                          <input
                            type="checkbox"
                            checked={fuelDraft.fullRefill}
                            onChange={(event) => updateFuelDraft("fullRefill", event.target.checked)}
                          />
                        </label>
                        <label className="field field--full">
                          <span>Commentaire</span>
                          <textarea
                            rows={2}
                            value={fuelDraft.comment}
                            onChange={(event) => updateFuelDraft("comment", event.target.value)}
                          />
                        </label>
                      </div>
                      <button className="primary-button neutral" type="button" onClick={handleSaveFuelEntry} disabled={saving}>
                        {saving ? "Enregistrement..." : "Ajouter le plein"}
                      </button>
                    </div>
                  ) : (
                    <div className="group-card">
                      <h3>Ajouter une recharge</h3>
                      <div className="form-grid">
                        <label className="field">
                          <span>Date</span>
                          <input
                            type="date"
                            value={chargeDraft.date}
                            onChange={(event) => updateChargeDraft("date", event.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span>Véhicule</span>
                          <select
                            value={chargeDraft.vehicleProfileId}
                            onChange={(event) => updateChargeDraft("vehicleProfileId", event.target.value)}
                          >
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.profileName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Kilométrage compteur</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={chargeDraft.odometerKm}
                            onChange={(event) => updateChargeDraft("odometerKm", Number(event.target.value) || 0)}
                          />
                        </label>
                        <label className="field">
                          <span>kWh ajoutés</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={chargeDraft.kwhAdded}
                            onChange={(event) =>
                              updateChargeDraft("kwhAdded", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Montant payé</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={chargeDraft.amountPaid}
                            onChange={(event) =>
                              updateChargeDraft("amountPaid", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Prix au kWh</span>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={chargeDraft.pricePerKwh}
                            onChange={(event) =>
                              updateChargeDraft("pricePerKwh", Number(event.target.value) || 0)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Lieu</span>
                          <input
                            type="text"
                            value={chargeDraft.location}
                            onChange={(event) => updateChargeDraft("location", event.target.value)}
                          />
                        </label>
                        <label className="field inline-check">
                          <span>Recharge complète</span>
                          <input
                            type="checkbox"
                            checked={chargeDraft.fullCharge}
                            onChange={(event) => updateChargeDraft("fullCharge", event.target.checked)}
                          />
                        </label>
                        <label className="field field--full">
                          <span>Commentaire</span>
                          <textarea
                            rows={2}
                            value={chargeDraft.comment}
                            onChange={(event) => updateChargeDraft("comment", event.target.value)}
                          />
                        </label>
                      </div>
                      <button className="primary-button neutral" type="button" onClick={handleSaveChargeEntry} disabled={saving}>
                        {saving ? "Enregistrement..." : "Ajouter la recharge"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="empty-copy">Créez d’abord un véhicule pour enregistrer vos pleins ou recharges.</p>
              )}
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Historique énergie</p>
                  <h2>Dernières saisies</h2>
                </div>
              </div>
              <div className="stack-list">
                {fuelEntries.slice(0, 6).map((entry) => (
                  <article key={entry.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>Plein carburant</strong>
                        <p>{entry.date} • {vehicles.find((vehicle) => vehicle.id === entry.vehicleProfileId)?.profileName}</p>
                      </div>
                      <span className="status-chip active">{formatCurrency(entry.amountPaid)}</span>
                    </div>
                    <div className="list-card__metrics">
                      <span>{formatNumber(entry.litersAdded, " L")}</span>
                      <span>{formatInteger(entry.odometerKm, " km")}</span>
                      <span>{entry.fullRefill ? "Plein complet" : "Partiel"}</span>
                    </div>
                    <div className="action-row">
                      <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteFuelEntry(entry.id)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
                {chargeEntries.slice(0, 6).map((entry) => (
                  <article key={entry.id} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>Recharge électrique</strong>
                        <p>{entry.date} • {vehicles.find((vehicle) => vehicle.id === entry.vehicleProfileId)?.profileName}</p>
                      </div>
                      <span className="status-chip active">{formatCurrency(entry.amountPaid)}</span>
                    </div>
                    <div className="list-card__metrics">
                      <span>{formatNumber(entry.kwhAdded, " kWh")}</span>
                      <span>{formatInteger(entry.odometerKm, " km")}</span>
                      <span>{entry.fullCharge ? "Complète" : "Partielle"}</span>
                    </div>
                    <div className="action-row">
                      <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteChargeEntry(entry.id)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "maintenance" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Entretien par véhicule</p>
                  <h2>{activeVehicle ? activeVehicle.profileName : "Sélectionnez un véhicule"}</h2>
                </div>
              </div>

              {activeVehicle ? (
                <>
                  <div className="metric-grid">
                    <MetricCard
                      label="Coût estimé configuré / km"
                      value={`${formatCurrency(activeVehicleConfiguredCost)}/km`}
                    />
                    <MetricCard
                      label="Assurance estimée / min"
                      value={`${formatCurrency(activeVehicleInsuranceMinute)}/min`}
                    />
                    <MetricCard
                      label="Frais fixes estimés / min"
                      value={`${formatCurrency(activeVehicleFixedMinute)}/min`}
                    />
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Dernière vidange km</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.maintenance.lastOilChangeKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("lastOilChangeKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Intervalle vidange</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.maintenance.oilChangeIntervalKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("oilChangeIntervalKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Coût vidange</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.maintenance.oilChangeCost}
                        onChange={(event) =>
                          setVehicleMaintenanceField("oilChangeCost", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Dernier changement pneus</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.maintenance.lastTiresChangeKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("lastTiresChangeKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Intervalle pneus</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.maintenance.tiresIntervalKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("tiresIntervalKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Coût pneus</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.maintenance.tiresCost}
                        onChange={(event) =>
                          setVehicleMaintenanceField("tiresCost", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Dernier changement freins</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.maintenance.lastBrakesChangeKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("lastBrakesChangeKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Intervalle freins</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.maintenance.brakesIntervalKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("brakesIntervalKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Coût freins</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.maintenance.brakesCost}
                        onChange={(event) =>
                          setVehicleMaintenanceField("brakesCost", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field field--full">
                      <span>Réparations récentes</span>
                      <textarea
                        rows={3}
                        value={vehicleDraft.maintenance.recentRepairs}
                        onChange={(event) => setVehicleMaintenanceField("recentRepairs", event.target.value)}
                      />
                    </label>
                    <label className="field field--full">
                      <span>Rappels entretien</span>
                      <textarea
                        rows={3}
                        value={vehicleDraft.maintenance.reminders}
                        onChange={(event) => setVehicleMaintenanceField("reminders", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Date changement moteur</span>
                      <input
                        type="date"
                        value={vehicleDraft.maintenance.engineChangedDate}
                        onChange={(event) =>
                          setVehicleMaintenanceField("engineChangedDate", event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Km changement moteur</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.maintenance.engineChangedMileage}
                        onChange={(event) =>
                          setVehicleMaintenanceField("engineChangedMileage", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Coût moteur TTC</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicleDraft.maintenance.engineChangeCostTtc}
                        onChange={(event) =>
                          setVehicleMaintenanceField("engineChangeCostTtc", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Amortissement moteur</span>
                      <select
                        value={vehicleDraft.maintenance.engineAmortizationMode}
                        onChange={(event) =>
                          setVehicleMaintenanceField(
                            "engineAmortizationMode",
                            event.target.value as VehicleProfile["maintenance"]["engineAmortizationMode"],
                          )
                        }
                      >
                        {DEPRECIATION_MODE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Durée moteur (mois)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleDraft.maintenance.engineAmortizationMonths}
                        onChange={(event) =>
                          setVehicleMaintenanceField("engineAmortizationMonths", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Durée moteur (km)</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={vehicleDraft.maintenance.engineAmortizationKm}
                        onChange={(event) =>
                          setVehicleMaintenanceField("engineAmortizationKm", Number(event.target.value) || 0)
                        }
                      />
                    </label>
                  </div>

                  <div className="alerts-grid">
                    {activeVehicleMaintenanceAlerts.map((alert) => (
                      <article key={alert.label} className={`alert-card ${alert.status}`}>
                        <div>
                          <strong>{alert.label}</strong>
                          <span>{formatInteger(alert.nextKm, " km")}</span>
                        </div>
                        <span className="alert-status">
                          {alert.status === "ok"
                            ? "OK"
                            : alert.status === "bientot"
                              ? "Bientôt"
                              : "À faire maintenant"}
                        </span>
                        <p>Reste {formatInteger(alert.remainingKm, " km")} avant le prochain seuil.</p>
                      </article>
                    ))}
                  </div>

                  <button className="primary-button neutral" type="button" onClick={handleSaveVehicle} disabled={saving}>
                    {saving ? "Sauvegarde..." : "Enregistrer l’entretien"}
                  </button>

                  <div className="group-card">
                    <div className="section-heading">
                      <div>
                        <h3>Réparation véhicule</h3>
                        <p className="section-copy">
                          Saisie TTC uniquement pour les pièces, la main-d’œuvre et les autres frais.
                        </p>
                      </div>
                      <button className="ghost-button" type="button" onClick={() => startNewRepair()}>
                        Nouvelle réparation
                      </button>
                    </div>

                    <div className="form-grid">
                      <label className="field">
                        <span>Véhicule concerné</span>
                        <select
                          value={repairDraft.vehicleId}
                          onChange={(event) => updateRepairDraft("vehicleId", event.target.value)}
                        >
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {getVehicleLabel(vehicle)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Nom de la réparation</span>
                        <input
                          type="text"
                          value={repairDraft.title}
                          onChange={(event) => updateRepairDraft("title", event.target.value)}
                          placeholder="Changement moteur"
                        />
                      </label>
                      <label className="field">
                        <span>Catégorie</span>
                        <select
                          value={repairDraft.category}
                          onChange={(event) =>
                            updateRepairDraft("category", event.target.value as RepairEntry["category"])
                          }
                        >
                          {REPAIR_CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Statut</span>
                        <select
                          value={repairDraft.status}
                          onChange={(event) =>
                            updateRepairDraft("status", event.target.value as RepairEntry["status"])
                          }
                        >
                          {REPAIR_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Priorité</span>
                        <select
                          value={repairDraft.priority}
                          onChange={(event) =>
                            updateRepairDraft("priority", event.target.value as RepairEntry["priority"])
                          }
                        >
                          {REPAIR_PRIORITY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Réparation bloquante</span>
                        <select
                          value={repairDraft.isBlocking ? "oui" : "non"}
                          onChange={(event) => updateRepairDraft("isBlocking", event.target.value === "oui")}
                        >
                          <option value="non">Non</option>
                          <option value="oui">Oui</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Kilométrage</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={repairDraft.odometer}
                          onChange={(event) =>
                            updateRepairDraft("odometer", Number(event.target.value) || 0)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Kilométrage approximatif</span>
                        <select
                          value={repairDraft.odometerIsApproximate ? "oui" : "non"}
                          onChange={(event) =>
                            updateRepairDraft("odometerIsApproximate", event.target.value === "oui")
                          }
                        >
                          <option value="non">Non</option>
                          <option value="oui">Oui</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Garage ou mécanicien</span>
                        <input
                          type="text"
                          value={repairDraft.mechanicName}
                          onChange={(event) => updateRepairDraft("mechanicName", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Date prévue</span>
                        <input
                          type="date"
                          value={repairDraft.plannedDate}
                          onChange={(event) => updateRepairDraft("plannedDate", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Date réalisée</span>
                        <input
                          type="date"
                          value={repairDraft.completedDate}
                          onChange={(event) => updateRepairDraft("completedDate", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Main-d’œuvre TTC</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={repairDraft.laborTotalTtc}
                          onChange={(event) =>
                            updateRepairDraft("laborTotalTtc", Number(event.target.value) || 0)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Autres frais TTC</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={repairDraft.otherFeesTtc}
                          onChange={(event) =>
                            updateRepairDraft("otherFeesTtc", Number(event.target.value) || 0)
                          }
                        />
                      </label>
                      <label className="field field--full">
                        <span>Description</span>
                        <textarea
                          rows={2}
                          value={repairDraft.description}
                          onChange={(event) => updateRepairDraft("description", event.target.value)}
                        />
                      </label>
                      <label className="field field--full">
                        <span>Commentaire</span>
                        <textarea
                          rows={2}
                          value={repairDraft.comment}
                          onChange={(event) => updateRepairDraft("comment", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="metric-grid">
                      <MetricCard label="Pièces TTC" value={formatCurrency(repairDraftPreview.partsTotalTtc)} />
                      <MetricCard label="Main-d’œuvre TTC" value={formatCurrency(repairDraftPreview.laborTotalTtc)} />
                      <MetricCard label="Autres frais TTC" value={formatCurrency(repairDraftPreview.otherFeesTtc)} />
                      <MetricCard label="Total réparation TTC" value={formatCurrency(repairDraftPreview.totalRepairTtc)} />
                    </div>

                    {repairDraft.isBlocking && !isRepairClosed(repairDraft.status) ? (
                      <p className="section-copy">Non disponible pour travailler tant que la réparation est ouverte.</p>
                    ) : null}

                    <div className="action-row">
                      <button className="primary-button neutral" type="button" onClick={handleSaveRepair} disabled={saving}>
                        {saving ? "Enregistrement..." : "Enregistrer la réparation"}
                      </button>
                      <button className="ghost-button" type="button" onClick={() => startNewRepair(repairDraft.vehicleId)}>
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  <div className="group-card">
                    <div className="section-heading">
                      <div>
                        <h3>Main-d’œuvre & pièces</h3>
                        <p className="section-copy">
                          {selectedRepair
                            ? `${selectedRepair.title} • ${selectedRepairVehicleLabel}`
                            : "Enregistrez ou sélectionnez une réparation pour ajouter des pièces."}
                        </p>
                      </div>
                      {selectedRepair ? (
                        <button className="ghost-button" type="button" onClick={() => startNewRepairPart(selectedRepair.id)}>
                          Nouvelle pièce
                        </button>
                      ) : null}
                    </div>

                    {selectedRepair ? (
                      <>
                        <div className="form-grid">
                          <label className="field">
                            <span>Nom de la pièce</span>
                            <input
                              type="text"
                              value={repairPartDraft.name}
                              onChange={(event) => updateRepairPartDraft("name", event.target.value)}
                              placeholder="moteur occasion"
                            />
                          </label>
                          <label className="field">
                            <span>Prix TTC</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={repairPartDraft.amountTtc}
                              onChange={(event) =>
                                updateRepairPartDraft("amountTtc", Number(event.target.value) || 0)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Fournisseur</span>
                            <input
                              type="text"
                              value={repairPartDraft.supplier}
                              onChange={(event) => updateRepairPartDraft("supplier", event.target.value)}
                              placeholder="garage, casse auto, Oscaro"
                            />
                          </label>
                          <label className="field">
                            <span>Statut pièce</span>
                            <select
                              value={repairPartDraft.status}
                              onChange={(event) =>
                                updateRepairPartDraft("status", event.target.value as RepairPartEntry["status"])
                              }
                            >
                              {REPAIR_PART_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field field--full">
                            <span>Commentaire</span>
                            <textarea
                              rows={2}
                              value={repairPartDraft.comment}
                              onChange={(event) => updateRepairPartDraft("comment", event.target.value)}
                            />
                          </label>
                        </div>

                        <div className="action-row">
                          <button className="primary-button neutral" type="button" onClick={handleSaveRepairPart} disabled={saving}>
                            {saving ? "Enregistrement..." : "Enregistrer la pièce"}
                          </button>
                          <button className="ghost-button" type="button" onClick={() => startNewRepairPart(selectedRepair.id)}>
                            Réinitialiser
                          </button>
                        </div>

                        <div className="stack-list">
                          {selectedRepairParts.length === 0 ? (
                            <p className="empty-copy">Aucune pièce enregistrée pour cette réparation.</p>
                          ) : (
                            selectedRepairParts.map((part) => (
                              <article key={part.id} className="list-card">
                                <div className="list-card__header">
                                  <div>
                                    <strong>{part.name}</strong>
                                    <p>{part.supplier || "Fournisseur non précisé"}</p>
                                  </div>
                                  <div className="chip-row">
                                    <span className={`status-chip ${getStatusClass(part.status)}`}>{part.status}</span>
                                    <span className="status-chip active">{formatCurrency(part.amountTtc)}</span>
                                  </div>
                                </div>
                                {part.comment ? <p className="section-copy">{part.comment}</p> : null}
                                <div className="action-row">
                                  <button className="ghost-button" type="button" onClick={() => editRepairPart(part)}>
                                    Modifier
                                  </button>
                                  <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteRepairPart(part.id)}>
                                    Supprimer
                                  </button>
                                </div>
                              </article>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="empty-copy">Enregistrez d’abord la réparation pour ajouter les pièces TTC exactes.</p>
                    )}
                  </div>

                  <div className="group-card">
                    <div className="section-heading">
                      <div>
                        <h3>Réparations du véhicule</h3>
                        <p className="section-copy">
                          Suivi des statuts, des montants TTC et de la disponibilité du véhicule.
                        </p>
                      </div>
                    </div>

                    <div className="stack-list">
                      {activeVehicleRepairs.length === 0 ? (
                        <p className="empty-copy">Aucune réparation enregistrée pour ce véhicule.</p>
                      ) : (
                        activeVehicleRepairs.map((repair) => {
                          const repairVehicle =
                            vehicles.find((vehicle) => vehicle.id === repair.vehicleId) ?? activeVehicle;
                          const linkedParts = repairPartEntries.filter((part) => part.repairId === repair.id);
                          const isUnavailable = repair.isBlocking && !isRepairClosed(repair.status);
                          const canRestoreVehicle =
                            repair.status === "Terminé" &&
                            (repairVehicle?.status === "En réparation" || repairVehicle?.status === "En panne");
                          const priorityClass =
                            repair.priority === "Urgent"
                              ? "a-faire-maintenant"
                              : repair.priority === "Important"
                                ? "warning"
                                : "active";

                          return (
                            <article key={repair.id} className="list-card">
                              <div className="list-card__header">
                                <div>
                                  <strong>{repair.title}</strong>
                                  <p>
                                    {repairVehicle ? getVehicleLabel(repairVehicle) : "Véhicule"}
                                    {repair.mechanicName ? ` • ${repair.mechanicName}` : ""}
                                    {repair.plannedDate ? ` • ${repair.plannedDate}` : ""}
                                  </p>
                                </div>
                                <div className="chip-row">
                                  <span className={`status-chip ${getStatusClass(repair.status)}`}>{repair.status}</span>
                                  <span className={`status-chip ${priorityClass}`}>{repair.priority}</span>
                                  {repair.isBlocking ? <span className="status-chip en-panne">Bloquante</span> : null}
                                </div>
                              </div>

                              {isUnavailable ? (
                                <p className="section-copy">Non disponible pour travailler.</p>
                              ) : null}

                              <div className="list-card__metrics">
                                <span>Pièces : {formatCurrency(repair.partsTotalTtc)} TTC</span>
                                <span>Main-d’œuvre : {formatCurrency(repair.laborTotalTtc)} TTC</span>
                                <span>Autres frais : {formatCurrency(repair.otherFeesTtc)} TTC</span>
                                <span>Total : {formatCurrency(repair.totalRepairTtc)} TTC</span>
                                <span>{linkedParts.length} pièce(s)</span>
                                {repair.odometer > 0 ? (
                                  <span>
                                    {formatInteger(repair.odometer, " km")}
                                    {repair.odometerIsApproximate ? " env." : ""}
                                  </span>
                                ) : null}
                              </div>

                              {repair.description ? <p className="section-copy">{repair.description}</p> : null}
                              {repair.comment ? <p className="section-copy">{repair.comment}</p> : null}

                              <div className="action-row">
                                <button className="ghost-button" type="button" onClick={() => editRepair(repair)}>
                                  Modifier
                                </button>
                                <button className="ghost-button" type="button" onClick={() => {
                                  setSelectedRepairId(repair.id);
                                  startNewRepairPart(repair.id);
                                }}>
                                  Ajouter une pièce
                                </button>
                                {repair.status === "Terminé" ? (
                                  <button className="ghost-button" type="button" onClick={() => handleCreateExpenseFromRepair(repair)}>
                                    Créer une dépense
                                  </button>
                                ) : null}
                                {canRestoreVehicle ? (
                                  <button className="ghost-button" type="button" onClick={() => handleSetVehicleAvailableAfterRepair(repair)}>
                                    Remettre disponible
                                  </button>
                                ) : null}
                                <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteRepair(repair.id)}>
                                  Supprimer
                                </button>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="group-card">
                    <h3>Créer un rappel</h3>
                    <div className="form-grid">
                      <label className="field">
                        <span>Type</span>
                        <select
                          value={reminderDraft.type}
                          onChange={(event) =>
                            updateReminderDraft("type", event.target.value as ReminderEntry["type"])
                          }
                        >
                          {REMINDER_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Titre</span>
                        <input
                          type="text"
                          value={reminderDraft.title}
                          onChange={(event) => updateReminderDraft("title", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Déclenchement</span>
                        <select
                          value={reminderDraft.triggerType}
                          onChange={(event) =>
                            updateReminderDraft(
                              "triggerType",
                              event.target.value as ReminderEntry["triggerType"],
                            )
                          }
                        >
                          {REMINDER_TRIGGER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Date prévue</span>
                        <input
                          type="date"
                          value={reminderDraft.dueDate}
                          onChange={(event) => updateReminderDraft("dueDate", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Kilométrage prévu</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={reminderDraft.dueMileage}
                          onChange={(event) =>
                            updateReminderDraft("dueMileage", Number(event.target.value) || 0)
                          }
                        />
                      </label>
                      <label className="field field--full">
                        <span>Commentaire</span>
                        <textarea
                          rows={2}
                          value={reminderDraft.comment}
                          onChange={(event) => updateReminderDraft("comment", event.target.value)}
                        />
                      </label>
                    </div>
                    <button className="primary-button neutral" type="button" onClick={handleSaveReminder} disabled={saving}>
                      {saving ? "Enregistrement..." : "Ajouter le rappel"}
                    </button>
                  </div>

                  <div className="stack-list">
                    {activeVehicleReminders.map((reminder) => (
                      <article key={reminder.id} className="list-card">
                        <div className="list-card__header">
                          <div>
                            <strong>{reminder.title}</strong>
                            <p>
                              {reminder.type}
                              {reminder.dueMileage > 0 ? ` • ${formatInteger(reminder.dueMileage, " km")}` : ""}
                              {reminder.dueDate ? ` • ${reminder.dueDate}` : ""}
                            </p>
                          </div>
                          <span className={`status-chip ${getStatusClass(reminder.status)}`}>
                            {reminder.status}
                          </span>
                        </div>
                        <div className="action-row">
                          <button className="ghost-button" type="button" onClick={() => handleCompleteReminder(reminder)}>
                            Fait
                          </button>
                          <button className="ghost-button" type="button" onClick={() => setReminderDraft(reminder)}>
                            Modifier
                          </button>
                          <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteReminder(reminder.id)}>
                            Supprimer
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <p className="empty-copy">Créez d’abord un véhicule pour gérer son entretien.</p>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "comparison" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Comparaison</p>
                  <h2>{formatMonthLabel(selectedMonth)}</h2>
                </div>
              </div>

              <div className="metric-grid">
                <MetricCard
                  label="Véhicule le plus rentable"
                  value={comparisonBestVehicle ? comparisonBestVehicle.vehicleName : "N/A"}
                />
                <MetricCard
                  label="Véhicule le plus coûteux"
                  value={comparisonWorstVehicle ? comparisonWorstVehicle.vehicleName : "N/A"}
                />
              </div>

              <div className="stack-list">
                {vehiclePerformances.map((item) => (
                  <article key={item.vehicleProfileId} className="list-card">
                    <div className="list-card__header">
                      <div>
                        <strong>{item.vehicleName}</strong>
                        <p>{formatInteger(item.tripCount)} course(s)</p>
                      </div>
                      <div className="chip-row">
                        {comparisonBestVehicle?.vehicleProfileId === item.vehicleProfileId ? (
                          <span className="status-chip active">Plus rentable</span>
                        ) : null}
                        {comparisonWorstVehicle?.vehicleProfileId === item.vehicleProfileId ? (
                          <span className="status-chip warning">À surveiller</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="list-card__metrics">
                      <span>CA: {formatCurrency(item.grossRevenue)}</span>
                      <span>Net: {formatCurrency(item.netIncome)}</span>
                      <span>Frais: {formatCurrency(item.totalCosts)}</span>
                      <span>Dépenses réelles: {formatCurrency(item.totalExpensesMonth)}</span>
                      <span>Amortissement: {formatCurrency(item.totalDepreciation)}</span>
                      <span>Km: {formatNumber(item.drivenKm, " km")}</span>
                      <span>Coût/km: {formatCurrency(item.averageCostPerKm)}</span>
                      <span>Conso réelle: {formatNumber(item.averageConsumptionReal)}</span>
                      <span>€/h net: {formatCurrency(item.averageNetHourly)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "quotes" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Devis</p>
                  <h2>Prix client privé TTC</h2>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    setQuoteDraft(
                      createQuoteEntry({
                        plannedDate: getLocalIsoDate(),
                        vehicleProfileId: activeVehicle?.id ?? LEGACY_DEFAULT_VEHICLE_ID,
                        costMode: activeVehicle?.costMode ?? "estimé",
                      }),
                    )
                  }
                >
                  + Nouveau devis
                </button>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Date prévue</span>
                  <input
                    type="date"
                    value={quoteDraft.plannedDate}
                    onChange={(event) => updateQuoteDraft("plannedDate", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Heure prévue</span>
                  <input
                    type="time"
                    value={quoteDraft.plannedTime}
                    onChange={(event) => updateQuoteDraft("plannedTime", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Véhicule</span>
                  <select
                    value={quoteDraft.vehicleProfileId}
                    onChange={(event) => {
                      const vehicle = vehicles.find((item) => item.id === event.target.value);
                      setQuoteDraft((current) => ({
                        ...current,
                        vehicleProfileId: event.target.value,
                        costMode: vehicle?.costMode ?? current.costMode,
                      }));
                    }}
                  >
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.profileName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Type de course</span>
                  <select
                    value={quoteDraft.tripType}
                    onChange={(event) =>
                      updateQuoteDraft("tripType", event.target.value as QuoteEntry["tripType"])
                    }
                  >
                    {QUOTE_TRIP_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Zone de départ</span>
                  <input
                    type="text"
                    list="zone-suggestions"
                    value={quoteDraft.pickupZone}
                    onChange={(event) => updateQuoteDraft("pickupZone", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Zone d’arrivée</span>
                  <input
                    type="text"
                    list="zone-suggestions"
                    value={quoteDraft.dropoffZone}
                    onChange={(event) => updateQuoteDraft("dropoffZone", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Km approche</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quoteDraft.approachKm}
                    onChange={(event) => updateQuoteDraft("approachKm", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Km course</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quoteDraft.tripKm}
                    onChange={(event) => updateQuoteDraft("tripKm", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Temps approche</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteDraft.approachMinutes}
                    onChange={(event) => updateQuoteDraft("approachMinutes", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Temps attente prévu</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteDraft.waitMinutes}
                    onChange={(event) => updateQuoteDraft("waitMinutes", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Temps course</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteDraft.tripMinutes}
                    onChange={(event) => updateQuoteDraft("tripMinutes", Number(event.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span>Prix proposé TTC</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quoteDraft.proposedPriceTtc}
                    onChange={(event) =>
                      updateQuoteDraft("proposedPriceTtc", Number(event.target.value) || 0)
                    }
                  />
                </label>
              </div>

              <div className="estimate-strip">
                <div>
                  <strong>{formatNumber(quoteTravelEstimate.tripMinutes, " min proposées")}</strong>
                  <p>
                    {quoteTravelEstimate.message} Confiance {quoteTravelEstimate.confidenceLevel}.
                  </p>
                </div>
                <button className="ghost-button" type="button" onClick={applyQuoteEstimate}>
                  Appliquer
                </button>
              </div>

              <details className="details-panel">
                <summary>Client et adresses</summary>
                <div className="form-grid">
                  <label className="field">
                    <span>Nom client</span>
                    <input
                      type="text"
                      value={quoteDraft.clientName}
                      onChange={(event) => updateQuoteDraft("clientName", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Téléphone</span>
                    <input
                      type="tel"
                      value={quoteDraft.clientPhone}
                      onChange={(event) => updateQuoteDraft("clientPhone", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Adresse départ</span>
                    <input
                      type="text"
                      value={quoteDraft.pickupAddress}
                      onChange={(event) => updateQuoteDraft("pickupAddress", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Adresse arrivée</span>
                    <input
                      type="text"
                      value={quoteDraft.dropoffAddress}
                      onChange={(event) => updateQuoteDraft("dropoffAddress", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Ville départ</span>
                    <input
                      type="text"
                      value={quoteDraft.pickupCity}
                      onChange={(event) => updateQuoteDraft("pickupCity", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Ville arrivée</span>
                    <input
                      type="text"
                      value={quoteDraft.dropoffCity}
                      onChange={(event) => updateQuoteDraft("dropoffCity", event.target.value)}
                    />
                  </label>
                </div>
              </details>

              <details className="details-panel">
                <summary>Plus d’options</summary>
                <div className="form-grid">
                  <label className="field">
                    <span>Type de zone</span>
                    <select
                      value={quoteDraft.zoneType}
                      onChange={(event) =>
                        updateQuoteDraft("zoneType", event.target.value as QuoteEntry["zoneType"])
                      }
                    >
                      {ZONE_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Péage estimé TTC</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteDraft.tollTtc}
                      onChange={(event) => updateQuoteDraft("tollTtc", Number(event.target.value) || 0)}
                    />
                  </label>
                  <label className="field">
                    <span>Parking estimé TTC</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteDraft.parkingTtc}
                      onChange={(event) => updateQuoteDraft("parkingTtc", Number(event.target.value) || 0)}
                    />
                  </label>
                  <label className="field">
                    <span>Frais divers TTC</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteDraft.extraFeesTtc}
                      onChange={(event) => updateQuoteDraft("extraFeesTtc", Number(event.target.value) || 0)}
                    />
                  </label>
                  <label className="field">
                    <span>Marge sécurité</span>
                    <select
                      value={quoteDraft.safetyMarginMode}
                      onChange={(event) =>
                        updateQuoteDraft(
                          "safetyMarginMode",
                          event.target.value as QuoteEntry["safetyMarginMode"],
                        )
                      }
                    >
                      {QUOTE_MARGIN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Marge manuelle TTC</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteDraft.manualMarginTtc}
                      onChange={(event) =>
                        updateQuoteDraft("manualMarginTtc", Number(event.target.value) || 0)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Arrondi</span>
                    <select
                      value={quoteDraft.roundingMode}
                      onChange={(event) =>
                        updateQuoteDraft(
                          "roundingMode",
                          event.target.value as QuoteEntry["roundingMode"],
                        )
                      }
                    >
                      {QUOTE_ROUNDING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Statut</span>
                    <select
                      value={quoteDraft.status}
                      onChange={(event) =>
                        updateQuoteDraft("status", event.target.value as QuoteEntry["status"])
                      }
                    >
                      {QUOTE_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </details>

              {quotePreview ? (
                <div className={`quote-result ${quotePreview.decision === "rentable" ? "accepter" : quotePreview.decision === "limite" ? "limite" : "refuser"}`}>
                  <div className="metric-grid">
                    <MetricCard label="Prix minimum TTC" value={formatCurrency(quotePreview.minimumPriceTtc)} />
                    <MetricCard label="Prix conseillé TTC" value={formatCurrency(quotePreview.suggestedPriceTtc)} />
                    <MetricCard label="Prix arrondi TTC" value={formatCurrency(quotePreview.roundedPriceTtc)} />
                    <MetricCard label="Frais estimés TTC" value={formatCurrency(quotePreview.estimatedCostsTtc)} />
                    <MetricCard label="Net estimé TTC" value={formatCurrency(quotePreview.estimatedNetTtc)} />
                    <MetricCard label="€/h net estimé" value={`${formatCurrency(quotePreview.estimatedNetHourly)}/h`} />
                  </div>
                  <p className="section-copy">{quotePreview.warning}</p>
                </div>
              ) : null}

              <button className="primary-button neutral" type="button" onClick={handleSaveQuote} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer le devis"}
              </button>
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Historique devis</p>
                  <h2>{formatInteger(quoteEntries.length)} devis</h2>
                </div>
              </div>
              <div className="stack-list">
                {quoteEntries.map((quote) => {
                  const vehicle = vehicles.find((item) => item.id === quote.vehicleProfileId) ?? null;
                  const metrics = vehicle
                    ? calculateQuoteMetrics(quote, vehicle, { expenses, fuelEntries, chargeEntries, trips })
                    : null;

                  return (
                    <article key={quote.id} className="list-card">
                      <div className="list-card__header">
                        <div>
                          <strong>{quote.pickupZone || "Départ"} → {quote.dropoffZone || "Arrivée"}</strong>
                          <p>{quote.plannedDate} • {vehicle?.profileName ?? "Véhicule"}</p>
                        </div>
                        <span className={`status-chip ${getStatusClass(quote.status)}`}>{quote.status}</span>
                      </div>
                      <div className="list-card__metrics">
                        <span>Prix: {formatCurrency(metrics?.proposedPriceTtc ?? quote.proposedPriceTtc)}</span>
                        <span>Minimum: {formatCurrency(metrics?.minimumPriceTtc ?? 0)}</span>
                        <span>{formatNumber(quote.tripMinutes, " min")}</span>
                      </div>
                      <div className="action-row">
                        <button className="ghost-button" type="button" onClick={() => setQuoteDraft(quote)}>
                          Modifier
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => handleTransformQuoteToTrip(quote)}
                          disabled={quote.status === "Transformé en course"}
                        >
                          Transformer en course
                        </button>
                        <button className="ghost-button danger-text" type="button" onClick={() => handleDeleteQuote(quote.id)}>
                          Supprimer
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "data" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Sauvegarde & ménage</p>
                  <h2>Données locales</h2>
                </div>
              </div>

              <div className="metric-grid">
                <MetricCard label="Courses stockées" value={formatInteger(trips.length)} />
                <MetricCard label="Véhicules" value={formatInteger(vehicles.length)} />
                <MetricCard label="Plateformes" value={formatInteger(platforms.length)} />
                <MetricCard label="Dépenses" value={formatInteger(expenses.length)} />
                <MetricCard label="Pleins" value={formatInteger(fuelEntries.length)} />
                <MetricCard label="Recharges" value={formatInteger(chargeEntries.length)} />
                <MetricCard label="Devis" value={formatInteger(quoteEntries.length)} />
                <MetricCard label="Rappels" value={formatInteger(reminderEntries.length)} />
              </div>

              <div className="action-stack">
                <button className="primary-button neutral" type="button" onClick={handleExportJson}>
                  Export JSON complet
                </button>
                <button className="primary-button neutral" type="button" onClick={handleExportCsv}>
                  Export CSV du mois
                </button>
                <button
                  className="primary-button neutral"
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                >
                  Import JSON
                </button>
                <button
                  className="primary-button warning"
                  type="button"
                  onClick={handleDeleteMonthTrips}
                  disabled={saving}
                >
                  Supprimer les courses du mois
                </button>
                <button
                  className="primary-button danger"
                  type="button"
                  onClick={handleClearAllData}
                  disabled={saving}
                >
                  Suppression complète
                </button>
              </div>

              <input
                ref={importInputRef}
                className="hidden-input"
                type="file"
                accept="application/json"
                onChange={handleImportFile}
              />
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
