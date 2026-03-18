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
  "cinematic-noir": {
    typography: { fontFamily: "inter", weight: "regular", letterSpacing: "normal", lineHeight: "relaxed" },
    motionStyle: { easing: "dramatic", speed: "slow", stagger: false, microMotion: true },
    effects: { shadow: "strong", glow: "none", blur: "transition" },
  },
  "retro-arcade": {
    typography: { fontFamily: "space-grotesk", weight: "black", letterSpacing: "wide", lineHeight: "compact" },
    motionStyle: { easing: "snappy", speed: "fast", stagger: true, microMotion: false },
    effects: { shadow: "none", glow: "neon", blur: "none" },
  },
  "editorial": {
    typography: { fontFamily: "clash-display", weight: "medium", letterSpacing: "normal", lineHeight: "relaxed" },
    motionStyle: { easing: "dramatic", speed: "slow", stagger: false, microMotion: true },
    effects: { shadow: "soft", glow: "none", blur: "none" },
  },
  "brutalist": {
    typography: { fontFamily: "space-grotesk", weight: "black", letterSpacing: "tight", lineHeight: "compact" },
    motionStyle: { easing: "snappy", speed: "fast", stagger: false, microMotion: false },
    effects: { shadow: "strong", glow: "none", blur: "none" },
  },
  "glass-morphism": {
    typography: { fontFamily: "inter", weight: "medium", letterSpacing: "normal", lineHeight: "normal" },
    motionStyle: { easing: "smooth", speed: "medium", stagger: false, microMotion: true },
    effects: { shadow: "none", glow: "subtle", blur: "subtle" },
  },
  "gradient-dream": {
    typography: { fontFamily: "clash-display", weight: "bold", letterSpacing: "wide", lineHeight: "normal" },
    motionStyle: { easing: "elastic", speed: "medium", stagger: true, microMotion: true },
    effects: { shadow: "none", glow: "subtle", blur: "none" },
  },
  "tech-terminal": {
    typography: { fontFamily: "space-grotesk", weight: "bold", letterSpacing: "normal", lineHeight: "compact" },
    motionStyle: { easing: "snappy", speed: "fast", stagger: true, microMotion: true },
    effects: { shadow: "none", glow: "neon", blur: "subtle" },
  },
  "warm-organic": {
    typography: { fontFamily: "inter", weight: "regular", letterSpacing: "normal", lineHeight: "relaxed" },
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
