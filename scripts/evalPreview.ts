/* eslint-disable no-console */

type PreviewResponse =
  | {
      mode: "single";
      aspectRatio: string;
      durationSec: number;
      templateId: string;
      templateParams: Record<string, unknown>;
    }
  | {
      mode: "multi";
      aspectRatio: string;
      scenes: Array<Record<string, unknown>>;
      totalDurationFrames: number;
    }
  | { mode: "legacy"; error?: string }
  | { error: string };

type EvalSuite = {
  version: number;
  cases: Array<{
    id: string;
    prompt: string;
    aspect_ratio: string;
    duration_sec: number;
    expects: Record<string, unknown>;
  }>;
};

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function pick<T>(val: unknown, fallback: T): T {
  return (val as T) ?? fallback;
}

function hasAccentMotifSingle(params: Record<string, unknown>): boolean {
  // A cheap heuristic: if there's an accent color and either decoration-like props or visible effects/glow.
  const accentColor = typeof params.accentColor === "string" ? params.accentColor : "";
  const effects = isObject(params.effects) ? params.effects : null;
  const glow = effects && typeof effects.glow === "string" ? effects.glow : "none";
  const decoration = typeof params.decoration === "string" ? params.decoration : "none";
  return Boolean(accentColor) && (glow !== "none" || decoration !== "none");
}

function motionFastSingle(params: Record<string, unknown>): boolean {
  const motion = isObject(params.motionStyle) ? params.motionStyle : null;
  const speed = motion && typeof motion.speed === "string" ? motion.speed : "";
  return speed === "fast";
}

function highContrastPaletteSingle(params: Record<string, unknown>): boolean {
  const bg = isObject(params.background) ? params.background : null;
  const bgType = bg && typeof bg.type === "string" ? bg.type : "";
  const headlineColor = typeof params.headlineColor === "string" ? params.headlineColor : "";
  // We don't know final pixel colors, but we can check for white-ish text and non-solid bright bg.
  const whiteish = headlineColor.toUpperCase() === "#FFFFFF" || headlineColor.toUpperCase() === "#F8FAFC";
  return whiteish && (bgType === "gradient" || bgType === "grain" || bgType === "stripe" || bgType === "solid");
}

function avoidCardUISingle(params: Record<string, unknown>): boolean {
  // Our heuristic after the HeroText change:
  // centered single headline (no subheadline, no decoration) should avoid a “card UI”
  // even if effects.shadow is strong (because container shadow is suppressed).
  const hasSubheadline = typeof params.subheadline === "string" && params.subheadline.trim().length > 0;
  const decoration = typeof params.decoration === "string" ? params.decoration : "none";
  if (!hasSubheadline && decoration === "none") return true;
  return decoration !== "none";
}

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const suitePath = process.env.SUITE || "prompts/eval-suite.json";

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const suite = require(require("path").resolve(process.cwd(), suitePath)) as EvalSuite;

  let pass = 0;
  let fail = 0;

  for (const c of suite.cases) {
    const res = await fetch(baseUrl + "/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: c.prompt,
        aspect_ratio: c.aspect_ratio,
        duration_sec: c.duration_sec,
      }),
    });

    const data = (await res.json()) as PreviewResponse;

    const expects = c.expects ?? {};

    const notLegacy = expects.notLegacy === true ? (data as any).mode !== "legacy" : true;

    let highContrastPalette = true;
    let hasAccentMotif = true;
    let motionFast = true;
    let avoidCardUI = true;

    if (expects.highContrastPalette === true && (data as any).mode === "single") {
      highContrastPalette = highContrastPaletteSingle((data as any).templateParams);
    }
    if (expects.hasAccentMotif === true && (data as any).mode === "single") {
      hasAccentMotif = hasAccentMotifSingle((data as any).templateParams);
    }
    if (expects.motionFast === true && (data as any).mode === "single") {
      motionFast = motionFastSingle((data as any).templateParams);
    }
    if (expects.avoidCardUI === true && (data as any).mode === "single") {
      avoidCardUI = avoidCardUISingle((data as any).templateParams);
    }

    const ok = notLegacy && highContrastPalette && hasAccentMotif && motionFast && avoidCardUI;

    if (ok) {
      pass++;
      console.log("[PASS]", c.id, "→", (data as any).mode, (data as any).templateId ?? "");
    } else {
      fail++;
      console.log("[FAIL]", c.id, "→", data);
      console.log(" checks:", {
        notLegacy,
        highContrastPalette,
        hasAccentMotif,
        motionFast,
        avoidCardUI,
      });
    }
  }

  console.log("\nSummary:", { pass, fail, total: pass + fail });
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

