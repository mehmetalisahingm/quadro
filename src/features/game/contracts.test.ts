import { describe, expect, expectTypeOf, it } from "vitest";
import {
  GAME_CONSTANTS,
  attemptKey,
  normalizeTr,
  slugifyTr,
  type Attempt,
  type Four,
  type GameController,
  type GameSnapshot,
  type Puzzle,
  type PuzzleGroup,
  type SubmitOutcome,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";

// docs/CONTRACTS.md içindeki belge örneğiyle aynı bulmaca; yayın stoğunda yer almaz.
function group(
  id: string,
  title: string,
  difficulty: PuzzleGroup["difficulty"],
  texts: Four<string>,
): PuzzleGroup {
  const [a, b, c, d] = texts;
  const word = (text: string) => ({ id: slugifyTr(text), text });
  return {
    id,
    title,
    words: [word(a), word(b), word(c), word(d)],
    difficulty,
    explanation: `${title} için örnek açıklama.`,
  };
}

const renkler = group("renkler", "RENKLER", 1, ["KIRMIZI", "MAVİ", "YEŞİL", "SARI"]);
const meyveler = group("meyveler", "MEYVELER", 2, ["ELMA", "ARMUT", "KİRAZ", "İNCİR"]);
const gezegenler = group("gezegenler", "GEZEGENLER", 3, ["MARS", "VENÜS", "SATÜRN", "MERKÜR"]);
const sehirler = group("sehirler", "ŞEHİRLER", 4, ["ADANA", "BURSA", "İZMİR", "MUĞLA"]);

const puzzle: Puzzle = {
  schemaVersion: 1,
  revision: 1,
  id: "ornek-001",
  date: "2026-09-20",
  language: "tr",
  groups: [renkler, meyveler, gezegenler, sehirler],
};

function idsOf(target: PuzzleGroup): Four<WordId> {
  const [a, b, c, d] = target.words;
  return [a.id, b.id, c.id, d.id];
}

function snapshot(overrides: Partial<GameSnapshot>): GameSnapshot {
  return {
    schemaVersion: 1,
    puzzleId: puzzle.id,
    puzzleRevision: puzzle.revision,
    dayKey: puzzle.date,
    status: "playing",
    selectedWordIds: [],
    remainingWordOrder: puzzle.groups.flatMap(idsOf),
    solvedGroupIds: [],
    mistakesRemaining: GAME_CONSTANTS.maxMistakes,
    attempts: [],
    activeSeconds: 0,
    ...overrides,
  };
}

describe("GAME_CONSTANTS", () => {
  it("16 kelime = 4 grup × 4 kelime ve 4 hata hakkı", () => {
    expect(GAME_CONSTANTS.wordCount).toBe(16);
    expect(GAME_CONSTANTS.groupCount * GAME_CONSTANTS.groupSize).toBe(GAME_CONSTANTS.wordCount);
    expect(GAME_CONSTANTS.maxMistakes).toBe(4);
  });
});

describe("normalizeTr", () => {
  it("İ harfini noktalı i'ye küçültür (İSTANBUL → istanbul)", () => {
    expect(normalizeTr("İSTANBUL")).toBe("istanbul");
  });

  it("I harfini noktasız ı'ya küçültür (IŞIK → ışık)", () => {
    expect(normalizeTr("IŞIK")).toBe("ışık");
  });

  it("baştaki/sondaki boşlukları kırpar ve içteki boşlukları sadeleştirir", () => {
    expect(normalizeTr("  Kara \t  Deniz\n ")).toBe("kara deniz");
    expect(normalizeTr(" GÜNEŞ ")).toBe("güneş");
  });

  it("ayrışık ve yanlış yerel ayarla küçültülmüş İ biçimlerini aynı sonuca indirir", () => {
    expect(normalizeTr("İZMİR")).toBe("izmir");
    expect(normalizeTr("i̇zmi̇r")).toBe("izmir");
  });

  it("idempotenttir", () => {
    const once = normalizeTr("  ÇAĞDAŞ   IRMAK  ");
    expect(normalizeTr(once)).toBe(once);
  });
});

describe("slugifyTr", () => {
  it("Türkçe harfleri ASCII karşılığına indirir (GÜNEŞ → gunes)", () => {
    expect(slugifyTr("GÜNEŞ")).toBe("gunes");
    expect(slugifyTr("IŞIK")).toBe("isik");
    expect(slugifyTr("Çağdaş Öğün")).toBe("cagdas-ogun");
    expect(slugifyTr("hâlâ")).toBe("hala");
  });

  it("boşluk ve noktalama dizilerini tek tireye çevirir (Kara Deniz! → kara-deniz)", () => {
    expect(slugifyTr("Kara Deniz!")).toBe("kara-deniz");
    expect(slugifyTr("  --Kış   Günü--  ")).toBe("kis-gunu");
    expect(slugifyTr("1. LİG")).toBe("1-lig");
  });

  it("büyük/küçük harften bağımsız olarak kararlıdır", () => {
    expect(slugifyTr("güneş")).toBe(slugifyTr("GÜNEŞ"));
    expect(slugifyTr("İzmir")).toBe(slugifyTr("İZMİR"));
  });

  it("bilgi kaybını ve harfsiz metni açıkça belli eder", () => {
    // Benzersizlik içerik doğrulayıcısının işidir.
    expect(slugifyTr("ÇAM")).toBe(slugifyTr("CAM"));
    expect(slugifyTr("!?")).toBe("");
  });

  it("belge örneğinde 16 benzersiz kimlik üretir", () => {
    const ids = puzzle.groups.flatMap(idsOf);
    expect(ids).toHaveLength(GAME_CONSTANTS.wordCount);
    expect(new Set(ids).size).toBe(GAME_CONSTANTS.wordCount);
    expect(idsOf(meyveler)).toEqual(["elma", "armut", "kiraz", "incir"]);
  });
});

describe("attemptKey", () => {
  it("aynı dörtlü için sıradan bağımsız aynı anahtarı verir", () => {
    expect(attemptKey(["kiraz", "elma", "incir", "armut"])).toBe(
      attemptKey(["armut", "elma", "incir", "kiraz"]),
    );
  });

  it("farklı dörtlüler için farklı anahtar verir", () => {
    expect(attemptKey(["mars", "venus", "saturn", "adana"])).not.toBe(
      attemptKey(["mars", "venus", "saturn", "merkur"]),
    );
  });

  it("kimliklerde ayırıcı karakter geçse de çakışmaz", () => {
    expect(attemptKey(["a,b", "c", "d", "e"])).not.toBe(attemptKey(["a", "b,c", "d", "e"]));
  });

  it("girdi dizisini değiştirmez", () => {
    const wordIds: Four<WordId> = ["mars", "elma", "adana", "mavi"];
    attemptKey(wordIds);
    expect(wordIds).toEqual(["mars", "elma", "adana", "mavi"]);
  });
});

describe("sözleşme: sonuç ile durum ayrımı", () => {
  it("son doğru gönderim solvedGroup taşır ve snapshot.status 'won' olur", () => {
    const attempts: Attempt[] = [
      { id: "a1", wordIds: idsOf(renkler), verdict: "correct" },
      { id: "a2", wordIds: ["mars", "venus", "saturn", "adana"], verdict: "one-away" },
      { id: "a3", wordIds: idsOf(meyveler), verdict: "correct" },
      { id: "a4", wordIds: idsOf(gezegenler), verdict: "correct" },
      { id: "a5", wordIds: idsOf(sehirler), verdict: "correct" },
    ];
    const result: SubmitResult = {
      outcome: { verdict: "correct", solvedGroup: sehirler },
      snapshot: snapshot({
        status: "won",
        remainingWordOrder: [],
        solvedGroupIds: ["renkler", "meyveler", "gezegenler", "sehirler"],
        mistakesRemaining: 3,
        attempts,
      }),
    };

    const { outcome } = result;
    if (outcome.verdict !== "correct") {
      throw new Error("Son doğru gönderimin sonucu 'correct' olmalı.");
    }
    expect(outcome.solvedGroup.id).toBe("sehirler");
    expect(result.snapshot.status).toBe("won");
    expect(result.snapshot.solvedGroupIds.at(-1)).toBe(outcome.solvedGroup.id);
    expect(result.snapshot.solvedGroupIds).toHaveLength(GAME_CONSTANTS.groupCount);
    expect(result.snapshot.remainingWordOrder).toEqual([]);
    expect(result.snapshot.selectedWordIds).toEqual([]);
  });

  it("dördüncü hata kendi sonucunu korur ve snapshot.status 'lost' olur", () => {
    const result: SubmitResult = {
      outcome: { verdict: "one-away" },
      snapshot: snapshot({
        status: "lost",
        remainingWordOrder: [...idsOf(meyveler), ...idsOf(gezegenler), ...idsOf(sehirler)],
        solvedGroupIds: ["renkler"],
        mistakesRemaining: 0,
        attempts: [
          { id: "a1", wordIds: idsOf(renkler), verdict: "correct" },
          { id: "a2", wordIds: ["mars", "elma", "adana", "armut"], verdict: "wrong" },
          { id: "a3", wordIds: ["bursa", "kiraz", "venus", "izmir"], verdict: "wrong" },
          { id: "a4", wordIds: ["mars", "venus", "saturn", "adana"], verdict: "one-away" },
          { id: "a5", wordIds: ["elma", "armut", "kiraz", "mugla"], verdict: "one-away" },
        ],
      }),
    };

    expect(result.outcome.verdict).toBe("one-away");
    expect(result.snapshot.status).toBe("lost");
    expect(result.snapshot.mistakesRemaining).toBe(0);
    expect(result.snapshot.attempts.at(-1)?.verdict).toBe(result.outcome.verdict);
    // Kaybedince açılan cevaplar çözülmüş sayılmaz.
    expect(result.snapshot.solvedGroupIds).toEqual(["renkler"]);
  });

  it("tip düzeyi: yalnız 'correct' grup taşır, geçmişe repeated/invalid girmez", () => {
    expectTypeOf<Extract<SubmitOutcome, { verdict: "correct" }>>().toEqualTypeOf<{
      verdict: "correct";
      solvedGroup: PuzzleGroup;
    }>();
    expectTypeOf<Extract<SubmitOutcome, { verdict: "wrong" }>>().not.toHaveProperty("solvedGroup");
    expectTypeOf<Extract<SubmitOutcome, { verdict: "invalid" }>["reason"]>().toEqualTypeOf<
      "selection-count" | "invalid-words" | "game-ended"
    >();
    expectTypeOf<Attempt["verdict"]>().toEqualTypeOf<"correct" | "one-away" | "wrong">();
    expectTypeOf<SubmitResult["snapshot"]["status"]>().toEqualTypeOf<"playing" | "won" | "lost">();
    expectTypeOf<GameController["submitSelection"]>().returns.toEqualTypeOf<SubmitResult>();
    expectTypeOf<GameController["toggleWord"]>().parameters.toEqualTypeOf<[WordId]>();
  });
});
