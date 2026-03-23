import type { BackgroundConfig } from "./types";

export const CHART_CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function px(scale: number, value: number, min = 1): number {
  return Math.max(min, Math.round(value * scale));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = hex.replace("#", "");
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

export function alpha(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function mixHex(colorA: string, colorB: string, amount: number): string {
  const { r: r1, g: g1, b: b1 } = hexToRgb(colorA);
  const { r: r2, g: g2, b: b2 } = hexToRgb(colorB);
  const mix = (start: number, end: number) => Math.round(start + (end - start) * amount);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function getBackgroundBaseColor(background: BackgroundConfig): string {
  switch (background.type) {
    case "solid":
      return background.color;
    case "gradient":
      return background.from;
    case "grain":
    case "stripe":
    case "dots":
    case "grid":
    case "radial-glow":
      return background.baseColor;
    default:
      return "#0F172A";
  }
}

export function formatValue(value: number, prefix: string, suffix: string): string {
  return `${prefix}${new Intl.NumberFormat("en-US").format(value)}${suffix}`;
}

export function getChartSurface(background: BackgroundConfig, variant: "bar" | "comparison" = "comparison") {
  const backgroundBase = getBackgroundBaseColor(background);
  const isDarkSurface = relativeLuminance(backgroundBase) < 0.45;
  const panelBase = isDarkSurface
    ? mixHex(backgroundBase, "#020617", 0.38)
    : mixHex(backgroundBase, "#FFFFFF", 0.55);
  const panelHighlight = isDarkSurface
    ? mixHex(backgroundBase, "#FFFFFF", 0.1)
    : mixHex(backgroundBase, "#FFFFFF", 0.82);

  return {
    backgroundBase,
    isDarkSurface,
    panelBackground:
      variant === "bar"
        ? alpha(panelBase, isDarkSurface ? 0.44 : 0.72)
        : alpha(panelBase, isDarkSurface ? 0.48 : 0.76),
    panelBorder: isDarkSurface ? alpha(panelHighlight, 0.16) : alpha(mixHex(backgroundBase, "#0F172A", 0.18), 0.12),
    panelShadow: isDarkSurface
      ? "0 16px 44px rgba(2, 6, 23, 0.22)"
      : "0 18px 46px rgba(15, 23, 42, 0.08)",
  };
}

export function getComparisonChartLayout(
  preset: "minimal" | "editorial" | "presentation" | "social",
  isPortrait: boolean,
) {
  switch (preset) {
    case "editorial":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.92 : 0.82,
        valueWeightBoost: 100,
      };
    case "social":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.94 : 0.88,
        valueWeightBoost: 150,
      };
    case "minimal":
      return {
        titleAlign: "left" as const,
        maxPanelWidth: isPortrait ? 0.92 : 0.84,
        valueWeightBoost: 0,
      };
    case "presentation":
    default:
      return {
        titleAlign: "center" as const,
        maxPanelWidth: isPortrait ? 0.94 : 0.88,
        valueWeightBoost: 0,
      };
  }
}
