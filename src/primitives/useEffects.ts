import type { Effects } from "../templates/types";

export interface EffectStyles {
  /** CSS boxShadow value for content containers. */
  boxShadow: string;
  /** CSS filter for glow effect. */
  glowFilter: string;
  /** Whether to apply subtle backdrop blur on overlays. */
  subtleBlur: boolean;
  /** Whether to ramp blur during exit phase. */
  blurTransition: boolean;
}

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  // Global policy: avoid adding a card-like container shadow around
  // the entire template content. Individual templates can still render
  // their own element-level shadows when needed.
  soft: "none",
  strong: "none",
};

const DEFAULT_EFFECTS: EffectStyles = {
  boxShadow: "none",
  glowFilter: "none",
  subtleBlur: false,
  blurTransition: false,
};

/**
 * Resolve an Effects object into CSS-ready values.
 * @param effects - The effects configuration
 * @param accentColor - Optional accent color for glow (defaults to white)
 */
export function resolveEffects(effects?: Effects, accentColor?: string): EffectStyles {
  if (!effects) return DEFAULT_EFFECTS;

  const accent = accentColor ?? "#FFFFFF";

  let glowFilter = "none";
  if (effects.glow === "subtle") {
    glowFilter = `drop-shadow(0 0 8px ${accent}66)`;
  } else if (effects.glow === "neon") {
    glowFilter = `drop-shadow(0 0 12px ${accent}AA) drop-shadow(0 0 30px ${accent}55)`;
  }

  return {
    boxShadow: SHADOW_MAP[effects.shadow] ?? "none",
    glowFilter,
    subtleBlur: effects.blur === "subtle",
    blurTransition: effects.blur === "transition",
  };
}
