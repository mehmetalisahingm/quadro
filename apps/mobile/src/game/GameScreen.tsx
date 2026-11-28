import type { Piece } from "@quadro/words-engine";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import {
  AccessibilityInfo,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import Animated, {
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  ZoomOut,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { palette, type Palette } from "../theme";
import { shareText } from "../persistence/persistence";
import { describePiece, pieceSize, PieceView } from "./PieceView";
import { useWordsGame } from "./useWordsGame";

type ViewType = ComponentRef<typeof View>;

const GAP = 4;
const TRAY_GAP = 8;
const RETURN_MS = 180;

type Hover = { slot: number; row: number; col: number } | null;

/**
 * Ölçüler: 7 hücre ekran genişliğine ve tepsiyle birlikte yüksekliğe sığmalı; tablette sınırlı.
 * Tepside üç yuva yan yana, her biri en geniş parçayı (4 hücre) taşıyabilmeli.
 */
function useLayout(boardSize: number) {
  const { width, height } = useWindowDimensions();
  const available = Math.min(width, 520) - 32;
  const byWidth = (available - GAP * (boardSize - 1)) / boardSize;
  const byHeight = (height - 330 - GAP * (boardSize - 1)) / boardSize;
  const cell = Math.max(28, Math.floor(Math.min(byWidth, byHeight, 64)));
  const slot = Math.floor((available - TRAY_GAP * 2) / 3);
  const trayGap = 3;
  const trayCell = Math.max(14, Math.floor(Math.min(cell * 0.62, (slot - 16 - trayGap * 3) / 4)));
  return { cell, slot, trayCell, trayGap };
}

export function GameScreen() {
  const colors = palette(useColorScheme());
  const reduceMotion = useReducedMotion();
  const { state, meta, best, records, settings, notice, lastMove, tryPlace, restart, updateSettings, eraseAll, canPlaceAt } = useWordsGame();
  const size = state.config.boardSize;
  const { cell, slot: slotSize, trayCell, trayGap } = useLayout(size);
  const step = cell + GAP;

  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const [panel, setPanel] = useState<"closed" | "open" | "confirm-new" | "confirm-erase">("closed");
  const haptics = settings.haptics;
  const tutorial = !settings.tutorialSeen;
  const dismissTutorial = () => {
    if (!settings.tutorialSeen) updateSettings({ tutorialSeen: true });
  };
  const [flashDoneId, setFlashDoneId] = useState(0);

  // Sürükleme: önizlemenin sol üst köşesi (pencere koordinatı) UI thread'de tutulur.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragging = useSharedValue(0);
  const boardX = useSharedValue(0);
  const boardY = useSharedValue(0);
  const lastRow = useSharedValue(-99);
  const lastCol = useSharedValue(-99);
  const boardRef = useRef<ViewType>(null);
  const slotRefs = useRef<(ViewType | null)[]>([]);
  const origins = useRef<{ x: number; y: number; width: number; height: number }[]>([]);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y) => {
      boardX.set(x);
      boardY.set(y);
    });
  }, [boardX, boardY]);

  const buzz = useCallback(
    (kind: "place" | "clear" | "fail") => {
      if (!haptics) return;
      try {
        if (kind === "clear") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (kind === "fail") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Titreşim desteklenmeyen platformda (web) sessizce atlanır.
      }
    },
    [haptics],
  );

  const place = (slot: number, row: number, col: number): boolean => {
    const result = tryPlace(slot, row, col);
    if (!result) return false;
    setSelected(null);
    dismissTutorial();
    buzz(result.words.length > 0 ? "clear" : "place");
    if (result.words.length > 0) {
      AccessibilityInfo.announceForAccessibility(`${result.words.map((w) => w.word).join(", ")} silindi, ${result.points} puan.`);
    }
    if (result.over) AccessibilityInfo.announceForAccessibility("Oyun bitti. Hiçbir parça sığmıyor.");
    return true;
  };

  // Sürükleme olayları UI thread'den gelir; en güncel duruma ref üzerinden erişilir.
  const handlers = useRef({ place, canPlaceAt, tray: state.tray });
  useEffect(() => {
    handlers.current = { place, canPlaceAt, tray: state.tray };
  });

  const onDragStart = (slot: number) => {
    setDragSlot(slot);
    setSelected(null);
    measureBoard();
    if (returnTimer.current) clearTimeout(returnTimer.current);
    slotRefs.current[slot]?.measureInWindow((x, y, width, height) => {
      origins.current[slot] = { x, y, width, height };
    });
  };

  const onHover = useCallback((slot: number, row: number, col: number) => setHover({ slot, row, col }), []);

  const finishDrag = useCallback(() => {
    dragging.set(0);
    setDragSlot(null);
    setHover(null);
    lastRow.set(-99);
    lastCol.set(-99);
  }, [dragging, lastRow, lastCol]);

  const onDrop = useCallback(
    (slot: number, row: number, col: number) => {
      if (handlers.current.canPlaceAt(slot, row, col) && handlers.current.place(slot, row, col)) {
        finishDrag();
        return;
      }
      // Geçersiz bırakma: parça tepsideki yerine geri döner (azaltılmış harekette anında).
      const origin = origins.current[slot];
      if (!origin || reduceMotion) {
        finishDrag();
        return;
      }
      setHover(null);
      // Hedef: parçanın tepsideki yuvanın ortasına dönmesi.
      const piece = handlers.current.tray[slot];
      const dims = piece ? pieceSize(piece) : { rows: 1, cols: 1 };
      const targetX = origin.x + origin.width / 2 - (dims.cols * step - GAP) / 2;
      const targetY = origin.y + origin.height / 2 - (dims.rows * step - GAP) / 2;
      dragX.set(withTiming(targetX, { duration: RETURN_MS }));
      dragY.set(withTiming(targetY, { duration: RETURN_MS }));
      // Durumu animasyon callback'ine bağlamıyoruz: kare atlanan ya da arka plandaki
      // görünümde callback gecikse bile sürükleme durumu süre dolunca kesin sıfırlanır.
      returnTimer.current = setTimeout(finishDrag, RETURN_MS + 20);
    },
    [dragX, dragY, finishDrag, reduceMotion, step],
  );

  useEffect(
    () => () => {
      if (returnTimer.current) clearTimeout(returnTimer.current);
    },
    [],
  );

  // Tetiklenen temizlik animasyonu: silinen harfler kısa süre görünür, sonra küçülerek kaybolur.
  useEffect(() => {
    if (!lastMove || lastMove.clearedLetters.length === 0) return;
    const timer = setTimeout(() => setFlashDoneId(lastMove.id), 380);
    return () => clearTimeout(timer);
  }, [lastMove]);
  const flash = lastMove && lastMove.id !== flashDoneId ? lastMove : null;

  const dragPiece: Piece | undefined = dragSlot === null ? undefined : state.tray[dragSlot];
  const previewStyle = useAnimatedStyle(() => ({
    opacity: dragging.get(),
    transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }],
  }));

  const ghostKeys = new Set<string>();
  const ghostSlot = hover?.slot ?? selected;
  if (hover && canPlaceAt(hover.slot, hover.row, hover.col)) {
    const piece = state.tray[hover.slot];
    piece?.cells.forEach((c) => ghostKeys.add(`${hover.row + c.dr}:${hover.col + c.dc}`));
  }
  const ghostLetters = new Map<string, string>();
  if (hover && ghostKeys.size > 0) {
    state.tray[hover.slot]?.cells.forEach((c) => ghostLetters.set(`${hover.row + c.dr}:${hover.col + c.dc}`, c.letter));
  }

  const flashKeys = new Map((flash?.clearedLetters ?? []).map((p) => [`${p.row}:${p.col}`, p.letter]));
  const lastWords = lastMove?.result.words ?? [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: colors.ink }]}>QUADRO WORDS</Text>
          <Text style={[styles.small, { color: colors.muted }]}>Rekor {best}</Text>
        </View>
        <View style={styles.scoreBox} accessibilityLabel={`Puan ${state.score}`}>
          <Text style={[styles.score, { color: colors.ink }]}>{state.score}</Text>
          {lastMove && lastMove.result.points > 0 ? (
            <Animated.Text key={lastMove.id} entering={FadeInUp.duration(220)} exiting={FadeOut} style={[styles.gain, { color: colors.accent }]}>
              +{lastMove.result.points}
              {lastWords.length > 1 ? ` · ${lastWords.length} kelime` : ""}
            </Animated.Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setPanel((value) => (value === "closed" ? "open" : "closed"))}
          accessibilityRole="button"
          accessibilityState={{ expanded: panel !== "closed" }}
          style={[styles.toggle, { borderColor: colors.line }]}
          hitSlop={8}
        >
          <Text style={[styles.small, { color: colors.ink }]}>Ayarlar</Text>
        </Pressable>
      </View>

      <Text style={[styles.words, { color: colors.accent }]} accessibilityLiveRegion="polite">
        {notice ?? (lastWords.length > 0 ? lastWords.map((w) => w.word).join(" · ") : " ")}
      </Text>

      <View ref={boardRef} onLayout={measureBoard} style={[styles.board, { gap: GAP }]} accessibilityLabel={`${size} satır ${size} sütunluk tahta`}>
        {state.board.map((row, r) => (
          <View key={r} style={[styles.row, { gap: GAP }]}>
            {row.map((letter, c) => {
              const key = `${r}:${c}`;
              const ghost = ghostKeys.has(key);
              const placeable = selected !== null && canPlaceAt(selected, r, c);
              return (
                <Pressable
                  key={c}
                  onPress={() => (selected !== null ? (place(selected, r, c) ? undefined : buzz("fail")) : undefined)}
                  accessibilityLabel={`Satır ${r + 1}, sütun ${c + 1}, ${letter ?? "boş"}${placeable ? ", seçili parça buraya konabilir" : ""}`}
                  style={[
                    styles.cell,
                    {
                      width: cell,
                      height: cell,
                      borderRadius: Math.max(4, cell * 0.2),
                      backgroundColor: letter ? colors.tile : ghost ? colors.ghost : colors.surface,
                      borderColor: placeable ? colors.accent : colors.line,
                      borderWidth: placeable ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.cellLetter, { fontSize: cell * 0.5, color: letter ? colors.tileInk : colors.accent }]}>
                    {letter ?? (ghost ? ghostLetters.get(key) : "")}
                  </Text>
                  {flashKeys.has(key) ? (
                    <Animated.View exiting={ZoomOut.duration(240)} style={[StyleSheet.absoluteFill, styles.flash, { backgroundColor: colors.clear, borderRadius: Math.max(4, cell * 0.2) }]}>
                      <Text style={[styles.cellLetter, { fontSize: cell * 0.5, color: colors.tileInk }]}>{flashKeys.get(key)}</Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.tray}>
        {state.tray.map((piece, slot) => (
          <TraySlot
            key={piece.id}
            piece={piece}
            slot={slot}
            cell={cell}
            slotSize={slotSize}
            trayCell={trayCell}
            trayGap={trayGap}
            colors={colors}
            selected={selected === slot}
            hidden={dragSlot === slot}
            ghostSlot={ghostSlot}
            setRef={(view) => {
              slotRefs.current[slot] = view;
            }}
            onSelect={() => setSelected((current) => (current === slot ? null : slot))}
            drag={{ dragX, dragY, dragging, boardX, boardY, lastRow, lastCol, step, onDragStart, onHover, onDrop, finishDrag }}
          />
        ))}
      </View>

      {dragPiece ? (
        <Animated.View pointerEvents="none" style={[styles.preview, previewStyle]}>
          <PieceView piece={dragPiece} cell={cell} gap={GAP} colors={colors} />
        </Animated.View>
      ) : null}

      {tutorial && !state.over && panel === "closed" ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityLiveRegion="polite">
          <Text style={[styles.cardText, { color: colors.ink }]}>
            Bir parçayı sürükleyip tahtaya bırak. Yan yana ya da alt alta 4 harflik bir kelime kurunca kelime silinir. Dokunarak da
            seçip yerleştirebilirsin.
          </Text>
          <Pressable onPress={dismissTutorial} accessibilityRole="button" style={[styles.button, { backgroundColor: colors.ink }]}>
            <Text style={[styles.buttonText, { color: colors.canvas }]}>Anladım</Text>
          </Pressable>
        </View>
      ) : null}

      {panel !== "closed" ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityViewIsModal>
          {panel === "open" ? (
            <>
              <Text style={[styles.overTitle, { color: colors.ink }]}>Ayarlar</Text>
              <Pressable
                onPress={() => updateSettings({ haptics: !haptics })}
                accessibilityRole="switch"
                accessibilityState={{ checked: haptics }}
                accessibilityLabel="Titreşim"
                style={styles.settingRow}
              >
                <Text style={[styles.cardText, { color: colors.ink }]}>Titreşim</Text>
                <Text style={[styles.cardText, { color: colors.accent, fontWeight: "700" }]}>{haptics ? "Açık" : "Kapalı"}</Text>
              </Pressable>
              <Text style={[styles.small, { color: colors.muted }]}>
                Rekor {records.best} · {records.games} oyun · {records.words} kelime
                {records.longestWord > 0 ? ` · en uzun ${records.longestWord} harf` : ""}
              </Text>
              <View style={styles.actions}>
                <Pressable onPress={() => setPanel("confirm-new")} accessibilityRole="button" style={[styles.button, styles.outline, { borderColor: colors.ink }]}>
                  <Text style={[styles.buttonText, { color: colors.ink }]}>Yeni oyun</Text>
                </Pressable>
                <Pressable onPress={() => setPanel("confirm-erase")} accessibilityRole="button" style={[styles.button, styles.outline, { borderColor: colors.ink }]}>
                  <Text style={[styles.buttonText, { color: colors.ink }]}>Kayıtlı verileri sil</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setPanel("closed")} accessibilityRole="button" style={[styles.button, { backgroundColor: colors.ink }]}>
                <Text style={[styles.buttonText, { color: colors.canvas }]}>Kapat</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.overTitle, { color: colors.ink }]}>{panel === "confirm-new" ? "Yeni oyun başlasın mı?" : "Veriler silinsin mi?"}</Text>
              <Text style={[styles.cardText, { color: colors.muted }]}>
                {panel === "confirm-new"
                  ? `Bu oyun ${state.score} puanla bitirilecek ve skoru rekorlarına işlenecek.`
                  : "Kayıtlı oyun, rekorlar, istatistikler ve ayarlar bu cihazdan silinecek. Bu işlem geri alınamaz."}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    if (panel === "confirm-new") restart();
                    else eraseAll();
                    setPanel("closed");
                  }}
                  accessibilityRole="button"
                  style={[styles.button, { backgroundColor: colors.ink }]}
                >
                  <Text style={[styles.buttonText, { color: colors.canvas }]}>{panel === "confirm-new" ? "Yeni oyun" : "Sil"}</Text>
                </Pressable>
                <Pressable onPress={() => setPanel("open")} accessibilityRole="button" style={[styles.button, styles.outline, { borderColor: colors.ink }]}>
                  <Text style={[styles.buttonText, { color: colors.ink }]}>Vazgeç</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : null}

      {state.over && panel === "closed" ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityViewIsModal>
          <Text style={[styles.overTitle, { color: colors.ink }]}>Oyun bitti</Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Hiçbir parça sığmıyor. Puan {state.score} · {state.wordCount} kelime · rekor {best}
            {records.bestAssisted > 0 ? ` · destekli rekor ${records.bestAssisted}` : ""}
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={restart} accessibilityRole="button" style={[styles.button, { backgroundColor: colors.ink }]}>
              <Text style={[styles.buttonText, { color: colors.canvas }]}>Yeniden oyna</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Share.share({ message: shareText(state.score, state.wordCount, meta.longestWord) }).catch(() => undefined);
              }}
              accessibilityRole="button"
              style={[styles.button, styles.outline, { borderColor: colors.ink }]}
            >
              <Text style={[styles.buttonText, { color: colors.ink }]}>Sonucu paylaş</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

type DragBindings = {
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragging: SharedValue<number>;
  boardX: SharedValue<number>;
  boardY: SharedValue<number>;
  lastRow: SharedValue<number>;
  lastCol: SharedValue<number>;
  step: number;
  onDragStart: (slot: number) => void;
  onHover: (slot: number, row: number, col: number) => void;
  onDrop: (slot: number, row: number, col: number) => void;
  finishDrag: () => void;
};

type TraySlotProps = {
  piece: Piece;
  slot: number;
  cell: number;
  slotSize: number;
  trayCell: number;
  trayGap: number;
  colors: Palette;
  selected: boolean;
  hidden: boolean;
  ghostSlot: number | null;
  setRef: (view: ViewType | null) => void;
  onSelect: () => void;
  drag: DragBindings;
};

function TraySlot({ piece, slot, cell, slotSize, trayCell, trayGap, colors, selected, hidden, setRef, onSelect, drag }: TraySlotProps) {
  const { rows, cols } = pieceSize(piece);
  const width = cols * drag.step - GAP;
  const height = rows * drag.step - GAP;
  // Önizleme parmağın biraz üstünde durur; parmak parçayı kapatmasın.
  const lift = cell * 0.9;
  const { dragX, dragY, dragging, boardX, boardY, lastRow, lastCol, step, onDragStart, onHover, onDrop, finishDrag } = drag;

  const pan = usePanGesture({
    minDistance: 3,
    onActivate: (event) => {
      "worklet";
      dragX.set(event.absoluteX - width / 2);
      dragY.set(event.absoluteY - height - lift);
      dragging.set(1);
      scheduleOnRN(onDragStart, slot);
    },
    onUpdate: (event) => {
      "worklet";
      dragX.set(event.absoluteX - width / 2);
      dragY.set(event.absoluteY - height - lift);
      const col = Math.round((dragX.get() - boardX.get()) / step);
      const row = Math.round((dragY.get() - boardY.get()) / step);
      if (row !== lastRow.get() || col !== lastCol.get()) {
        lastRow.set(row);
        lastCol.set(col);
        scheduleOnRN(onHover, slot, row, col);
      }
    },
    onDeactivate: (event) => {
      "worklet";
      if (event.canceled) scheduleOnRN(finishDrag);
      else scheduleOnRN(onDrop, slot, lastRow.get(), lastCol.get());
    },
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: () => onSelect() });
  const gesture = useCompetingGestures(pan, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={setRef}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Parça ${slot + 1}: ${describePiece(piece)}`}
        accessibilityHint="Seçmek için iki kez dokun, sonra tahtada bir hücre seç."
        accessibilityState={{ selected }}
        accessibilityActions={[{ name: "activate" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "activate") onSelect();
        }}
        style={[
          styles.slot,
          {
            width: slotSize,
            height: Math.min(slotSize, trayCell * 4 + trayGap * 3 + 20),
            borderColor: selected ? colors.accent : "transparent",
            backgroundColor: selected ? colors.accentSoft : "transparent",
            opacity: hidden ? 0.15 : 1,
          },
        ]}
      >
        <PieceView piece={piece} cell={trayCell} gap={trayGap} colors={colors} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", paddingHorizontal: 16, gap: 10 },
  header: { width: "100%", maxWidth: 520, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  brand: { fontSize: 14, fontWeight: "700", letterSpacing: 2.5 },
  small: { fontSize: 12 },
  scoreBox: { alignItems: "center", minWidth: 90 },
  score: { fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"] },
  gain: { fontSize: 13, fontWeight: "700" },
  toggle: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, minHeight: 32, justifyContent: "center" },
  words: { minHeight: 20, fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  board: { alignItems: "center" },
  row: { flexDirection: "row" },
  cell: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cellLetter: { fontWeight: "700" },
  flash: { alignItems: "center", justifyContent: "center" },
  tray: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: TRAY_GAP, marginTop: 8 },
  slot: { alignItems: "center", justifyContent: "center", borderWidth: 2, borderRadius: 16 },
  preview: { position: "absolute", left: 0, top: 0 },
  card: { position: "absolute", left: 16, right: 16, bottom: 24, maxWidth: 520, alignSelf: "center", borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  cardText: { fontSize: 14, lineHeight: 20 },
  overTitle: { fontSize: 22, fontWeight: "700" },
  button: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 18, minHeight: 44, justifyContent: "center" },
  buttonText: { fontSize: 15, fontWeight: "700" },
  outline: { borderWidth: 1.5, backgroundColor: "transparent" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 },
});
