import type { StylePreset, Typography, MotionStyle, Effects } from "../templates/types";

interface PresetDefaults {
  typography: Typography;
  motionStyle: MotionStyle;
  effects: Effects;
}

const PRESET_MAP: Record<StylePreset, PresetDefaults> = {
  "modern-clean": {
    typography: { fontFamily: "inter", weight: "medium", letterSpacing: "normal", lineHeight: "normal" },
    motionStyle: { easing: "smooth", speed: "medium", stagger: false, microMotion: false },
    effects: { shadow: "soft", glow: "none", blur: "none" },
  },
  "bold-startup": {
    typography: { fontFamily: "space-grotesk", weight: "bold", letterSpacing: "wide", lineHeight: "compact" },
    motionStyle: { easing: "snappy", speed: "fast", stagger: true, microMotion: false },
    effects: { shadow: "strong", glow: "subtle", blur: "none" },
  },
  "neon-tech": {
    typography: { fontFamily: "space-grotesk", weight: "bold", letterSpacing: "wide", lineHeight: "compact" },
    motionStyle: { easing: "elastic", speed: "fast", stagger: true, microMotion: true },
    effects: { shadow: "none", glow: "neon", blur: "subtle" },
  },
  "minimal-luxury": {
    typography: { fontFamily: "inter", weight: "regular", letterSpacing: "wide", lineHeight: "relaxed" },
    motionStyle: { easing: "smooth", speed: "slow", stagger: false, microMotion: true },
    effects: { shadow: "soft", glow: "none", blur: "none" },
  },
};

/**
 * Resolve a stylePreset into default typography/motionStyle/effects,
 * then merge with any explicit overrides. Explicit values always win.
 */
export function resolveStylePreset(
  stylePreset?: StylePreset,
  typography?: Typography,
  motionStyle?: MotionStyle,
  effects?: Effects,
): { typography?: Typography; motionStyle?: MotionStyle; effects?: Effects } {
  if (!stylePreset) {
    return { typography, motionStyle, effects };
  }

  const defaults = PRESET_MAP[stylePreset];
  return {
    typography: typography ?? defaults.typography,
    motionStyle: motionStyle ?? defaults.motionStyle,
    effects: effects ?? defaults.effects,
  };
}
