import {
  buildExportSnapshot,
  createLegacyVehicleProfile,
  getDefaultPlatformProfiles,
  normalizeChargeEntry,
  normalizeExpenseEntry,
  normalizeFuelEntry,
  normalizeGlobalSettings,
  normalizeLegacyOrCurrentSnapshot,
  normalizePlatformProfile,
  normalizeQuoteEntry,
  normalizeReminderEntry,
  normalizeTripRecord,
  normalizeVehicleProfile,
} from "./calculations";
import {
  AppSnapshot,
  ChargeEntry,
  ExpenseEntry,
  FuelEntry,
  GlobalSettings,
  LEGACY_DEFAULT_PLATFORM_ID,
  PlatformProfile,
  QuoteEntry,
  ReminderEntry,
  TripRecord,
  VehicleProfile,
} from "../types";

const DB_NAME = "cap-4000-vtc";
const DB_VERSION = 4;
const LEGACY_SETTINGS_STORE = "settings";
const TRIPS_STORE = "trips";
const META_STORE = "meta";
const VEHICLES_STORE = "vehicles";
const PLATFORMS_STORE = "platforms";
const EXPENSES_STORE = "expenses";
const FUEL_STORE = "fuelEntries";
const CHARGE_STORE = "chargeEntries";
const QUOTES_STORE = "quoteEntries";
const REMINDERS_STORE = "reminderEntries";
const APP_SETTINGS_KEY = "app-settings";
const LEGACY_VEHICLE_SETTINGS_KEY = "vehicle-settings";
const LEGACY_MAINTENANCE_SETTINGS_KEY = "maintenance-settings";

let databasePromise: Promise<IDBDatabase> | null = null;

interface SettingsEntry<T> {
  key: string;
  value: T;
}

export interface AppData {
  globalSettings: GlobalSettings;
  vehicles: VehicleProfile[];
  platforms: PlatformProfile[];
  expenses: ExpenseEntry[];
  fuelEntries: FuelEntry[];
  chargeEntries: ChargeEntry[];
  quoteEntries: QuoteEntry[];
  reminderEntries: ReminderEntry[];
  trips: TripRecord[];
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

      if (!database.objectStoreNames.contains(LEGACY_SETTINGS_STORE)) {
        database.createObjectStore(LEGACY_SETTINGS_STORE, { keyPath: "key" });
      }

