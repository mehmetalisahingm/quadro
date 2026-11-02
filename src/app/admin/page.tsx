"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { claimAdmin, currentUserIsAdmin } from "@/lib/auth/admin";
import { readStoredSession } from "@/lib/auth/client";
import { AdminGameNavigation } from "@/components/game/AdminGameNavigation";
import { TrackNavigation } from "@/components/game/TrackNavigation";

type DashboardTotals = {
  visitors: number;
  todayVisitors: number;
  authenticatedUsers: number;
  gameStarts: number;
  gameFinishes: number;
  shares: number;
  wins: number;
  losses: number;
};

type PuzzleMetric = {
  puzzleId: string;
  starts: number;
  finishes: number;
  anonymousOrUnlinkedFinishes: number;
  wins: number;
  losses: number;
};

type RecentResult = {
  userId: string;
  email: string | null;
  displayName: string | null;
  puzzleId: string;
  revision: number;
  result: "won" | "lost";
  attemptCount: number;
  mistakesUsed: number;
  activeSeconds: number;
  playedAt: string;
};

type AnonymousBrowser = {
  browser: string;
  puzzleId: string;
  stage: string;
  solvedGroups: number;
  attemptCount: number;
  lastSeenAt: string;
};

type AnalyticsOverview = {
  uniquePlayers: number;
  last7DayVisitors: number;
  eventsToday: number;
  recentBrowsers: AnonymousBrowser[];
  daily: { day: string; visitors: number; starts: number; finishes: number }[];
};

type DashboardSnapshot = {
  overview?: AnalyticsOverview | null;
  totals: DashboardTotals;
  puzzles: PuzzleMetric[];
  recentResults: RecentResult[];
};

const cardStyle = {
  border: "1px solid rgba(15, 23, 42, 0.12)",
  borderRadius: 16,
  padding: "1rem",
  background: "rgba(255,255,255,0.8)",
} as const;

