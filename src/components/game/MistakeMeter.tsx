export type MistakeMeterProps = {
  remaining: number;
  total?: number;
};

export function MistakeMeter({ remaining, total = 4 }: MistakeMeterProps) {
  const used = Math.max(total - remaining, 0);

  return (
    <div className="q-mistake-meter" aria-label={`${remaining} hata hakkı kaldı`}>
      <span className="q-mistake-label">Hata hakkı</span>
      <span className="q-mistake-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={
              index < used ? "q-mistake-dot q-mistake-dot-used" : "q-mistake-dot"
            }
          />
        ))}
      </span>
      <span className="q-sr-only">{remaining} kaldı</span>
    </div>
  );
}
