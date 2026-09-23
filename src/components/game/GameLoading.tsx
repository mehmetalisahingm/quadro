import styles from "./GameNotice.module.css";

export function GameLoading() {
  return (
    <section className={`q-game-shell ${styles.loading}`} aria-busy="true" aria-label="Bulmaca yükleniyor">
      <div className="q-game-intro" role="status">
        <h1 className="q-game-title">Tahta hazırlanıyor.</h1>
        <p className="q-game-description">Bulmacan ve kayıtlı ilerlemen yükleniyor.</p>
      </div>
      <div className={styles.skeleton} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
      </div>
    </section>
  );
}