      if (!database.objectStoreNames.contains(TRIPS_STORE)) {
        database.createObjectStore(TRIPS_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: "key" });
      }

      if (!database.objectStoreNames.contains(VEHICLES_STORE)) {
        database.createObjectStore(VEHICLES_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(PLATFORMS_STORE)) {
        database.createObjectStore(PLATFORMS_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(EXPENSES_STORE)) {
        database.createObjectStore(EXPENSES_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(FUEL_STORE)) {
        database.createObjectStore(FUEL_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(CHARGE_STORE)) {
        database.createObjectStore(CHARGE_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(QUOTES_STORE)) {
        database.createObjectStore(QUOTES_STORE, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(REMINDERS_STORE)) {
        database.createObjectStore(REMINDERS_STORE, { keyPath: "id" });
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

async function getAllFromStore<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
  const transaction = database.transaction(storeName, "readonly");
  const store = transaction.objectStore(storeName);
  const result = (await requestToPromise(store.getAll())) as T[];
  await transactionToPromise(transaction);
  return result;
}

async function putInStore<T>(database: IDBDatabase, storeName: string, value: T): Promise<void> {
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  await requestToPromise(store.put(value));
  await transactionToPromise(transaction);
}

async function deleteFromStore(database: IDBDatabase, storeName: string, id: string): Promise<void> {
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  await requestToPromise(store.delete(id));
  await transactionToPromise(transaction);
}

async function getLegacySettings(database: IDBDatabase): Promise<{
  vehicle: unknown;
  maintenance: unknown;
}> {
  if (!database.objectStoreNames.contains(LEGACY_SETTINGS_STORE)) {
    return { vehicle: null, maintenance: null };
  }

  const transaction = database.transaction(LEGACY_SETTINGS_STORE, "readonly");
  const store = transaction.objectStore(LEGACY_SETTINGS_STORE);
  const legacyVehicle = (await requestToPromise(
    store.get(LEGACY_VEHICLE_SETTINGS_KEY),
  )) as SettingsEntry<unknown> | undefined;
  const legacyMaintenance = (await requestToPromise(
    store.get(LEGACY_MAINTENANCE_SETTINGS_KEY),
  )) as SettingsEntry<unknown> | undefined;

  await transactionToPromise(transaction);

  return {
    vehicle: legacyVehicle?.value,
    maintenance: legacyMaintenance?.value,
  };
}

export async function getAppData(): Promise<AppData> {
  const database = await openDatabase();
  const [vehiclesRaw, platformsRaw, expensesRaw, fuelRaw, chargeRaw, quotesRaw, remindersRaw, tripsRaw] = await Promise.all([
    getAllFromStore<unknown>(database, VEHICLES_STORE),
    getAllFromStore<unknown>(database, PLATFORMS_STORE),
    getAllFromStore<unknown>(database, EXPENSES_STORE),
    getAllFromStore<unknown>(database, FUEL_STORE),
    getAllFromStore<unknown>(database, CHARGE_STORE),
    getAllFromStore<unknown>(database, QUOTES_STORE),
    getAllFromStore<unknown>(database, REMINDERS_STORE),
    getAllFromStore<unknown>(database, TRIPS_STORE),
  ]);

  const metaTransaction = database.transaction(META_STORE, "readonly");
  const metaStore = metaTransaction.objectStore(META_STORE);
  const appSettingsRecord = (await requestToPromise(
    metaStore.get(APP_SETTINGS_KEY),
  )) as SettingsEntry<unknown> | undefined;
  await transactionToPromise(metaTransaction);

  const legacySettings = await getLegacySettings(database);
  const vehicles =
    vehiclesRaw.length > 0
      ? vehiclesRaw.map(normalizeVehicleProfile)
      : [createLegacyVehicleProfile(legacySettings.vehicle, legacySettings.maintenance)];
  const platforms =
    platformsRaw.length > 0
      ? platformsRaw.map(normalizePlatformProfile)
      : getDefaultPlatformProfiles();
  const fallbackVehicle = vehicles[0];
  const fallbackPlatform =
    platforms.find((platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID) ?? platforms[0];

  return {
    globalSettings: normalizeGlobalSettings(appSettingsRecord?.value),
    vehicles,
    platforms,
    expenses: expensesRaw.map(normalizeExpenseEntry),
    fuelEntries: fuelRaw.map(normalizeFuelEntry),
    chargeEntries: chargeRaw.map(normalizeChargeEntry),
    quoteEntries: quotesRaw.map(normalizeQuoteEntry),
    reminderEntries: remindersRaw.map(normalizeReminderEntry),
    trips: tripsRaw.map((trip) => normalizeTripRecord(trip, fallbackVehicle, fallbackPlatform)),
  };
}

export async function saveGlobalSettings(globalSettings: GlobalSettings): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, META_STORE, {
    key: APP_SETTINGS_KEY,
    value: normalizeGlobalSettings(globalSettings),
  });
}

export async function saveVehicleProfile(vehicle: VehicleProfile): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, VEHICLES_STORE, normalizeVehicleProfile(vehicle));
}

export async function deleteVehicleProfile(vehicleId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, VEHICLES_STORE, vehicleId);
}

export async function savePlatformProfile(platform: PlatformProfile): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, PLATFORMS_STORE, normalizePlatformProfile(platform));
}

export async function deletePlatformProfile(platformId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, PLATFORMS_STORE, platformId);
}

export async function saveExpenseEntry(expense: ExpenseEntry): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, EXPENSES_STORE, normalizeExpenseEntry(expense));
}

export async function deleteExpenseEntry(expenseId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, EXPENSES_STORE, expenseId);
}

export async function saveFuelEntry(fuelEntry: FuelEntry): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, FUEL_STORE, normalizeFuelEntry(fuelEntry));
}

export async function deleteFuelEntry(fuelEntryId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, FUEL_STORE, fuelEntryId);
}

export async function saveChargeEntry(chargeEntry: ChargeEntry): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, CHARGE_STORE, normalizeChargeEntry(chargeEntry));
}

export async function deleteChargeEntry(chargeEntryId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, CHARGE_STORE, chargeEntryId);
}

export async function saveQuoteEntry(quote: QuoteEntry): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, QUOTES_STORE, normalizeQuoteEntry(quote));
}

export async function deleteQuoteEntry(quoteId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, QUOTES_STORE, quoteId);
}

export async function saveReminderEntry(reminder: ReminderEntry): Promise<void> {
  const database = await openDatabase();
  await putInStore(database, REMINDERS_STORE, normalizeReminderEntry(reminder));
}

export async function deleteReminderEntry(reminderId: string): Promise<void> {
  const database = await openDatabase();
  await deleteFromStore(database, REMINDERS_STORE, reminderId);
}

