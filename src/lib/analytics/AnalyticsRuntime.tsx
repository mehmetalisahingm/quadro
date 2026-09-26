"use client";

import { useEffect } from "react";

import { installGlobalMonitoring } from "@/lib/monitoring";

import { recordBrowserRetentionVisit } from "./index";

export function AnalyticsRuntime() {
  useEffect(() => {
    recordBrowserRetentionVisit();
    return installGlobalMonitoring();
  }, []);

  return null;
}
