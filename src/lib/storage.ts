import {
  calculateMaintenanceCostPerKm,
  getDefaultEnergyTypeForVehicleType,
  normalizeTripRecord,
} from "./calculations";
import {
  AppSettings,
  AppSnapshot,
  DEFAULT_APP_SETTINGS,
  ENERGY_TYPE_OPTIONS,
  MaintenanceSettings,
  TripRecord,
  VehicleSettings,
  VEHICLE_TYPE_OPTIONS,
} from "../types";

const DB_NAME = "cap-4000-vtc";
const DB_VERSION = 1;
const SETTINGS_STORE = "settings";
const TRIPS_STORE = "trips";
const VEHICLE_SETTINGS_KEY = "vehicle-settings";
const MAINTENANCE_SETTINGS_KEY = "maintenance-settings";

let databasePromise: Promise<IDBDatabase> | null = null;

interface SettingsEntry<T> {
  key: string;
  value: T;
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }

      if (!database.objectStoreNames.contains(TRIPS_STORE)) {
        database.createObjectStore(TRIPS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeMaintenanceSettings(rawValue: unknown): MaintenanceSettings {
  const source = isRecord(rawValue) ? rawValue : {};

  return {
    lastOilChangeKm: getNumber(
      source.lastOilChangeKm,
      DEFAULT_APP_SETTINGS.maintenance.lastOilChangeKm,
    ),
    oilChangeIntervalKm: getNumber(
      source.oilChangeIntervalKm,
      DEFAULT_APP_SETTINGS.maintenance.oilChangeIntervalKm,
    ),
    oilChangeCost: getNumber(
      source.oilChangeCost,
      DEFAULT_APP_SETTINGS.maintenance.oilChangeCost,
    ),
    lastBrakesChangeKm: getNumber(
      source.lastBrakesChangeKm,
      DEFAULT_APP_SETTINGS.maintenance.lastBrakesChangeKm,
    ),
    brakesIntervalKm: getNumber(
      source.brakesIntervalKm,
      DEFAULT_APP_SETTINGS.maintenance.brakesIntervalKm,
    ),
    brakesCost: getNumber(source.brakesCost, DEFAULT_APP_SETTINGS.maintenance.brakesCost),
    lastTiresChangeKm: getNumber(
      source.lastTiresChangeKm,
      DEFAULT_APP_SETTINGS.maintenance.lastTiresChangeKm,
    ),
    tiresIntervalKm: getNumber(
      source.tiresIntervalKm,
      DEFAULT_APP_SETTINGS.maintenance.tiresIntervalKm,
    ),
    tiresCost: getNumber(source.tiresCost, DEFAULT_APP_SETTINGS.maintenance.tiresCost),
    otherMonthlyMaintenance: getNumber(
      source.otherMonthlyMaintenance,
      DEFAULT_APP_SETTINGS.maintenance.otherMonthlyMaintenance,
    ),
    estimatedKmPerMonth: getNumber(
      source.estimatedKmPerMonth,
      DEFAULT_APP_SETTINGS.maintenance.estimatedKmPerMonth,
    ),
    extraManualReservePerKm: getNumber(
      source.extraManualReservePerKm,
      DEFAULT_APP_SETTINGS.maintenance.extraManualReservePerKm,
    ),
  };
}

function normalizeVehicleSettings(
  rawValue: unknown,
  maintenanceSettings: MaintenanceSettings,
): VehicleSettings {
  const source = isRecord(rawValue) ? rawValue : {};
  const fallbackVehicle = DEFAULT_APP_SETTINGS.vehicle;
  const legacyDerivedMaintenanceCost = calculateMaintenanceCostPerKm(maintenanceSettings);
  const initialVehicleType = getString(source.vehicleType, fallbackVehicle.vehicleType);
  const vehicleType = VEHICLE_TYPE_OPTIONS.includes(initialVehicleType as VehicleSettings["vehicleType"])
    ? (initialVehicleType as VehicleSettings["vehicleType"])
    : fallbackVehicle.vehicleType;
  const initialEnergyType = getString(
    source.energyType,
    getDefaultEnergyTypeForVehicleType(vehicleType),
  );
  const energyType = ENERGY_TYPE_OPTIONS.includes(initialEnergyType as VehicleSettings["energyType"])
    ? (initialEnergyType as VehicleSettings["energyType"])
    : getDefaultEnergyTypeForVehicleType(vehicleType);

  const rawVehicleName = getString(source.vehicleName, "");
  const brand = getString(
    source.brand,
    rawVehicleName ? rawVehicleName.split(" ")[0] || fallbackVehicle.brand : fallbackVehicle.brand,
  );
  const model = getString(
    source.model,
    rawVehicleName ? rawVehicleName.replace(brand, "").trim() || fallbackVehicle.model : fallbackVehicle.model,
  );
  const vehicleName = rawVehicleName || [brand, model].filter(Boolean).join(" ").trim() || fallbackVehicle.vehicleName;
  const averageConsumptionPer100Km = getNumber(
    source.averageConsumptionPer100Km ?? source.fuelConsumptionPer100Km,
    fallbackVehicle.averageConsumptionPer100Km,
  );
  const energyPricePerUnit = getNumber(
    source.energyPricePerUnit ?? source.fuelPricePerLiter,
    fallbackVehicle.energyPricePerUnit,
  );

  return {
    vehicleName,
    brand,
    model,
    year: getNumber(source.year, fallbackVehicle.year),
    vehicleType,
    energyType,
    averageConsumptionPer100Km,
    energyPricePerUnit,
    currentMileage: getNumber(source.currentMileage, fallbackVehicle.currentMileage),
    monthlyInsurance: getNumber(source.monthlyInsurance, fallbackVehicle.monthlyInsurance),
    workingDaysPerMonth: getNumber(
      source.workingDaysPerMonth,
      fallbackVehicle.workingDaysPerMonth,
    ),
    workingHoursPerDay: getNumber(
      source.workingHoursPerDay,
      fallbackVehicle.workingHoursPerDay,
    ),
    monthlyFixedCosts: getNumber(source.monthlyFixedCosts, fallbackVehicle.monthlyFixedCosts),
    estimatedMaintenanceCostPerKm: getNumber(
      source.estimatedMaintenanceCostPerKm,
      legacyDerivedMaintenanceCost > 0
        ? legacyDerivedMaintenanceCost
        : fallbackVehicle.estimatedMaintenanceCostPerKm,
    ),
    estimatedTiresCostPerKm: getNumber(
      source.estimatedTiresCostPerKm,
      fallbackVehicle.estimatedTiresCostPerKm,
    ),
    estimatedBrakesCostPerKm: getNumber(
      source.estimatedBrakesCostPerKm,
      fallbackVehicle.estimatedBrakesCostPerKm,
    ),
    estimatedOilChangeCostPerKm: getNumber(
      source.estimatedOilChangeCostPerKm,
      fallbackVehicle.estimatedOilChangeCostPerKm,
    ),
  };
}

function normalizeAppSettings(rawVehicle: unknown, rawMaintenance: unknown): AppSettings {
  const maintenance = normalizeMaintenanceSettings(rawMaintenance);
  const vehicle = normalizeVehicleSettings(rawVehicle, maintenance);

  return {
    vehicle,
    maintenance,
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  const database = await openDatabase();
  const transaction = database.transaction(SETTINGS_STORE, "readonly");
  const store = transaction.objectStore(SETTINGS_STORE);

  const vehicleRecord = (await requestToPromise(
    store.get(VEHICLE_SETTINGS_KEY),
  )) as SettingsEntry<unknown> | undefined;
  const maintenanceRecord = (await requestToPromise(
    store.get(MAINTENANCE_SETTINGS_KEY),
  )) as SettingsEntry<unknown> | undefined;

  await transactionToPromise(transaction);

  return normalizeAppSettings(vehicleRecord?.value, maintenanceRecord?.value);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const normalizedSettings = normalizeAppSettings(settings.vehicle, settings.maintenance);
  const database = await openDatabase();
  const transaction = database.transaction(SETTINGS_STORE, "readwrite");
  const store = transaction.objectStore(SETTINGS_STORE);

  await requestToPromise(
    store.put({
      key: VEHICLE_SETTINGS_KEY,
      value: normalizedSettings.vehicle,
    }),
  );
  await requestToPromise(
    store.put({
      key: MAINTENANCE_SETTINGS_KEY,
      value: normalizedSettings.maintenance,
    }),
  );

  await transactionToPromise(transaction);
}

export async function getTrips(): Promise<TripRecord[]> {
  const database = await openDatabase();
  const transaction = database.transaction(TRIPS_STORE, "readonly");
  const store = transaction.objectStore(TRIPS_STORE);
  const trips = (await requestToPromise(store.getAll())) as Partial<TripRecord>[];

  await transactionToPromise(transaction);

  return trips.map((trip) => normalizeTripRecord(trip));
}

export async function saveTrip(trip: TripRecord): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(TRIPS_STORE, "readwrite");
  const store = transaction.objectStore(TRIPS_STORE);

  await requestToPromise(store.put(normalizeTripRecord(trip)));
  await transactionToPromise(transaction);
}

export async function deleteTripsForMonth(month: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(TRIPS_STORE, "readwrite");
  const store = transaction.objectStore(TRIPS_STORE);

  await new Promise<void>((resolve, reject) => {
    const cursorRequest = store.openCursor();

    cursorRequest.onerror = () => reject(cursorRequest.error);

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;

      if (!cursor) {
        resolve();
        return;
      }

      const trip = normalizeTripRecord(cursor.value as Partial<TripRecord>);
      if (trip.month === month) {
        cursor.delete();
      }

      cursor.continue();
    };
  });

  await transactionToPromise(transaction);
}

export async function clearAllTripsAndSettings(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([SETTINGS_STORE, TRIPS_STORE], "readwrite");

  await requestToPromise(transaction.objectStore(SETTINGS_STORE).clear());
  await requestToPromise(transaction.objectStore(TRIPS_STORE).clear());

  await transactionToPromise(transaction);
}

export async function importSnapshot(snapshot: AppSnapshot): Promise<void> {
  const normalizedSettings = normalizeAppSettings(snapshot.settings?.vehicle, snapshot.settings?.maintenance);
  const normalizedTrips = Array.isArray(snapshot.trips)
    ? snapshot.trips.map((trip) => normalizeTripRecord(trip))
    : [];
  const database = await openDatabase();
  const transaction = database.transaction([SETTINGS_STORE, TRIPS_STORE], "readwrite");
  const settingsStore = transaction.objectStore(SETTINGS_STORE);
  const tripsStore = transaction.objectStore(TRIPS_STORE);

  await requestToPromise(settingsStore.clear());
  await requestToPromise(tripsStore.clear());

  await requestToPromise(
    settingsStore.put({
      key: VEHICLE_SETTINGS_KEY,
      value: normalizedSettings.vehicle,
    }),
  );
  await requestToPromise(
    settingsStore.put({
      key: MAINTENANCE_SETTINGS_KEY,
      value: normalizedSettings.maintenance,
    }),
  );

  for (const trip of normalizedTrips) {
    await requestToPromise(tripsStore.put(trip));
  }

  await transactionToPromise(transaction);
}
