import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export default function HomePage() {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>{APP_TAGLINE}</p>
      <p>
        Proje temeli hazır. Ana sayfa ve oyun arayüzü sonraki görevlerde
        (Q05, Q11, Q13) uygulanacaktır.
      </p>
    </main>
  );
}
