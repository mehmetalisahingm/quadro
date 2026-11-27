import type { ColorSchemeName } from "react-native";

/** Web'deki tokens.css ile aynı temel renkler; tam tasarım sistemi #214'te. */
export function palette(scheme: ColorSchemeName | null | undefined) {
  return scheme === "dark"
    ? { canvas: "#15171c", surface: "#1e2128", ink: "#ecebe6", muted: "#a2a4ac", line: "#343842" }
    : { canvas: "#f6f3ee", surface: "#fffefb", ink: "#20242d", muted: "#696b73", line: "#d9d4cc" };
}
