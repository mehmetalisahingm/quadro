import { HomeExperience } from "@/components/home/HomeExperience";
import { formatCountdown } from "@/components/home/homeState";
import {
  formatDayLabel,
  loadDailyPuzzle,
  publicationDayOf,
  puzzleNumberFromId,
  resolvePublicationDay,
} from "@/lib/daily";

const THIRTY_SIX_HOURS = 36 * 60 * 60 * 1000;
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function nextPublicationBoundary(now: Date): Date {
  const currentDay = publicationDayOf(now);
  let low = now.getTime();
  let high = low + THIRTY_SIX_HOURS;

  // 36 saat pratikte yeterlidir; IANA verisinde olağandışı bir geçiş olsa bile
  // güvenli tarafta kalıp farklı yayın gününü bulana kadar pencereyi büyütürüz.
  while (publicationDayOf(new Date(high)) === currentDay) {
    high += TWELVE_HOURS;
  }

  // İlk farklı gün milisaniyesini bul. Böylece UTC+3 gibi sabit ofset
  // varsaymadan Europe/Istanbul gece yarısına bağlanır.
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (publicationDayOf(new Date(middle)) === currentDay) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return new Date(high);
}

export default async function HomePage() {
  const now = new Date();
  const dayKey = resolvePublicationDay({ now });
  const daily = await loadDailyPuzzle({ dayKey });
  const boundary = nextPublicationBoundary(now);

  const puzzle =
    daily.status === "ok"
      ? {
          puzzleId: daily.puzzle.id,
          puzzleRevision: daily.puzzle.revision,
          puzzleNumber: puzzleNumberFromId(daily.puzzle.id),
        }
      : {
          puzzleId: null,
          puzzleRevision: null,
          puzzleNumber: null,
        };

  return (
    <main className="q-page-shell">
      <HomeExperience
        today={{
          dayKey,
          puzzleId: puzzle.puzzleId,
          puzzleRevision: puzzle.puzzleRevision,
        }}
        puzzleNumber={puzzle.puzzleNumber}
        dateLabel={formatDayLabel(dayKey)}
        nextRolloverAt={boundary.toISOString()}
        initialCountdownLabel={formatCountdown(boundary.getTime(), now.getTime())}
      />
    </main>
  );
}
