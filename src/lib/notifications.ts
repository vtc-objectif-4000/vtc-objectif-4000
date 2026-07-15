import {
  AppNotification,
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
} from "../types";

const NOTIFICATIONS_STORAGE_KEY = "cap-4000-vtc-notifications";
const NOTIFICATION_SETTINGS_STORAGE_KEY = "cap-4000-vtc-notification-settings";
const MAX_STORED_NOTIFICATIONS = 250;

function createNotificationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `notification-${crypto.randomUUID()}`;
  }

  return `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeStoredNotification(rawValue: unknown): AppNotification | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const source = rawValue as Record<string, unknown>;
  const key = asString(source.key);
  const type = asString(source.type);
  const category = asString(source.category);
  const severity = asString(source.severity);

  if (!key || !type || !category || !severity) {
    return null;
  }

  return {
    id: asString(source.id, createNotificationId()),
    key,
    type: type as AppNotification["type"],
    category: category as AppNotification["category"],
    severity: severity as AppNotification["severity"],
    title: asString(source.title, "Notification"),
    message: asString(source.message),
    createdAt: asString(source.createdAt, new Date().toISOString()),
    updatedAt: asString(source.updatedAt, new Date().toISOString()),
    readAt: typeof source.readAt === "string" ? source.readAt : null,
  };
}

export function loadStoredNotifications(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeStoredNotification)
      .filter((item): item is AppNotification => Boolean(item))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_STORED_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifications: AppNotification[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(
      [...notifications]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, MAX_STORED_NOTIFICATIONS),
    ),
  );
}

export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  try {
    const rawValue = window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    return {
      goalDailyMissed:
        typeof parsed.goalDailyMissed === "boolean"
          ? parsed.goalDailyMissed
          : DEFAULT_NOTIFICATION_SETTINGS.goalDailyMissed,
      monthlyGapHigh:
        typeof parsed.monthlyGapHigh === "boolean"
          ? parsed.monthlyGapHigh
          : DEFAULT_NOTIFICATION_SETTINGS.monthlyGapHigh,
      requiredAverageRising:
        typeof parsed.requiredAverageRising === "boolean"
          ? parsed.requiredAverageRising
          : DEFAULT_NOTIFICATION_SETTINGS.requiredAverageRising,
      noRevenueToday:
        typeof parsed.noRevenueToday === "boolean"
          ? parsed.noRevenueToday
          : DEFAULT_NOTIFICATION_SETTINGS.noRevenueToday,
      highExpense:
        typeof parsed.highExpense === "boolean"
          ? parsed.highExpense
          : DEFAULT_NOTIFICATION_SETTINGS.highExpense,
      vehicleDeadline:
        typeof parsed.vehicleDeadline === "boolean"
          ? parsed.vehicleDeadline
          : DEFAULT_NOTIFICATION_SETTINGS.vehicleDeadline,
      endOfDayReview:
        typeof parsed.endOfDayReview === "boolean"
          ? parsed.endOfDayReview
          : DEFAULT_NOTIFICATION_SETTINGS.endOfDayReview,
      systemNotifications:
        typeof parsed.systemNotifications === "boolean"
          ? parsed.systemNotifications
          : DEFAULT_NOTIFICATION_SETTINGS.systemNotifications,
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    NOTIFICATION_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export function mergeSmartNotifications(
  existingNotifications: AppNotification[],
  nextNotifications: Omit<AppNotification, "id" | "createdAt" | "updatedAt" | "readAt">[],
): {
  notifications: AppNotification[];
  newNotifications: AppNotification[];
} {
  const nextMap = new Map(
    existingNotifications.map((notification) => [notification.key, notification]),
  );
  const mergedNotifications = [...existingNotifications];
  const newNotifications: AppNotification[] = [];
  const now = new Date().toISOString();

  for (const candidate of nextNotifications) {
    const existing = nextMap.get(candidate.key);

    if (existing) {
      const hasChanged =
        existing.type !== candidate.type ||
        existing.category !== candidate.category ||
        existing.severity !== candidate.severity ||
        existing.title !== candidate.title ||
        existing.message !== candidate.message;

      if (hasChanged) {
        const updatedNotification: AppNotification = {
          ...existing,
          ...candidate,
          updatedAt: now,
        };
        const index = mergedNotifications.findIndex(
          (notification) => notification.key === candidate.key,
        );
        mergedNotifications[index] = updatedNotification;
      }
      continue;
    }

    const createdNotification: AppNotification = {
      ...candidate,
      id: createNotificationId(),
      createdAt: now,
      updatedAt: now,
      readAt: null,
    };
    mergedNotifications.unshift(createdNotification);
    newNotifications.push(createdNotification);
  }

  const dedupedNotifications = new Map(
    mergedNotifications.map((notification) => [notification.key, notification]),
  );

  return {
    notifications: [...dedupedNotifications.values()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_STORED_NOTIFICATIONS),
    newNotifications,
  };
}
