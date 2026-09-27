import { forwardAnalyticsEvent } from "./remote";

export const ANALYTICS_STORAGE_KEY = "quadro:analytics:v1";
export const ANALYTICS_DEDUPE_KEY = "quadro:analytics:dedupe:v1";
export const ANALYTICS_COHORT_KEY = "quadro:analytics:cohort:v1";
export const ANALYTICS_BROWSER_EVENT = "quadro:analytics";

const MAX_EVENTS = 250;
const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

export type AnalyticsEventProperties = {
  home_view: {
    state: "new" | "in-progress" | "completed";
    dayKey: string;
    puzzleAvailable: boolean;
  };
  game_start: {
    puzzleId: string;
    revision: number;
    dayKey: string;
    resumed: boolean;
  };
  first_attempt: {
    puzzleId: string;
    revision: number;
    verdict: "correct" | "one-away" | "wrong";
    mistakesRemaining: number;
  };
  game_finish: {
    puzzleId: string;
    revision: number;
    dayKey: string;
    status: "won" | "lost";
    attemptCount: number;
    mistakesUsed: number;
    activeSeconds: number;
  };
  share_attempt: {
    puzzleId: string;
    revision: number;
    method: "native-share" | "clipboard" | "share-fallback";
  };
  retention_visit: {
    cohortDay: string;
    activeDay: string;
    dayOffset: number;
    milestone: "D0" | "D1" | "D7" | "other";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventProperties;

export type AnalyticsEvent<N extends AnalyticsEventName = AnalyticsEventName> = {
  id: string;
  name: N;
  at: string;
  properties: AnalyticsEventProperties[N];
};

export type AnalyticsStorage = Pick<Storage, "getItem" | "setItem">;

type AnalyticsClientOptions = {
  storage: AnalyticsStorage;
  now?: () => Date;
  makeId?: () => string;
  emit?: (event: AnalyticsEvent) => void;
};

function safeParseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseEvents(raw: string | null): AnalyticsEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createAnalyticsClient({
  storage,
  now = () => new Date(),
  makeId = defaultId,
  emit,
}: AnalyticsClientOptions) {
  const readEvents = (): AnalyticsEvent[] => {
    try {
      return safeParseEvents(storage.getItem(ANALYTICS_STORAGE_KEY));
    } catch {
      return [];
    }
  };

  const track = <N extends AnalyticsEventName>(
    name: N,
    properties: AnalyticsEventProperties[N],
  ): AnalyticsEvent<N> | null => {
    const event: AnalyticsEvent<N> = {
      id: makeId(),
      name,
      at: now().toISOString(),
      properties,
    };

    try {
      const next = [...readEvents(), event].slice(-MAX_EVENTS);
      storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(next));
      emit?.(event as AnalyticsEvent);
      return event;
    } catch {
      return null;
    }
  };

  const trackOnce = <N extends AnalyticsEventName>(
    dedupeKey: string,
    name: N,
    properties: AnalyticsEventProperties[N],
  ): AnalyticsEvent<N> | null => {
    try {
      const keys = safeParseStringArray(storage.getItem(ANALYTICS_DEDUPE_KEY));
      if (keys.includes(dedupeKey)) return null;

      const event = track(name, properties);
      if (!event) return null;

      storage.setItem(ANALYTICS_DEDUPE_KEY, JSON.stringify([...keys, dedupeKey].slice(-500)));
      return event;
    } catch {
      return null;
    }
  };

  return { readEvents, track, trackOnce };
}

function browserStorage(): AnalyticsStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const probe = "quadro:analytics:probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function dispatchBrowserEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  try {
    window.dispatchEvent(new CustomEvent(ANALYTICS_BROWSER_EVENT, { detail: event }));
    forwardAnalyticsEvent(event);
  } catch {
    // Ölçüm hiçbir zaman ürün akışını bozmamalı.
  }
}

export function trackBrowserEvent<N extends AnalyticsEventName>(
  name: N,
  properties: AnalyticsEventProperties[N],
): AnalyticsEvent<N> | null {
  const storage = browserStorage();
  if (!storage) return null;
  return createAnalyticsClient({ storage, emit: dispatchBrowserEvent }).track(name, properties);
}

export function trackBrowserEventOnce<N extends AnalyticsEventName>(
  dedupeKey: string,
  name: N,
  properties: AnalyticsEventProperties[N],
): AnalyticsEvent<N> | null {
  const storage = browserStorage();
  if (!storage) return null;
  return createAnalyticsClient({ storage, emit: dispatchBrowserEvent }).trackOnce(
    dedupeKey,
    name,
    properties,
  );
}

export function istanbulDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function calendarDayOffset(fromDay: string, toDay: string): number {
  const from = Date.parse(`${fromDay}T00:00:00Z`);
  const to = Date.parse(`${toDay}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

export function recordBrowserRetentionVisit(now = new Date()): void {
  const storage = browserStorage();
  if (!storage) return;

  try {
    const activeDay = istanbulDayKey(now);
    const cohortDay = storage.getItem(ANALYTICS_COHORT_KEY) ?? activeDay;
    if (storage.getItem(ANALYTICS_COHORT_KEY) === null) {
      storage.setItem(ANALYTICS_COHORT_KEY, cohortDay);
    }

    const dayOffset = calendarDayOffset(cohortDay, activeDay);
    const milestone =
      dayOffset === 0 ? "D0" : dayOffset === 1 ? "D1" : dayOffset === 7 ? "D7" : "other";

    createAnalyticsClient({ storage, emit: dispatchBrowserEvent }).trackOnce(
      `retention:${activeDay}`,
      "retention_visit",
      { cohortDay, activeDay, dayOffset, milestone },
    );
  } catch {
    // Gizli sekme, kota veya depolama engeli ölçümü devre dışı bırakabilir.
  }
}
