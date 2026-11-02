"use client";

import { useEffect, useState } from "react";

type Health = { playable: boolean; dayKey: string; selection: string; publishedDays: number; windowDays: number };
export function PublicationStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (typeof data.playable !== "boolean" || typeof data.dayKey !== "string" ||
          typeof data.selection !== "string" || typeof data.publishedDays !== "number" || typeof data.windowDays !== "number") throw new Error("invalid health");
        if (!controller.signal.aborted) setHealth(data);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return <section aria-label="Günlük yayın durumu" style={{ padding: 20, border: "1px solid #bda46c", borderRadius: 16, background: "#fff8e8" }}>
    <h2 style={{ marginTop: 0 }}>Günlük yayın durumu</h2>
    {error ? <p role="alert">Yayın durumu alınamadı. Canlı günlük oyunu ve sağlık kontrolünü incele.</p> : health ? <>
      <p>{health.dayKey} · {health.playable ? "Günlük oyun hazır" : "Günlük oyun açılamıyor"}</p>
      <p>Önümüzdeki {health.windowDays} gün için yayımlanmış stok: <strong>{health.publishedDays}/{health.windowDays}</strong>.</p>
      {health.selection === "reserve" && <p>Arşivden günlük seçki etkin. Yeni günlük bulmacalar insan değerlendirmesinden geçip yayımlandığında otomatik olarak öncelik alır.</p>}
      {health.publishedDays < health.windowDays && <p role="status">İçerik stoğu düşük: yeni günlük içerik hazırlayıp değerlendirmeye al.</p>}
    </> : <p>Yayın durumu yükleniyor…</p>}
  </section>;
}
