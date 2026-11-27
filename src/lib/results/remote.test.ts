// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { VISITOR_ID_STORAGE_KEY } from "@/lib/analytics/remote";
import { saveConsent } from "@/lib/consent";

import { getOrCreateResultDeviceId, RESULT_DEVICE_STORAGE_KEY } from "./remote";

beforeEach(() => localStorage.clear());

describe("hesaba sonuç kaydı cihaz kanıtı", () => {
  it("analitik reddedilse de hesap kaydı için çalışır ve ölçüm kimliği oluşturmaz", () => {
    saveConsent({ analytics: false, ads: false });
    const id = getOrCreateResultDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(RESULT_DEVICE_STORAGE_KEY)).toBe(id);
    expect(localStorage.getItem(VISITOR_ID_STORAGE_KEY)).toBeNull();
    expect(getOrCreateResultDeviceId()).toBe(id);
  });

  it("eski sürümdeki ziyaretçi kimliğini bir kez devralır; bugünkü kayıtlar kopmaz", () => {
    const legacy = "123e4567-e89b-42d3-a456-426614174000";
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, legacy);
    expect(getOrCreateResultDeviceId()).toBe(legacy);
    localStorage.removeItem(VISITOR_ID_STORAGE_KEY);
    expect(getOrCreateResultDeviceId()).toBe(legacy);
  });
});
