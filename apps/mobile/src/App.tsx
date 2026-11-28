import { BOARD_SIZE, ENGINE_VERSION, createBoard } from "@quadro/words-engine";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { palette } from "./theme";

/**
 * Geliştirme iskeleti (#203): yalnız ortak motorun mobilde çalıştığını gösterir.
 * Gerçek oyun ekranı #207'de, tasarım sistemi #214'te gelir; bu ekran yayına çıkmaz.
 */
export default function App() {
  const colors = palette(useColorScheme());
  const board = createBoard();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.canvas }]}>
        <StatusBar style="auto" />
        <Text style={[styles.brand, { color: colors.ink }]}>QUADRO WORDS</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Geliştirme iskeleti · motor {ENGINE_VERSION} · {BOARD_SIZE}×{BOARD_SIZE}
        </Text>
        <View style={styles.board} accessibilityLabel={`${BOARD_SIZE} satır ${BOARD_SIZE} sütunluk boş tahta`}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <View key={colIndex} style={[styles.cell, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                  <Text style={[styles.letter, { color: colors.ink }]}>{cell ?? ""}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 16 },
  brand: { fontSize: 18, fontWeight: "700", letterSpacing: 3 },
  meta: { fontSize: 13 },
  board: { gap: 4, marginTop: 12 },
  row: { flexDirection: "row", gap: 4 },
  cell: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  letter: { fontSize: 18, fontWeight: "700" },
});