function resultLabel(result: RecentResult["result"]): string {
  return result === "won" ? "Çözdü" : "Kaybetti";
}

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const session = readStoredSession();
    if (!session) return;

    setDashboardLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: { authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Admin istatistikleri alınamadı.");
      setDashboard((await response.json()) as DashboardSnapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin istatistikleri alınamadı.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    void currentUserIsAdmin().then((admin) => {
      setIsAdmin(admin);
      setChecking(false);
      if (admin) void loadDashboard();
    });
  }, [loadDashboard]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!readStoredSession()) {
      setError("Önce normal giriş ekranından hesabına giriş yap.");
      return;
    }

    try {
      const claimed = await claimAdmin(code);
      if (!claimed) {
        setError("Admin kodu geçersiz veya daha önce kullanılmış.");
        return;
      }
      setIsAdmin(true);
      setCode("");
      setMessage("Admin modu etkin. Bulmacalarda hata hakkın artık sınırsız.");
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin yetkisi etkinleştirilemedi.");
    }
  }

  return (
    <main style={{ minHeight: "100svh", padding: "clamp(1rem, 4vw, 2.5rem)" }}>
      <section style={{ width: "min(1100px, 100%)", margin: "0 auto", display: "grid", gap: "1.25rem" }}>
        <div>
          <p style={{ fontWeight: 800, letterSpacing: "0.14em", fontSize: "0.75rem", marginBottom: 8 }}>QUADRO ADMIN</p>
          <h1 style={{ margin: 0 }}>Yönetim ve istatistikler</h1>
        </div>

        {checking ? <p>Yetki kontrol ediliyor…</p> : null}

        {!checking && isAdmin ? (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <p style={{ margin: 0 }}><strong>Admin aktif.</strong> Hata hakkın sınırsız.</p>
              <button type="button" onClick={() => void loadDashboard()} disabled={dashboardLoading} style={{ minHeight: 44, padding: "0 1rem", fontWeight: 800 }}>
                {dashboardLoading ? "Yenileniyor…" : "İstatistikleri yenile"}
              </button>
              <Link href="/play">Bulmacaya dön →</Link>
            </div>

            <AdminGameNavigation />
            <TrackNavigation />

            {dashboard ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                  {[
                    ["Toplam ziyaretçi", dashboard.totals.visitors],
                    ["Bugün ziyaretçi", dashboard.totals.todayVisitors],
                    ["Kayıtlı kullanıcı", dashboard.totals.authenticatedUsers],
                    ["Oyun başlatma", dashboard.totals.gameStarts],
                    ["Tamamlanan oyun", dashboard.totals.gameFinishes],
                    ["Kazanma", dashboard.totals.wins],
                    ["Kaybetme", dashboard.totals.losses],
                    ["Paylaşım", dashboard.totals.shares],
                  ].map(([label, value]) => (
                    <article key={String(label)} style={cardStyle}>
                      <div style={{ fontSize: "0.8rem", opacity: 0.72 }}>{label}</div>
                      <strong style={{ display: "block", fontSize: "1.8rem", marginTop: 4 }}>{value}</strong>
                    </article>
                  ))}
                </div>

                {dashboard.overview ? (
                  <section style={{ ...cardStyle, display: "grid", gap: "1rem" }}>
                    <h2 style={{ margin: 0 }}>Ziyaretçi ve anonim oyuncu analizi</h2>
                    <p style={{ margin: 0, opacity: 0.75 }}>Tekil sayılar tarayıcı kimliğidir, gerçek insan sayısı değildir. Kod içindeki test trafiği ayrıca ayıklanmamış olabilir.</p>
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                      <span><strong>Oyuncu tarayıcıları:</strong> {dashboard.overview.uniquePlayers}</span>
                      <span><strong>Son 7 gün ziyaretçileri:</strong> {dashboard.overview.last7DayVisitors}</span>
                      <span><strong>Bugün toplam kayıt:</strong> {dashboard.overview.eventsToday}</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: 420 }}>
                        <thead><tr><th align="left">Gün</th><th>Tekil tarayıcı</th><th>Başlangıç</th><th>Bitiş</th></tr></thead>
                        <tbody>{dashboard.overview.daily.map((d) => <tr key={d.day}><td>{d.day}</td><td align="center">{d.visitors}</td><td align="center">{d.starts}</td><td align="center">{d.finishes}</td></tr>)}</tbody>
                      </table>
                    </div>
                    <h3 style={{ marginBottom: 0 }}>Son 30 günde tarayıcı bazlı bölüm ilerlemesi</h3>
                    <p style={{ margin: 0, opacity: 0.75 }}>Anonim kod kişiyi tanımlamaz. Kayıtsız oyuncularda bölüm, deneme ve bulunan grup sayısı yeni sürümden itibaren ölçülür; geçmişteki kısmi ilerleme geriye dönük üretilemez.</p>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: 690 }}>
                        <thead><tr><th align="left">Tarayıcı kodu</th><th align="left">Bulmaca</th><th>İlerleme</th><th>Deneme</th><th align="left">Durum</th><th align="left">Son etkinlik</th></tr></thead>
                        <tbody>{dashboard.overview.recentBrowsers.map((b, i) => <tr key={`${b.browser}:${b.puzzleId}:${i}`}><td>{b.browser}</td><td>{b.puzzleId}</td><td align="center">{b.solvedGroups}/4 grup</td><td align="center">{b.attemptCount}</td><td>{b.stage}</td><td>{new Date(b.lastSeenAt).toLocaleString("tr-TR")}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </section>
                ) : <p>Gelişmiş anonim ilerleme raporu henüz etkin değil.</p>}

                <section style={{ ...cardStyle, overflowX: "auto" }}>
                  <h2 style={{ marginTop: 0 }}>Bulmaca performansı</h2>
                  {dashboard.puzzles.length === 0 ? <p>Henüz bulmaca verisi yok.</p> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                      <thead><tr><th align="left">Bulmaca</th><th>Başladı</th><th>Bitti</th><th>Çözüldü</th><th>Kaybedildi</th><th>Anonim / eşleşmemiş</th></tr></thead>
                      <tbody>
                        {dashboard.puzzles.map((row) => (
                          <tr key={row.puzzleId}>
                            <td style={{ padding: "0.6rem 0" }}>{row.puzzleId}</td>
                            <td align="center">{row.starts}</td><td align="center">{row.finishes}</td><td align="center">{row.wins}</td><td align="center">{row.losses}</td><td align="center">{row.anonymousOrUnlinkedFinishes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <section style={{ ...cardStyle, overflowX: "auto" }}>
                  <h2 style={{ marginTop: 0 }}>Son giriş yapmış oyuncular</h2>
                  <p style={{ marginTop: 0, opacity: 0.72 }}>Burada yalnız hesabıyla giriş yaparak bitiren oyuncular isim/e-posta ile görünür. Anonim oyuncular kimliklendirilmez.</p>
                  {dashboard.recentResults.length === 0 ? <p>Henüz hesaba bağlı tamamlanmış oyun yok.</p> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                      <thead><tr><th align="left">Oyuncu</th><th align="left">Bulmaca</th><th>Sonuç</th><th>Deneme</th><th>Hata</th><th>Süre</th><th align="left">Tarih</th></tr></thead>
                      <tbody>
                        {dashboard.recentResults.map((row) => (
                          <tr key={`${row.userId}:${row.puzzleId}:${row.revision}`}>
                            <td style={{ padding: "0.6rem 0" }}>{row.displayName || row.email || row.userId.slice(0, 8)}</td>
                            <td>{row.puzzleId}</td>
                            <td align="center"><strong>{resultLabel(row.result)}</strong></td>
                            <td align="center">{row.attemptCount}</td><td align="center">{row.mistakesUsed}</td><td align="center">{row.activeSeconds}s</td>
                            <td>{new Date(row.playedAt).toLocaleString("tr-TR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            ) : dashboardLoading ? <p>İstatistikler yükleniyor…</p> : null}
          </>
        ) : null}

        {!checking && !isAdmin ? (
          <form onSubmit={submit} style={{ ...cardStyle, width: "min(32rem, 100%)", display: "grid", gap: "0.75rem" }}>
            <Link href="/login">Admin hesabınla giriş yap →</Link>
            <label htmlFor="admin-code">Tek kullanımlık admin kodu</label>
            <input id="admin-code" type="password" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} required style={{ minHeight: 44, padding: "0.75rem" }} />
            <button type="submit" style={{ minHeight: 44, fontWeight: 800 }}>Admin modunu etkinleştir</button>
          </form>
        ) : null}

        {message ? <p role="status">{message}</p> : null}
        {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}
        <Link href="/">← Ana sayfa</Link>
      </section>
    </main>
  );
}
