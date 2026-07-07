import { AppSettings, AppSnapshot, DEFAULT_APP_SETTINGS, TripRecord } from "../types";

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

export async function getAppSettings(): Promise<AppSettings> {
  const database = await openDatabase();
  const transaction = database.transaction(SETTINGS_STORE, "readonly");
  const store = transaction.objectStore(SETTINGS_STORE);

  const vehicleRecord = (await requestToPromise(
    store.get(VEHICLE_SETTINGS_KEY),
  )) as SettingsEntry<AppSettings["vehicle"]> | undefined;
  const maintenanceRecord = (await requestToPromise(
    store.get(MAINTENANCE_SETTINGS_KEY),
  )) as SettingsEntry<AppSettings["maintenance"]> | undefined;

  await transactionToPromise(transaction);

  return {
    vehicle: vehicleRecord?.value ?? DEFAULT_APP_SETTINGS.vehicle,
    maintenance: maintenanceRecord?.value ?? DEFAULT_APP_SETTINGS.maintenance,
  };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(SETTINGS_STORE, "readwrite");
  const store = transaction.objectStore(SETTINGS_STORE);

  await requestToPromise(
    store.put({
      key: VEHICLE_SETTINGS_KEY,
      value: settings.vehicle,
    }),
  );
  await requestToPromise(
    store.put({
      key: MAINTENANCE_SETTINGS_KEY,
      value: settings.maintenance,
    }),
  );

  await transactionToPromise(transaction);
}

export async function getTrips(): Promise<TripRecord[]> {
  const database = await openDatabase();
  const transaction = database.transaction(TRIPS_STORE, "readonly");
  const store = transaction.objectStore(TRIPS_STORE);
  const trips = (await requestToPromise(store.getAll())) as TripRecord[];

  await transactionToPromise(transaction);

  return trips;
}

export async function saveTrip(trip: TripRecord): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(TRIPS_STORE, "readwrite");
  const store = transaction.objectStore(TRIPS_STORE);

  await requestToPromise(store.put(trip));
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

      const trip = cursor.value as TripRecord;
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
  const database = await openDatabase();
  const transaction = database.transaction([SETTINGS_STORE, TRIPS_STORE], "readwrite");
  const settingsStore = transaction.objectStore(SETTINGS_STORE);
  const tripsStore = transaction.objectStore(TRIPS_STORE);

  await requestToPromise(settingsStore.clear());
  await requestToPromise(tripsStore.clear());

  await requestToPromise(
    settingsStore.put({
      key: VEHICLE_SETTINGS_KEY,
      value: snapshot.settings.vehicle,
    }),
  );
  await requestToPromise(
    settingsStore.put({
      key: MAINTENANCE_SETTINGS_KEY,
      value: snapshot.settings.maintenance,
    }),
  );

  for (const trip of snapshot.trips) {
    await requestToPromise(tripsStore.put(trip));
  }

  await transactionToPromise(transaction);
}
