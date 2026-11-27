import type { Piece } from "@quadro/words-engine";
import { StyleSheet, Text, View } from "react-native";

import type { Palette } from "../theme";

export function pieceSize(piece: Piece): { rows: number; cols: number } {
  return {
    rows: Math.max(...piece.cells.map((c) => c.dr)) + 1,
    cols: Math.max(...piece.cells.map((c) => c.dc)) + 1,
  };
}

/** Okuma sırasındaki harfler ve şekil: ekran okuyucu etiketi için. */
export function describePiece(piece: Piece): string {
  const { rows, cols } = pieceSize(piece);
  const letters = piece.cells.map((c) => c.letter).join(" ");
  const shape = piece.cells.length === 1 ? "tek harf" : rows === 1 ? "yatay" : cols === 1 ? "dikey" : "köşeli";
  return `${letters}, ${shape}`;
}

type Props = { piece: Piece; cell: number; gap: number; colors: Palette; dimmed?: boolean };

/** Parçayı verilen hücre boyutunda çizer; tepside küçük, sürüklerken tahta boyutunda. */
export function PieceView({ piece, cell, gap, colors, dimmed = false }: Props) {
  const { rows, cols } = pieceSize(piece);
  return (
    <View style={{ width: cols * cell + (cols - 1) * gap, height: rows * cell + (rows - 1) * gap, opacity: dimmed ? 0.35 : 1 }}>
      {piece.cells.map((c, index) => (
        <View
          key={index}
          style={[
            styles.tile,
            {
              left: c.dc * (cell + gap),
              top: c.dr * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: Math.max(4, cell * 0.2),
              backgroundColor: colors.tile,
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: cell * 0.5, color: colors.tileInk }]}>{c.letter}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { position: "absolute", alignItems: "center", justifyContent: "center" },
  letter: { fontWeight: "700" },
});
