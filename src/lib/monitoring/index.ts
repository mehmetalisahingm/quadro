export const MONITORING_STORAGE_KEY = "quadro:monitoring:v1";
export const MONITORING_BROWSER_EVENT = "quadro:monitoring";

const MAX_ERRORS = 50;
const MAX_MESSAGE_LENGTH = 240;

export type TechnicalErrorSource = "window-error" | "unhandled-rejection" | "manual";

export type TechnicalErrorRecord = {
  at: string;
  source: TechnicalErrorSource;
  name: string;
  message: string;
  path: string;
};

export type MonitoringStorage = Pick<Storage, "getItem" | "setItem">;

function cleanMessage(value: unknown): { name: string; message: string } {
  if (value instanceof Error) {
    return {
      name: value.name || "Error",
      message: (value.message || "Bilinmeyen hata").slice(0, MAX_MESSAGE_LENGTH),
    };
  }

  if (typeof value === "string") {
    return { name: "Error", message: value.slice(0, MAX_MESSAGE_LENGTH) };
  }

  return { name: "Error", message: "Bilinmeyen hata" };
}

function readRecords(storage: MonitoringStorage): TechnicalErrorRecord[] {
  try {
    const raw = storage.getItem(MONITORING_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TechnicalErrorRecord[]) : [];
  } catch {
    return [];
  }
}

export function captureTechnicalError(
  storage: MonitoringStorage,
  input: { source: TechnicalErrorSource; error: unknown; path?: string },
  now = new Date(),
): TechnicalErrorRecord | null {
  const normalized = cleanMessage(input.error);
  const record: TechnicalErrorRecord = {
    at: now.toISOString(),
    source: input.source,
    name: normalized.name,
    message: normalized.message,
    path: (input.path ?? "unknown").slice(0, 160),
  };

  try {
    storage.setItem(
      MONITORING_STORAGE_KEY,
      JSON.stringify([...readRecords(storage), record].slice(-MAX_ERRORS)),
    );
    return record;
  } catch {
    return null;
  }
}

function browserStorage(): MonitoringStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emitRecord(record: TechnicalErrorRecord): void {
  try {
    window.dispatchEvent(new CustomEvent(MONITORING_BROWSER_EVENT, { detail: record }));
  } catch {
    // Hata izleyici kendi hatasıyla ürünü bozmamalı.
  }
}

export function captureBrowserError(
  source: TechnicalErrorSource,
  error: unknown,
): TechnicalErrorRecord | null {
  const storage = browserStorage();
  if (!storage) return null;
  const record = captureTechnicalError(storage, {
    source,
    error,
    path: typeof location === "undefined" ? "unknown" : location.pathname,
  });
  if (record) emitRecord(record);
  return record;
}

export function installGlobalMonitoring(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    captureBrowserError("window-error", event.error ?? event.message);
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureBrowserError("unhandled-rejection", event.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
