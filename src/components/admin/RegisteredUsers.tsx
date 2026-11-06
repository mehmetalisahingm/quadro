"use client";
import { useCallback, useEffect, useState } from "react";
import { readStoredSession } from "@/lib/auth/client";

type Account = { id: string; email: string | null; displayName: string | null; createdAt: string | null; lastSignInAt: string | null; emailConfirmed: boolean };
type Page = { users: Account[]; page: number; hasNext: boolean };
const formatDate = (date: string | null) => date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleString("tr-TR") : "—";

export function RegisteredUsers() {
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (page: number) => {
    const session = readStoredSession();
    if (!session) { setError("Kullanıcı listesini görmek için admin hesabınla giriş yap."); return; }
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/admin/users?page=${page}`, { headers: { authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Kullanıcı listesi alınamadı. Girişini ve admin yetkini kontrol edip tekrar dene.");
      setData(await response.json() as Page);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Kullanıcı listesi alınamadı."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(1), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return <section style={{ border: "1px solid rgba(15,23,42,.12)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,.8)", overflowX: "auto" }} aria-labelledby="registered-users">
    <h2 id="registered-users" style={{ marginTop: 0 }}>Kayıtlı kullanıcılar</h2>
    <p>Hesap açanlar, henüz oyun tamamlamamış olsalar da burada görünür. Misafir oyuncuların hesabı yoktur.</p>
    {error && <p role="alert">{error} <button type="button" onClick={() => void load(data?.page ?? 1)}>Tekrar dene</button></p>}
    {loading && <p role="status">Kullanıcılar yükleniyor…</p>}
    {data && (data.users.length ? <table style={{ width: "100%", minWidth: 670, borderCollapse: "collapse" }}>
      <thead><tr><th align="left">Oyuncu</th><th align="left">E-posta</th><th align="left">Kayıt tarihi</th><th align="left">Son giriş</th><th align="left">E-posta durumu</th></tr></thead>
      <tbody>{data.users.map(user => <tr key={user.id}><td style={{ padding: "0.6rem 0" }}>{user.displayName || "—"}</td><td>{user.email || "—"}</td><td>{formatDate(user.createdAt)}</td><td>{formatDate(user.lastSignInAt)}</td><td>{user.emailConfirmed ? "Doğrulandı" : "Doğrulanmadı"}</td></tr>)}</tbody>
    </table> : <p>Bu sayfada kayıtlı kullanıcı yok.</p>)}
    {data && <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
      <button type="button" disabled={loading || data.page <= 1} onClick={() => void load(data.page - 1)}>Önceki</button>
      <span>Sayfa {data.page}</span>
      <button type="button" disabled={loading || !data.hasNext} onClick={() => void load(data.page + 1)}>Sonraki</button>
    </div>}
  </section>;
}
