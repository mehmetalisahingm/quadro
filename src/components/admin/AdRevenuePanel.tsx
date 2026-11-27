"use client";
import { useState } from "react";
import { calculateAdMetrics } from "@/lib/ads/metrics";
const fields = [["earnings", "Tahmini kazanç"], ["impressions", "Reklam gösterimi"], ["requests", "Reklam isteği"], ["visitors", "Tekil ziyaretçi"], ["pageViews", "Sayfa görüntüleme"]] as const;
export function AdRevenuePanel() {
  const [values, setValues] = useState({ earnings: "", impressions: "", requests: "", visitors: "", pageViews: "" });
  const [period, setPeriod] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const ready = period.trim() !== "" && fields.every(([key]) => values[key].trim() !== "" && Number.isFinite(Number(values[key])) && Number(values[key]) >= 0);
  const data = { earnings: Number(values.earnings), impressions: Number(values.impressions), requests: Number(values.requests), visitors: Number(values.visitors), pageViews: Number(values.pageViews) };
  const m = calculateAdMetrics(data);
  const money = (n: number | null) => n === null ? "—" : new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 4 }).format(n);
  const number = (n: number | null) => n === null ? "—" : n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return <section style={{ border: "1px solid #cbd5e1", borderRadius: 16, padding: 16, background: "#fff", color: "#20242d" }}>
    <h2>Reklam geliri analizi</h2>
    <p>AdSense raporundan aynı tarih aralığındaki gerçek toplamları gir. Bu panel elle girilen verileri hesaplar; Google hesabına bağlanmaz, kayıt tutmaz veya gelir tahmin etmez.</p>
    <p><a href="https://adsense.google.com/">AdSense raporlarını aç</a></p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
      <label>Rapor dönemi<input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-11-01 / 2026-11-30" style={{ display: "block", width: "100%" }} /></label>
      <label>Para birimi<select value={currency} onChange={e => setCurrency(e.target.value)} style={{ display: "block" }}><option>TRY</option><option>USD</option><option>EUR</option></select></label>
      {fields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0" step={key === "earnings" ? "any" : "1"} value={values[key]} onChange={e => setValues(old => ({ ...old, [key]: e.target.value }))} style={{ display: "block", width: "100%" }} /></label>)}
    </div>
    {ready ? <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
      <div><dt>Gösterim RPM</dt><dd>{money(m.impressionRpm)}</dd></div><div><dt>Sayfa RPM</dt><dd>{money(m.pageRpm)}</dd></div>
      <div><dt>Ziyaretçi başına gelir</dt><dd>{money(m.revenuePerVisitor)}</dd></div><div><dt>Ziyaretçi başına gösterim</dt><dd>{number(m.impressionsPerVisitor)}</dd></div>
      <div><dt>İstek başına gösterim</dt><dd>{number(m.impressionsPerRequest)}</dd></div>
    </dl> : <p>Hesaplamak için dönem ve tüm metrikleri gir.</p>}
    <p>Ödemeler için kesinleşmiş AdSense bakiyesini esas al; tahmini kazançlar değişebilir.</p>
  </section>;
}
