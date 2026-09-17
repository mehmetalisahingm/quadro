export type MistakeMeterProps = {
  remaining: number;
  total?: number;
};

export function MistakeMeter({ remaining, total = 4 }: MistakeMeterProps) {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeRemaining = Math.min(safeTotal, Math.max(0, Math.floor(remaining)));
  const used = safeTotal - safeRemaining;

  return (
    <div className="q-mistake-meter">
      <span className="q-mistake-label" aria-hidden="true">Hata hakkı</span>
      <span className="q-mistake-dots" aria-hidden="true">
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            key={index}
            className={
              index < used ? "q-mistake-dot q-mistake-dot-used" : "q-mistake-dot"
            }
          />
        ))}
      </span>
      <span className="q-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {safeRemaining} hata hakkı kaldı
      </span>
    </div>
  );
}
