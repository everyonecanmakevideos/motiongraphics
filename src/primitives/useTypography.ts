import type React from "react";
import type { Typography } from "../templates/types";

const FONT_FAMILY_MAP: Record<string, string> = {
  inter: "'Inter', sans-serif",
  "clash-display": "'Plus Jakarta Sans', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  "playfair-display": "'Playfair Display', serif",
};

const WEIGHT_MAP: Record<string, number> = {
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

const LETTER_SPACING_MAP: Record<string, string> = {
  tight: "-0.03em",
  normal: "0em",
  wide: "0.05em",
};

const LINE_HEIGHT_MAP: Record<string, number> = {
  compact: 1.1,
  normal: 1.4,
  relaxed: 1.7,
};

/**
 * Resolve a Typography object into CSS properties.
 * Returns empty object when typography is undefined (preserves existing hardcoded styles).
 */
export function resolveTypography(typography?: Typography): React.CSSProperties {
  if (!typography) return {};

  return {
    fontFamily: FONT_FAMILY_MAP[typography.fontFamily] ?? "'Inter', sans-serif",
    fontWeight: WEIGHT_MAP[typography.weight] ?? 400,
    letterSpacing: LETTER_SPACING_MAP[typography.letterSpacing] ?? "0em",
    lineHeight: LINE_HEIGHT_MAP[typography.lineHeight] ?? 1.4,
    fontStyle: typography.fontStyle === "italic" ? "italic" : "normal",
  };
}
