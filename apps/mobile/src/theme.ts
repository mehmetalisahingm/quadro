import type { ColorSchemeName } from "react-native";

/**
 * Web'deki tokens.css ile aynı temel renkler ve grup renkleri. Tam tasarım sistemi,
 * renk körlüğü paleti ve temalar #214'te.
 */
export type Palette = {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
  tile: string;
  tileInk: string;
  ghost: string;
  clear: string;
};

export function palette(scheme: ColorSchemeName | null | undefined): Palette {
  return scheme === "dark"
    ? {
        canvas: "#15171c",
        surface: "#1e2128",
        ink: "#ecebe6",
        muted: "#a2a4ac",
        line: "#343842",
        accent: "#5bbcc3",
        accentSoft: "rgba(91, 188, 195, 0.18)",
        tile: "#f2cf62",
        tileInk: "#332700",
        ghost: "rgba(91, 188, 195, 0.35)",
        clear: "#8ac79a",
      }
    : {
        canvas: "#f6f3ee",
        surface: "#fffefb",
        ink: "#20242d",
        muted: "#696b73",
        line: "#d9d4cc",
        accent: "#096a72",
        accentSoft: "rgba(9, 106, 114, 0.12)",
        tile: "#f2cf62",
        tileInk: "#332700",
        ghost: "rgba(9, 106, 114, 0.22)",
        clear: "#8ac79a",
      };
}