export async function saveTrip(trip: TripRecord): Promise<void> {
  const database = await openDatabase();
  const appData = await getAppData();
  const fallbackVehicle = appData.vehicles[0];
  const fallbackPlatform =
    appData.platforms.find((platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID) ??
    appData.platforms[0];
  await putInStore(
    database,
    TRIPS_STORE,
    normalizeTripRecord(trip, fallbackVehicle, fallbackPlatform),
  );
}

export async function deleteTripsForMonth(month: string): Promise<void> {
  const database = await openDatabase();
  const appData = await getAppData();
  const fallbackVehicle = appData.vehicles[0];
  const fallbackPlatform =
    appData.platforms.find((platform) => platform.id === LEGACY_DEFAULT_PLATFORM_ID) ??
    appData.platforms[0];
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

      const trip = normalizeTripRecord(cursor.value, fallbackVehicle, fallbackPlatform);
      if (trip.month === month) {
        cursor.delete();
      }

      cursor.continue();
    };
  });

  await transactionToPromise(transaction);
}

export async function clearAllData(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(
    [
      META_STORE,
      VEHICLES_STORE,
      PLATFORMS_STORE,
      EXPENSES_STORE,
      FUEL_STORE,
      CHARGE_STORE,
      QUOTES_STORE,
      REMINDERS_STORE,
      TRIPS_STORE,
    ],
    "readwrite",
  );

  await requestToPromise(transaction.objectStore(META_STORE).clear());
  await requestToPromise(transaction.objectStore(VEHICLES_STORE).clear());
  await requestToPromise(transaction.objectStore(PLATFORMS_STORE).clear());
  await requestToPromise(transaction.objectStore(EXPENSES_STORE).clear());
  await requestToPromise(transaction.objectStore(FUEL_STORE).clear());
  await requestToPromise(transaction.objectStore(CHARGE_STORE).clear());
  await requestToPromise(transaction.objectStore(QUOTES_STORE).clear());
  await requestToPromise(transaction.objectStore(REMINDERS_STORE).clear());
  await requestToPromise(transaction.objectStore(TRIPS_STORE).clear());

  await transactionToPromise(transaction);
}

export async function exportSnapshot(): Promise<AppSnapshot> {
  const data = await getAppData();
  return buildExportSnapshot(
    data.globalSettings,
    data.vehicles,
    data.platforms,
    data.expenses,
    data.fuelEntries,
    data.chargeEntries,
    data.quoteEntries,
    data.reminderEntries,
    data.trips,
  );
}

export async function importSnapshot(rawSnapshot: unknown): Promise<void> {
  const normalized = normalizeLegacyOrCurrentSnapshot(rawSnapshot);
  const database = await openDatabase();
  const transaction = database.transaction(
    [
      META_STORE,
      VEHICLES_STORE,
      PLATFORMS_STORE,
      EXPENSES_STORE,
      FUEL_STORE,
      CHARGE_STORE,
      QUOTES_STORE,
      REMINDERS_STORE,
      TRIPS_STORE,
    ],
    "readwrite",
  );
  const metaStore = transaction.objectStore(META_STORE);
  const vehiclesStore = transaction.objectStore(VEHICLES_STORE);
  const platformsStore = transaction.objectStore(PLATFORMS_STORE);
  const expensesStore = transaction.objectStore(EXPENSES_STORE);
  const fuelStore = transaction.objectStore(FUEL_STORE);
  const chargeStore = transaction.objectStore(CHARGE_STORE);
  const quotesStore = transaction.objectStore(QUOTES_STORE);
  const remindersStore = transaction.objectStore(REMINDERS_STORE);
  const tripsStore = transaction.objectStore(TRIPS_STORE);

  await requestToPromise(metaStore.clear());
  await requestToPromise(vehiclesStore.clear());
  await requestToPromise(platformsStore.clear());
  await requestToPromise(expensesStore.clear());
  await requestToPromise(fuelStore.clear());
  await requestToPromise(chargeStore.clear());
  await requestToPromise(quotesStore.clear());
  await requestToPromise(remindersStore.clear());
  await requestToPromise(tripsStore.clear());

  await requestToPromise(
    metaStore.put({
      key: APP_SETTINGS_KEY,
      value: normalized.globalSettings,
    }),
  );

  for (const vehicle of normalized.vehicles) {
    await requestToPromise(vehiclesStore.put(vehicle));
  }

  for (const platform of normalized.platforms) {
    await requestToPromise(platformsStore.put(platform));
  }

  for (const expense of normalized.expenses) {
    await requestToPromise(expensesStore.put(expense));
  }

  for (const fuelEntry of normalized.fuelEntries) {
    await requestToPromise(fuelStore.put(fuelEntry));
  }

  for (const chargeEntry of normalized.chargeEntries) {
    await requestToPromise(chargeStore.put(chargeEntry));
  }

  for (const quoteEntry of normalized.quoteEntries) {
    await requestToPromise(quotesStore.put(quoteEntry));
  }

  for (const reminderEntry of normalized.reminderEntries) {
    await requestToPromise(remindersStore.put(reminderEntry));
  }

  for (const trip of normalized.trips) {
    await requestToPromise(tripsStore.put(trip));
  }

  await transactionToPromise(transaction);
}
