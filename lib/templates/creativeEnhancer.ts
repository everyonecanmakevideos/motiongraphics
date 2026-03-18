/**
 * Creative Enhancement Layer
 *
 * Sits between intentAnalyzer and resolver in the pipeline.
 * Takes structurally correct but visually bland params and
 * upgrades them with better colors, backgrounds, animations,
 * and composition choices — without changing content or templateId.
 *
 * Uses gpt-4o-mini for fast, cheap aesthetic judgment.
 * Falls back to original params on any failure.
 */

import OpenAI from "openai";
import { SERVER_TEMPLATE_REGISTRY } from "../../src/templates/registry-server";
import type { IntentResult } from "./resolver";
import type { MultiSceneResult, SceneDefinition } from "./sceneTypes";
import { isCompositeScene } from "./sceneTypes";
import type { AnalyzerResult } from "../pipeline/intentAnalyzer";
import { isMultiSceneResult } from "../pipeline/intentAnalyzer";

// ── LLM System Prompt ────────────────────────────────────────────────────────

const CREATIVE_SYSTEM_PROMPT = `You are a senior motion graphics art director. You receive a user's original prompt and the raw template params chosen by an intent analyzer. Your job is to ELEVATE the visual design while keeping the content intact.

You are NOT changing what the video says or which template it uses. You are making it LOOK better.

INPUT: You receive JSON with:
- "originalPrompt": the user's raw text
- "templateId": the chosen template (DO NOT CHANGE)
- "params": the current parameter values
- "schemaFields": which fields exist on this template's schema and their types/enums

OUTPUT: Return ONLY a JSON object with:
- "enhancedParams": an object containing ONLY the aesthetic fields you want to improve. Omit any field you are NOT changing. Do NOT include content fields (text, data, iconId). We will merge your changes over the originals.
- "changes": array of strings describing what you changed and why

DESIGN PRINCIPLES:

1. MOOD DETECTION — Read the original prompt for emotional/thematic signals.
   Each mood below has multiple BACKGROUND VARIANTS. Pick the one that best fits the prompt's specific tone. Do NOT always pick Variant A — choose based on sub-theme.

   ── TECH / AI / DIGITAL ──
   Keywords: "tech", "AI", "cyber", "digital", "code", "dev", "software", "hack", "data", "algorithm"
   Variant A (Matrix): gradient #0A0A1A → #0D2818, direction to-bottom, accent #00FF88
   Variant B (Neural): grain baseColor #0A0A1F, grainOpacity 0.08, accent #4FC3F7
   Variant C (Hacker): gradient #000000 → #0A1A0A, direction to-bottom, accent #39FF14
   Variant D (AI Glow): gradient #0F0520 → #1A0A3A, direction radial, accent #A855F7

   ── SCI-FI / FUTURISTIC / SPACE ──
   Keywords: "sci-fi", "space", "galaxy", "alien", "mars", "cosmic", "nebula", "interstellar", "future", "spacecraft"
   Variant A (Deep Space): gradient #020010 → #0A0030, direction radial, accent #7C3AED
   Variant B (Nebula): gradient #1A0028 → #0A1A3A, direction to-bottom-right, accent #E879F9
   Variant C (Mars Colony): gradient #1A0A00 → #2A1500, direction to-bottom, accent #F97316
   Variant D (Starfield): grain baseColor #050515, grainOpacity 0.10, accent #60A5FA

   ── NEON / CYBERPUNK / GLOW ──
   Keywords: "neon", "cyberpunk", "glow", "electric", "nightlife", "club", "rave", "synth", "retrowave"
   Variant A (Hot Pink): gradient #1A0020 → #2A0040, direction to-bottom-right, accent #FF00FF
   Variant B (Electric Blue): gradient #000A1A → #001A3A, direction radial, accent #00D4FF
   Variant C (Toxic Green): gradient #0A0A00 → #1A2A00, direction to-bottom, accent #ADFF2F
   Variant D (Dual Neon): stripe baseColor #0A001A, stripeColor #FF006620, angle 35, density sparse, accent #FF0066

   ── PREMIUM / LUXURY / ELEGANT ──
   Keywords: "premium", "luxury", "elegant", "exclusive", "gold", "high-end", "vip", "prestige", "opulent"
   Variant A (Black Gold): gradient #0A0A0A → #1A1508, direction to-bottom-right, accent #D4AF37
   Variant B (Champagne): grain baseColor #0F0A05, grainOpacity 0.06, accent #C9A96E
   Variant C (Platinum): gradient #0A0A10 → #1A1A28, direction to-bottom, accent #C0C0C0
   Variant D (Rose Gold): gradient #1A0A0A → #2A1515, direction to-bottom-right, accent #E8A598

   ── STARTUP / LAUNCH / GROWTH ──
   Keywords: "startup", "launch", "rocket", "grow", "scale", "disrupt", "mvp", "pitch", "venture"
   Variant A (Deep Blue): gradient #0D1B2A → #1B2838, direction radial, accent #FF6B35
   Variant B (Midnight Teal): gradient #0A1A20 → #152A30, direction to-bottom, accent #4FC3F7
   Variant C (Launch Pad): gradient #10101A → #1A2040, direction to-bottom-right, accent #818CF8
   Variant D (Hustle): stripe baseColor #0D1B2A, stripeColor #FF6B3510, angle 45, density sparse, accent #FF6B35

   ── CREATIVE / ART / PLAYFUL ──
   Keywords: "creative", "design", "art", "colorful", "fun", "playful", "party", "festival", "vibrant", "pop"
   Variant A (Purple Pop): gradient #1A0A2E → #2E1A47, direction to-bottom-right, accent #FF3E8A
   Variant B (Candy): gradient #1A0A20 → #0A1A2A, direction radial, accent #00D9FF
   Variant C (Carnival): stripe baseColor #1A0A2E, stripeColor #FF3E8A15, angle 30, density normal, accent #FFD700
   Variant D (Graffiti): grain baseColor #1A1A0A, grainOpacity 0.10, accent #FF6B35

   ── CORPORATE / PROFESSIONAL / B2B ──
   Keywords: "business", "corporate", "professional", "enterprise", "B2B", "meeting", "report", "strategy"
   Variant A (Boardroom): gradient #111827 → #1F2937, direction to-bottom, accent #3B82F6
   Variant B (Executive): grain baseColor #111827, grainOpacity 0.05, accent #6366F1
   Variant C (Steel): gradient #0F1219 → #1E2330, direction to-bottom-right, accent #94A3B8
   Variant D (Blue Chip): gradient #0A1628 → #162844, direction radial, accent #38BDF8

   ── HEALTH / FITNESS / WELLNESS ──
   Keywords: "health", "fitness", "wellness", "medical", "pharma", "yoga", "gym", "nutrition", "therapy"
   Variant A (Healing Green): gradient #0A1A1A → #0A2A20, direction to-bottom, accent #10B981
   Variant B (Clinical): grain baseColor #0A1215, grainOpacity 0.05, accent #06B6D4
   Variant C (Vitality): gradient #0A0A1A → #1A0A2A, direction to-bottom-right, accent #8B5CF6
   Variant D (Zen): gradient #0F1A15 → #1A2A20, direction radial, accent #86EFAC

   ── EDUCATION / LEARNING / KNOWLEDGE ──
   Keywords: "education", "learn", "course", "knowledge", "school", "university", "tutorial", "study"
   Variant A (Chalkboard): gradient #0F172A → #1E293B, direction to-bottom-right, accent #F59E0B
   Variant B (Campus): gradient #1A1A0A → #2A2A15, direction to-bottom, accent #FBBF24
   Variant C (Scholar): grain baseColor #0F172A, grainOpacity 0.06, accent #A78BFA
   Variant D (Library): gradient #1A1008 → #2A2010, direction to-bottom, accent #D97706

   ── MINIMAL / CLEAN / MODERN ──
   Keywords: "minimal", "clean", "simple", "modern", "sleek", "understated", "whitespace"
   Variant A (Ink): grain baseColor #111111, grainOpacity 0.04, accent #94A3B8
   Variant B (Charcoal): gradient #111111 → #1A1A1A, direction to-bottom, accent #E2E8F0
   Variant C (Fog): gradient #0F0F0F → #1C1C1C, direction radial, accent #CBD5E1
   Variant D (Shadow): gradient #0A0A0A → #171717, direction to-bottom-right, accent #F8FAFC

   ── NATURE / ECO / ORGANIC ──
   Keywords: "nature", "eco", "green", "organic", "earth", "sustainable", "forest", "plant", "garden"
   Variant A (Forest): gradient #0A1A0A → #152A15, direction to-bottom, accent #22C55E
   Variant B (Earth): grain baseColor #1A150A, grainOpacity 0.08, accent #A3E635
   Variant C (Ocean Breeze): gradient #0A1A1A → #0A2A2A, direction to-bottom-right, accent #34D399
   Variant D (Moss): gradient #0A150A → #1A2A10, direction radial, accent #86EFAC

   ── URGENT / SALE / CTA ──
   Keywords: "urgent", "sale", "deal", "offer", "CTA", "limited", "now", "flash", "hurry", "discount"
   Variant A (Red Alert): gradient #1A0A0A → #2A0A0A, direction to-bottom, accent #EF4444
   Variant B (Fire): gradient #1A0A00 → #2A1500, direction to-bottom-right, accent #F97316
   Variant C (Warning): stripe baseColor #1A0A0A, stripeColor #EF444415, angle 45, density normal, accent #FBBF24
   Variant D (Flash): gradient #1A1A00 → #2A2A00, direction radial, accent #EAB308

   ── CINEMATIC / MOVIE / DRAMATIC ──
   Keywords: "cinematic", "movie", "film", "dramatic", "epic", "trailer", "theatrical"
   Variant A (Noir): gradient #050510 → #0A0A20, direction to-bottom, accent #A855F7
   Variant B (Blockbuster): gradient #0A0510 → #1A1030, direction to-bottom-right, accent #4FC3F7
   Variant C (Golden Age): grain baseColor #0A0A05, grainOpacity 0.08, accent #D4AF37
   Variant D (Thriller): gradient #0A0000 → #1A0510, direction radial, accent #F43F5E

   ── VILLAGE / RUSTIC / VINTAGE ──
   Keywords: "village", "rustic", "vintage", "retro", "old", "classic", "antique", "nostalgic", "heritage", "traditional", "countryside"
   Variant A (Sepia): grain baseColor #1A1508, grainOpacity 0.10, accent #C8A96E
   Variant B (Farmhouse): gradient #1A150A → #2A2015, direction to-bottom, accent #D4A574
   Variant C (Parchment): gradient #151008 → #201A10, direction to-bottom-right, accent #B8860B
   Variant D (Aged Wood): grain baseColor #12100A, grainOpacity 0.12, accent #8B7355

   ── OCEAN / MARINE / AQUATIC ──
   Keywords: "ocean", "sea", "marine", "underwater", "aqua", "deep sea", "coral", "wave", "surf"
   Variant A (Deep Ocean): gradient #000A1A → #001530, direction to-bottom, accent #0EA5E9
   Variant B (Coral Reef): gradient #0A1520 → #0A2030, direction radial, accent #FB923C
   Variant C (Arctic): gradient #0A1A2A → #152838, direction to-bottom-right, accent #67E8F9
   Variant D (Abyss): grain baseColor #000A15, grainOpacity 0.08, accent #22D3EE

   ── RETRO / 80s / SYNTHWAVE ──
   Keywords: "retro", "80s", "synthwave", "vaporwave", "outrun", "arcade", "pixel", "nostalgic-tech"
   Variant A (Sunset Grid): gradient #1A0030 → #300A40, direction to-bottom, accent #FF6EC7
   Variant B (VHS): grain baseColor #0A0020, grainOpacity 0.12, accent #00FFFF
   Variant C (Arcade): gradient #0A001A → #1A0A30, direction to-bottom-right, accent #FFD700
   Variant D (Chrome): stripe baseColor #1A0030, stripeColor #FF6EC720, angle 50, density sparse, accent #FF6EC7

   ── GOTHIC / DARK / HORROR ──
   Keywords: "gothic", "dark", "horror", "spooky", "halloween", "creepy", "haunted", "shadow", "mystery"
   Variant A (Midnight): gradient #050005 → #100010, direction to-bottom, accent #9333EA
   Variant B (Blood Moon): gradient #0A0000 → #1A0508, direction radial, accent #DC2626
   Variant C (Fog): grain baseColor #080808, grainOpacity 0.10, accent #6B7280
   Variant D (Grave): gradient #0A0A08 → #15150A, direction to-bottom-right, accent #A3A3A3

   ── FOOD / CULINARY / RESTAURANT ──
   Keywords: "food", "restaurant", "chef", "culinary", "recipe", "cooking", "bakery", "cafe", "dining"
   Variant A (Warm Kitchen): gradient #1A1008 → #2A1A10, direction to-bottom, accent #F59E0B
   Variant B (Fine Dining): gradient #0A0A0A → #1A1518, direction to-bottom-right, accent #E11D48
   Variant C (Rustic Table): grain baseColor #1A150A, grainOpacity 0.08, accent #D97706
   Variant D (Fresh): gradient #0A1A0A → #152A10, direction radial, accent #84CC16

   ── MUSIC / AUDIO / SOUND ──
   Keywords: "music", "audio", "sound", "beats", "DJ", "concert", "playlist", "album", "spotify", "podcast"
   Variant A (Vinyl): grain baseColor #0A0A0A, grainOpacity 0.10, accent #8B5CF6
   Variant B (Stage): gradient #0A001A → #1A0A30, direction radial, accent #F43F5E
   Variant C (Acoustic): gradient #1A1508 → #2A2015, direction to-bottom, accent #D4A574
   Variant D (EDM): gradient #0A0020 → #1A0040, direction to-bottom-right, accent #00FF88

   ── SPORTS / ATHLETIC / COMPETITION ──
   Keywords: "sports", "athletic", "gym", "football", "basketball", "race", "champion", "trophy", "competition"
   Variant A (Arena): gradient #0A0A1A → #1A1A30, direction to-bottom, accent #EF4444
   Variant B (Field): gradient #0A150A → #0A2A10, direction to-bottom-right, accent #22C55E
   Variant C (Victory): gradient #1A1500 → #2A2A00, direction radial, accent #EAB308
   Variant D (Energy): stripe baseColor #0A0A1A, stripeColor #EF444410, angle 40, density sparse, accent #F97316

   ── TRAVEL / ADVENTURE / EXPLORE ──
   Keywords: "travel", "adventure", "explore", "journey", "road trip", "wander", "destination", "tourism", "backpack"
   Variant A (Passport): gradient #0D1B2A → #1A2840, direction to-bottom-right, accent #F59E0B
   Variant B (Sunset Trail): gradient #1A0A05 → #2A1510, direction to-bottom, accent #FB923C
   Variant C (Mountain): grain baseColor #0A1015, grainOpacity 0.08, accent #38BDF8
   Variant D (Jungle): gradient #0A1A0A → #102A10, direction radial, accent #4ADE80

   ── FASHION / STYLE / BEAUTY ──
   Keywords: "fashion", "style", "beauty", "makeup", "model", "vogue", "couture", "runway", "glamour"
   Variant A (Vogue): gradient #0A0A0A → #1A101A, direction to-bottom-right, accent #EC4899
   Variant B (Haute): grain baseColor #0A0508, grainOpacity 0.06, accent #F472B6
   Variant C (Noir Chic): gradient #050505 → #151515, direction to-bottom, accent #E2E8F0
   Variant D (Glam): gradient #1A0A1A → #2A1530, direction radial, accent #D946EF

   ── WINTER / COLD / ICE ──
   Keywords: "winter", "snow", "ice", "cold", "frost", "arctic", "frozen", "blizzard", "christmas"
   Variant A (Frost): gradient #0A1520 → #152535, direction to-bottom, accent #67E8F9
   Variant B (Blizzard): grain baseColor #0F1520, grainOpacity 0.10, accent #E2E8F0
   Variant C (Aurora): gradient #001520 → #0A2A30, direction to-bottom-right, accent #34D399
   Variant D (Ice Crystal): gradient #050A1A → #0A1530, direction radial, accent #93C5FD

   ── WARM / SUMMER / SUNSET ──
   Keywords: "warm", "summer", "sunset", "sunrise", "golden hour", "tropical", "beach", "sunny", "heat"
   Variant A (Golden Hour): gradient #1A1005 → #2A1A08, direction to-bottom, accent #F59E0B
   Variant B (Tropical): gradient #1A0A08 → #2A1510, direction to-bottom-right, accent #FB923C
   Variant C (Ember): grain baseColor #1A0A05, grainOpacity 0.08, accent #EF4444
   Variant D (Palm): gradient #0A1A10 → #1A2A15, direction radial, accent #FBBF24

   If NO clear mood keywords, vary between these defaults:
   Default A: gradient #0F172A → #1E293B, direction to-bottom, warm white text (#F8FAFC), accent #3B82F6
   Default B: gradient #0A0A1A → #1A1A2E, direction to-bottom-right, accent #6366F1
   Default C: grain baseColor #0F172A, grainOpacity 0.06, accent #38BDF8
   Default D: gradient #111827 → #1F2937, direction radial, accent #818CF8

2. COLOR HARMONY — Never use colors in isolation:
   - Background, text, and accent must have intentional contrast
   - If background is dark gradient, text should be bright (#FFFFFF or #F8FAFC)
   - Accent color should POP against the background
   - For templates with multiple color fields (bar colors, card accents), use a cohesive palette
   - NEVER use the default combo (#0A0A0A solid + #FFFFFF + #4FC3F7) together
   - For bar-chart bars: use a harmonious set — e.g., (#3B82F6, #10B981, #F59E0B, #EF4444, #8B5CF6, #EC4899)
   - For pie-chart segments: similar cohesive palette with enough visual distinction
   - For card-layout cards: use the same accent color or analogous hues

3. BACKGROUND FORMAT — Use EXACTLY one of these JSON structures:
   { "type": "solid", "color": "#RRGGBB" }
   { "type": "gradient", "from": "#RRGGBB", "to": "#RRGGBB", "direction": "to-bottom" }
   { "type": "grain", "baseColor": "#RRGGBB", "grainOpacity": 0.08 }
   { "type": "stripe", "baseColor": "#RRGGBB", "stripeColor": "#RRGGBB", "angle": 45, "density": "normal" }

   Valid directions: "to-bottom", "to-right", "to-bottom-right", "to-top", "to-left", "radial"
   Valid densities: "sparse", "normal", "dense"
   grainOpacity range: 0.0 to 1.0

   BACKGROUND DESIGN RULES:
   - Prefer gradient over solid for most moods
   - Use grain for textured/premium/organic feels (grainOpacity 0.05-0.12)
   - Use stripe for energetic/dynamic/playful feels (angle 30-60, density "sparse" or "normal")
   - Gradient directions: "to-bottom" = grounding, "radial" = spotlight, "to-bottom-right" = dynamic forward motion, "to-right" = horizontal energy
   - NEVER output { "type": "solid", "color": "#0A0A0A" } or "#111111" unless the user explicitly asked for plain/simple/black

   VARIANT SELECTION RULES:
   - NEVER default to Variant A every time — read the prompt carefully and pick the variant that best matches
   - If the prompt mentions specific visual qualities (e.g., "grainy", "textured"), pick a grain variant
   - If the prompt mentions "stripes", "lines", "dynamic", pick a stripe variant where available
   - If the prompt has a warm sub-tone (gold, fire, sunset), pick variants with warm accent colors
   - If the prompt has a cool sub-tone (ice, ocean, calm), pick variants with cool accent colors
   - For multi-scene compositions, use different variants from the SAME mood category across scenes for visual coherence with variety

4. ANIMATION MATCHING — animations should match mood:
   - "premium"/"elegant"/"cinematic" → "blur-reveal" or "fade-in"
   - "tech"/"startup"/"launch" → "scale-pop" or "slide-up"
   - "fun"/"playful"/"creative" → "scale-pop"
   - "corporate"/"business" → "fade-in" or "slide-up"
   - "urgent"/"sale" → "scale-pop"
   - Avoid "none" unless user explicitly says "static" or "no animation"
   - For stat-counter and data-callout: PREFER "count-up" unless user explicitly asked for a different animation. Count-up is the signature animation for number-centric templates.
   - For templates with template-specific animations: "grow" for bar-chart, "spin" for pie-chart, "count-up" for stat-counter/data-callout, "progressive" for timeline/process-steps

5. COMPOSITION CHOICES — use template-specific style/layout enums intelligently:
   - hero-text style: "centered" for impact, "split" for editorial, "left-aligned" for corporate
   - hero-text decoration: "accent-line" for premium, "highlight-box" for emphasis, "underline" for editorial
   - cinematic-hero mood: "elegant" for luxury, "bold" for impact, "minimal" for tech
   - dynamic-showcase orbitStyle: "rings" = premium, "dots" = tech, "mixed" = playful
   - parallax-showcase depthIntensity: "strong" = dramatic, "subtle" = elegant, "medium" = default
   - parallax-showcase foregroundStyle: "geometric" = tech, "dots" = organic, "lines" = corporate
   - masked-text-reveal maskShape: "circle-expand" = spotlight, "diagonal-slice" = dynamic, "vertical-split" = dramatic
   - section-title accentStyle: "line-left" for corporate, "dot" for modern, "line-bottom" for emphasis
   - quote-highlight quoteMarkStyle: "large" for impact, "bar" for modern, "small" for subtle
   - icon-callout layout: "icon-top" for balanced, "icon-left" for editorial flow
   - card-layout columns: match to card count (2→2, 3→3, 4-6→3)
   - hero-text fontSize: "xlarge" for single-word impact, "medium" for longer headlines
   - hero-text fontWeight: "black" for bold statements, "normal" for elegant/light
   - card-layout cardPadding: "spacious" for premium, "compact" for data-dense
   - card-layout cardBorderRadius: 0 for sharp/corporate, 16-24 for soft/friendly
   - bar-chart gridLines: true for professional/corporate, false for minimal/clean
   - bar-chart barRadius: 0 for sharp charts, 8+ for soft/friendly
   - stat-counter/data-callout valueSize: "xlarge" for hero stat, "medium" in multi-scene
   - quote-highlight quoteStyle: "serif" for literary/elegant, "italic" for emphasis
   - timeline-scene markerStyle: "ring" for modern, "diamond" for premium
   - process-steps markerStyle: "pill" for modern, "square" for corporate
   - split-screen balance: "left-heavy" when left has more content, "right-heavy" vice versa
   - icon-callout accentColor: set to create subtle icon background circle
   - section-title fontSize: "xlarge" for dramatic, "medium" for secondary sections
   - bullet-list spacing: "relaxed" for few items, "tight" for many items
   - pie-chart strokeWidth: 2-3 for modern segmented look, 0 for classic
   - map-highlight connectionStyle: "dashed" for subtle, "dotted" for tech feel

6. TEMPLATE-SPECIFIC ENHANCEMENTS:
   - cinematic-hero: ALWAYS use gradient background. lightSweep should usually be true.
   - dynamic-showcase: glowColor should complement accentColor (slightly darker or analogous hue).
   - cinematic-transition: wipeColor should match the overall scene accent palette.
   - parallax-showcase: ALWAYS use gradient background. clip-reveal is the strongest entrance for this template.
   - data-callout: If trend is "up", use green trendUpColor. If "down", use red. If neutral, use subtle gray.
   - map-highlight: markerPulse=true adds energy. connectionLines=true for network/global-presence feel.

CRITICAL CONSTRAINTS:
- NEVER include templateId in enhancedParams
- NEVER include text content fields (headline, subheadline, title, quote, label, description, body, items, bars, segments, milestones, steps, lines, bullets, attribution, kicker, sectionLabel, vsText, problemLabel, solutionLabel, beforeLabel, afterLabel, beforeTitle, afterTitle, leftTitle, rightTitle)
- NEVER include numeric data (value, stat, duration, x, y coordinates)
- NEVER include iconId
- ONLY include aesthetic fields: colors (*Color), background, entranceAnimation, style/layout/mood enums, decoration, boolean toggles (lightSweep, markerPulse, donut, etc.)
- ALL hex colors MUST be exactly 7 characters: #RRGGBB
- Return ONLY valid JSON, no markdown code fences

EXAMPLE — for a hero-text template with a tech startup prompt:
{
  "enhancedParams": {
    "headlineColor": "#F8FAFC",
    "subheadlineColor": "#94A3B8",
    "accentColor": "#00FF88",
    "background": { "type": "gradient", "from": "#0A0A1A", "to": "#1A1A2E", "direction": "to-bottom-right" },
    "entranceAnimation": "scale-pop",
    "style": "centered",
    "decoration": "accent-line"
  },
  "changes": ["Upgraded to dark gradient bg for depth", "Neon green accent for tech feel", "scale-pop animation for energy"]
}`;

const MULTI_SCENE_ADDENDUM = `

MULTI-SCENE RULES:
- You receive an array of scenes. Enhance EACH scene's params.
- Ensure visual CONSISTENCY across scenes: shared color palette, similar gradient directions, complementary accents.
- The first scene sets the palette; subsequent scenes should harmonize with it.
- Adjacent scenes should share at least one accent color for cohesion.
- Return "enhancedScenes" array with one entry per scene (same order).
- Each entry: { "enhancedParams": {...}, "changes": [...] }
- enhancedParams should contain ONLY the fields you want to change (partial diff).
- For composite scenes: enhance BOTH the scene-level "background" AND each region's params (including region backgrounds).
- Each enhancedScenes entry for composite scenes should have: { "background": {...}, "regions": [{ "enhancedParams": {...} }], "changes": [...] }
- The scene-level background is the canvas behind all regions. Enhance it using the mood palette variants.
- Region-level backgrounds (inside params) should also be enhanced — they can differ from the scene background.
- For single-template scenes: you can include a top-level "background" field alongside "enhancedParams" to override the scene background.
- Return ONLY valid JSON.`;

// ── Enhanceable Schema Fields per Template ───────────────────────────────────
// Only aesthetic fields are listed. Content fields are deliberately excluded
// so the LLM cannot accidentally modify text, data, or structure.

const ENHANCEABLE_FIELDS: Record<string, Record<string, string>> = {
  "hero-text": {
    headlineColor: "hex color #RRGGBB",
    subheadlineColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB (optional)",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|blur-reveal|typewriter|none",
    subheadlineAnimation: "fade-in|slide-up|scale-pop|blur-reveal|none",
    style: "centered|left-aligned|split",
    decoration: "none|underline|highlight-box|accent-line",
    fontSize: "medium|large|xlarge",
    fontWeight: "normal|bold|black",
  },
  "bar-chart": {
    titleColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    valueColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "grow|fade-in|slide-up|none",
    orientation: "vertical|horizontal",
    barWidth: "20-120 (number in pixels)",
    barRadius: "0-16 (number, corner radius in pixels)",
    gridLines: "boolean (show horizontal grid lines behind bars)",
    gridColor: "hex color #RRGGBB (grid line color)",
  },
  "pie-chart": {
    titleColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "spin|fade-in|scale-pop|none",
    donut: "boolean",
    strokeWidth: "0-4 (number, gap between segments)",
    strokeColor: "hex color #RRGGBB (gap color, usually matches background)",
  },
  "stat-counter": {
    valueColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "count-up|fade-in|scale-pop|none",
    valueSize: "medium|large|xlarge",
    accentColor: "hex color #RRGGBB (optional, accent line under value)",
  },
  "kinetic-typography": {
    defaultColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|blur-reveal|typewriter|none",
    staggerStyle: "line-by-line|word-by-word|all-at-once",
    alignment: "center|left|right",
    fontWeight: "normal|bold|black",
    fontSize: "24-160 (number in pixels)",
    lineSpacing: "0.8-2.5 (number, line height multiplier)",
  },
  "icon-callout": {
    iconColor: "hex color #RRGGBB",
    headlineColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    iconSize: "40-300 (number in pixels)",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    layout: "icon-top|icon-left|icon-right",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    accentColor: "hex color #RRGGBB (optional, icon background circle color)",
  },
  "comparison-layout": {
    leftColor: "hex color #RRGGBB",
    rightColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    vsColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-in|scale-pop|none",
    dividerColor: "hex color #RRGGBB (VS divider line color)",
  },
  "timeline-scene": {
    lineColor: "hex color #RRGGBB",
    dotColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "progressive|fade-in|slide-up|none",
    markerStyle: "dot|ring|diamond",
  },
  "card-layout": {
    cardBackground: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    headingColor: "hex color #RRGGBB",
    bodyColor: "hex color #RRGGBB",
    iconColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    columns: "1|2|3",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    cardBorderRadius: "0-32 (number, corner radius in pixels)",
    cardBorderColor: "hex color #RRGGBB (optional, top border color)",
    cardPadding: "compact|normal|spacious",
  },
  "section-title": {
    titleColor: "hex color #RRGGBB",
    subtitleColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    accentStyle: "line-left|line-bottom|line-top|dot|none",
    alignment: "center|left",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|blur-reveal|none",
    fontSize: "medium|large|xlarge",
  },
  "bullet-list": {
    titleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    bulletColor: "hex color #RRGGBB",
    bulletStyle: "dot|checkmark|number|dash|arrow",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    spacing: "tight|normal|relaxed",
  },
  "quote-highlight": {
    quoteColor: "hex color #RRGGBB",
    attributionColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    quoteMarkStyle: "large|small|bar|none",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|blur-reveal|typewriter|none",
    quoteStyle: "sans|serif|italic",
  },
  "data-callout": {
    valueColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    contextColor: "hex color #RRGGBB",
    trendUpColor: "hex color #RRGGBB",
    trendDownColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "count-up|fade-in|scale-pop|none",
    valueSize: "medium|large|xlarge",
  },
  "feature-highlight": {
    iconColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    bulletColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    layout: "icon-left|icon-top|icon-right",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    iconBackground: "hex color #RRGGBB (optional, icon background circle color)",
  },
  "split-screen": {
    dividerStyle: "line|gap|none",
    dividerColor: "hex color #RRGGBB",
    leftAccentColor: "hex color #RRGGBB",
    rightAccentColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    bodyColor: "hex color #RRGGBB",
    iconColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-in|scale-pop|none",
    balance: "equal|left-heavy|right-heavy",
  },
  "problem-solution": {
    problemColor: "hex color #RRGGBB",
    solutionColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    transitionStyle: "fade-switch|slide-switch|side-by-side",
    accentColor: "hex color #RRGGBB (divider/separator accent)",
  },
  "before-after": {
    beforeColor: "hex color #RRGGBB",
    afterColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    revealStyle: "wipe|fade|split",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    accentColor: "hex color #RRGGBB (transition/divider accent)",
  },
  "process-steps": {
    stepColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    numberColor: "hex color #RRGGBB",
    connectorStyle: "arrow|line|dashed",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "progressive|fade-in|slide-up|none",
    markerStyle: "circle|square|pill",
  },
  "map-highlight": {
    markerColor: "hex color #RRGGBB",
    markerPulse: "boolean",
    titleColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    mapColor: "hex color #RRGGBB",
    connectionLines: "boolean",
    mapStyle: "world-dots|abstract-grid|minimal-outline",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|scale-pop|progressive|none",
    connectionStyle: "solid|dashed|dotted",
  },
  "masked-text-reveal": {
    headlineColor: "hex color #RRGGBB",
    subheadlineColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    maskShape: "wipe-left|wipe-right|circle-expand|diagonal-slice|vertical-split|horizontal-split",
    exitStyle: "fade|reverse-mask",
    fontSize: "medium|large|xlarge",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "cinematic-hero": {
    headlineColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    mood: "minimal|bold|elegant",
    revealDirection: "left|right|center|bottom",
    lightSweep: "boolean",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "cinematic-transition": {
    labelColor: "hex color #RRGGBB",
    wipeColor: "hex color #RRGGBB",
    transitionStyle: "wipe-horizontal|wipe-vertical|diagonal|iris|split",
    trailEffect: "boolean",
    speed: "slow|normal|fast",
    labelAnimation: "scale-pop|fade-in|spring",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    backgroundAfter: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "dynamic-showcase": {
    titleColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    glowColor: "hex color #RRGGBB",
    orbitStyle: "dots|rings|mixed",
    orbitCount: "3-8 (number)",
    layout: "center|left-focus",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "parallax-showcase": {
    titleColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    parallaxDirection: "left|right|up",
    depthIntensity: "subtle|medium|strong",
    foregroundStyle: "dots|lines|geometric",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|clip-reveal",
  },
};

// ── Content Fields Protection ────────────────────────────────────────────────
// These fields must NEVER be overwritten by the creative layer.

const CONTENT_FIELDS = new Set([
  "headline", "subheadline", "title", "subtitle", "quote", "attribution",
  "label", "sublabel", "description", "body", "items", "bars", "segments",
  "milestones", "steps", "lines", "bullets", "iconId", "value", "prefix",
  "suffix", "kicker", "sectionLabel", "vsText", "problemLabel", "solutionLabel",
  "beforeLabel", "afterLabel", "beforeTitle", "afterTitle", "leftTitle",
  "rightTitle", "stat", "context", "regions", "locations", "cards",
  "leftBullets", "rightBullets", "leftDescription", "rightDescription",
  "problemTitle", "solutionTitle", "problemBullets", "solutionBullets",
  "beforeBullets", "afterBullets", "trend", "trendValue",
  "duration", "templateId",
]);

// ── Param Sanitization ───────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * Validates and potentially fixes a hex color string.
 * Returns the valid hex string or undefined if unfixable.
 */
function sanitizeHex(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (HEX_RE.test(trimmed)) return trimmed;
  // Try to fix common issues: missing #, 3-char shorthand
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return "#" + trimmed;
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const r = trimmed[1], g = trimmed[2], b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return undefined;
}

/**
 * Deep-merges enhanced params over original params.
 * - Content fields are protected (never overwritten)
 * - Background objects are sanitized
 * - Hex colors are validated
 * - Arrays merge only aesthetic sub-fields per element
 */
function mergeAndSanitize(
  original: Record<string, unknown>,
  enhanced: Record<string, unknown>,
  templateId?: string,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...original };
  const aestheticFields = templateId ? ENHANCEABLE_FIELDS[templateId] : undefined;

  for (const [key, val] of Object.entries(enhanced)) {
    // Skip nulls, undefineds, and protected content fields
    if (val === undefined || val === null) continue;
    if (CONTENT_FIELDS.has(key)) continue;

    // If we know the template's aesthetic fields, only allow those
    if (aestheticFields && !aestheticFields[key] && key !== "backgroundAfter") continue;

    if ((key === "background" || key === "backgroundAfter") && typeof val === "object" && val !== null) {
      merged[key] = sanitizeBackground(
        val as Record<string, unknown>,
        original[key] as Record<string, unknown> | undefined,
      );
    } else if (typeof val === "string" && aestheticFields?.[key]?.includes("hex color")) {
      // Validate hex color fields
      const fixed = sanitizeHex(val);
      if (fixed) merged[key] = fixed;
      // else: keep original (don't overwrite with bad color)
    } else {
      merged[key] = val;
    }
  }

  return merged;
}

/**
 * Fixes common LLM mistakes with background objects.
 * Always returns a complete, valid background object.
 */
function sanitizeBackground(
  bg: Record<string, unknown>,
  original?: Record<string, unknown>,
): Record<string, unknown> {
  const type = bg.type;

  if (type === "gradient") {
    const from = sanitizeHex(bg.from) ?? sanitizeHex(bg.color) ?? sanitizeHex(original?.from) ?? "#0F172A";
    const to = sanitizeHex(bg.to) ?? sanitizeHex(bg.color) ?? sanitizeHex(original?.to) ?? "#1E293B";
    return {
      type: "gradient",
      from,
      to: to === from ? "#1E293B" : to, // Ensure from !== to
      direction: bg.direction ?? original?.direction ?? "to-bottom-right",
    };
  }

  if (type === "solid") {
    return {
      type: "solid",
      color: sanitizeHex(bg.color) ?? sanitizeHex(original?.color) ?? "#111111",
    };
  }

  if (type === "grain") {
    return {
      type: "grain",
      baseColor: sanitizeHex(bg.baseColor) ?? sanitizeHex(bg.color) ?? sanitizeHex(original?.baseColor) ?? "#0A0A1A",
      grainOpacity: typeof bg.grainOpacity === "number" ? Math.min(1, Math.max(0, bg.grainOpacity)) : 0.08,
    };
  }

  if (type === "stripe") {
    return {
      type: "stripe",
      baseColor: sanitizeHex(bg.baseColor) ?? sanitizeHex(bg.color) ?? sanitizeHex(original?.baseColor) ?? "#0A0A1A",
      stripeColor: sanitizeHex(bg.stripeColor) ?? sanitizeHex(original?.stripeColor) ?? "#1A1A2E",
      angle: typeof bg.angle === "number" ? bg.angle : 45,
      density: ["sparse", "normal", "dense"].includes(bg.density as string) ? bg.density : "normal",
    };
  }

  // Unknown type — return original if available, else safe default
  return original ?? { type: "solid", color: "#111111" };
}

/**
 * Given a failed Zod validation, strip the offending fields from enhanced
 * and re-merge with originals so partial enhancements still apply.
 */
function stripFailedFields(
  original: Record<string, unknown>,
  enhanced: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issues: any[],
  templateId?: string,
): Record<string, unknown> {
  // Collect top-level field names that failed
  const failedKeys = new Set<string>();
  for (const issue of issues) {
    const path = issue.path ?? [];
    if (path.length > 0) {
      failedKeys.add(String(path[0]));
    }
  }

  // Remove failed fields from enhanced, then re-merge
  const cleanedEnhanced: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(enhanced)) {
    if (!failedKeys.has(key)) {
      cleanedEnhanced[key] = val;
    }
  }

  console.log(
    `[creativeEnhancer] Stripping ${failedKeys.size} failed fields (${[...failedKeys].join(", ")}), keeping ${Object.keys(cleanedEnhanced).length} enhancements`,
  );

  return mergeAndSanitize(original, cleanedEnhanced, templateId);
}

// ── Single-Scene Enhancement ─────────────────────────────────────────────────

export async function enhanceCreatively(
  originalPrompt: string,
  intent: IntentResult,
): Promise<IntentResult> {
  // Skip low-confidence results (they'll fallback to legacy anyway)
  if (intent.confidence === "low") {
    return intent;
  }

  const entry = SERVER_TEMPLATE_REGISTRY[intent.templateId];
  if (!entry) {
    return intent;
  }

  const schemaFields = ENHANCEABLE_FIELDS[intent.templateId];
  if (!schemaFields) {
    console.warn("[creativeEnhancer] No enhanceable fields for template:", intent.templateId);
    return intent;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userMessage = JSON.stringify({
      originalPrompt,
      templateId: intent.templateId,
      params: intent.params,
      schemaFields,
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      input: [
        { role: "system", content: CREATIVE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (response.output[0] as any).content[0].text as string;
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.enhancedParams || typeof parsed.enhancedParams !== "object") {
      console.warn("[creativeEnhancer] Invalid response structure, using original");
      return intent;
    }

    // Merge enhanced over original (content-protected, sanitized)
    const mergedParams = mergeAndSanitize(
      intent.params as Record<string, unknown>,
      parsed.enhancedParams as Record<string, unknown>,
      intent.templateId,
    );

    // Validate merged params against the template's Zod schema
    let validation = entry.schema.safeParse(mergedParams);

    // If validation fails, strip the bad fields and retry with partial enhancements
    if (!validation.success) {
      const errors = validation.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; ");
      console.warn("[creativeEnhancer] First validation failed:", errors);

      const retryParams = stripFailedFields(
        intent.params as Record<string, unknown>,
        parsed.enhancedParams as Record<string, unknown>,
        validation.error.issues as any[],
        intent.templateId,
      );

      validation = entry.schema.safeParse(retryParams);
      if (!validation.success) {
        const retryErrors = validation.error.issues
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; ");
        console.warn("[creativeEnhancer] Retry also failed:", retryErrors, "— using original");
        return intent;
      }
    }

    console.log(
      "[creativeEnhancer] Enhanced",
      intent.templateId,
      "| Changes:",
      (parsed.changes || []).join(", "),
    );

    return {
      ...intent,
      params: validation.data as Record<string, unknown>,
    };
  } catch (err) {
    console.warn(
      "[creativeEnhancer] Enhancement failed, using original:",
      (err as Error).message?.slice(0, 200),
    );
    return intent;
  }
}

// ── Multi-Scene Enhancement ──────────────────────────────────────────────────

export async function enhanceMultiSceneCreatively(
  originalPrompt: string,
  result: MultiSceneResult,
): Promise<MultiSceneResult> {
  if (result.confidence === "low") {
    return result;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build scene descriptions with schema fields for the LLM
    const scenesForLLM = result.scenes.map((scene, i) => {
      if (isCompositeScene(scene)) {
        return {
          index: i,
          type: "composite",
          layout: scene.layout,
          background: scene.background,
          regions: scene.regions?.map((r) => ({
            templateId: r.templateId,
            params: r.params,
            schemaFields: ENHANCEABLE_FIELDS[r.templateId] || {},
          })),
        };
      }
      return {
        index: i,
        type: "single",
        templateId: scene.templateId,
        params: scene.params,
        schemaFields: ENHANCEABLE_FIELDS[scene.templateId || ""] || {},
      };
    });

    const userMessage = JSON.stringify({
      originalPrompt,
      scenes: scenesForLLM,
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      input: [
        { role: "system", content: CREATIVE_SYSTEM_PROMPT + MULTI_SCENE_ADDENDUM },
        { role: "user", content: userMessage },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (response.output[0] as any).content[0].text as string;
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.enhancedScenes || !Array.isArray(parsed.enhancedScenes)) {
      console.warn("[creativeEnhancer] Invalid multi-scene response, using original");
      return result;
    }

    // Apply enhancements to each scene, validating individually
    const enhancedScenes: SceneDefinition[] = result.scenes.map((scene, i) => {
      const enhancement = parsed.enhancedScenes[i];
      if (!enhancement) return scene;

      if (isCompositeScene(scene) && enhancement.regions) {
        // Enhance each region
        const enhancedRegions = scene.regions?.map((region, r) => {
          const regionEnhancement = enhancement.regions?.[r];
          if (!regionEnhancement?.enhancedParams) return region;

          const regionEntry = SERVER_TEMPLATE_REGISTRY[region.templateId];
          if (!regionEntry) return region;

          const mergedParams = mergeAndSanitize(
            (region.params || {}) as Record<string, unknown>,
            regionEnhancement.enhancedParams as Record<string, unknown>,
            region.templateId,
          );

          let validation = regionEntry.schema.safeParse(mergedParams);
          if (!validation.success) {
            const retryParams = stripFailedFields(
              (region.params || {}) as Record<string, unknown>,
              regionEnhancement.enhancedParams as Record<string, unknown>,
              validation.error.issues as any[],
              region.templateId,
            );
            validation = regionEntry.schema.safeParse(retryParams);
            if (!validation.success) {
              console.warn(`[creativeEnhancer] Scene ${i} region ${r} validation failed, keeping original`);
              return region;
            }
          }

          return { ...region, params: validation.data as Record<string, unknown> };
        });

        const enhancedBg = enhancement.background ?? scene.background;
        return { ...scene, regions: enhancedRegions, background: enhancedBg };
      }

      if (scene.templateId && enhancement.enhancedParams) {
        const sceneEntry = SERVER_TEMPLATE_REGISTRY[scene.templateId];
        if (!sceneEntry) return scene;

        const mergedParams = mergeAndSanitize(
          (scene.params || {}) as Record<string, unknown>,
          enhancement.enhancedParams as Record<string, unknown>,
          scene.templateId,
        );

        let validation = sceneEntry.schema.safeParse(mergedParams);
        if (!validation.success) {
          const retryParams = stripFailedFields(
            (scene.params || {}) as Record<string, unknown>,
            enhancement.enhancedParams as Record<string, unknown>,
            validation.error.issues as any[],
            scene.templateId,
          );
          validation = sceneEntry.schema.safeParse(retryParams);
          if (!validation.success) {
            console.warn(`[creativeEnhancer] Scene ${i} (${scene.templateId}) validation failed, keeping original`);
            return scene;
          }
        }

        const enhancedBg = enhancement.background ?? scene.background;
        return { ...scene, params: validation.data as Record<string, unknown>, background: enhancedBg };
      }

      return scene;
    });

    const changeCount = parsed.enhancedScenes.filter(
      (s: { changes?: string[] }) => (s?.changes?.length ?? 0) > 0,
    ).length;
    console.log(
      `[creativeEnhancer] Enhanced ${changeCount}/${result.scenes.length} scenes`,
    );

    return { ...result, scenes: enhancedScenes };
  } catch (err) {
    console.warn(
      "[creativeEnhancer] Multi-scene enhancement failed, using original:",
      (err as Error).message?.slice(0, 200),
    );
    return result;
  }
}

// ── Top-Level Dispatcher ─────────────────────────────────────────────────────

/**
 * Applies the creative enhancement layer to an intent result.
 * Handles both single-scene and multi-scene results.
 * NEVER throws — returns original intent on any failure.
 */
export async function applyCreativeLayer(
  originalPrompt: string,
  intent: AnalyzerResult,
): Promise<AnalyzerResult> {
  try {
    if (isMultiSceneResult(intent)) {
      return await enhanceMultiSceneCreatively(originalPrompt, intent);
    }
    return await enhanceCreatively(originalPrompt, intent as IntentResult);
  } catch (err) {
    console.warn(
      "[creativeEnhancer] Unexpected error, passing through original:",
      (err as Error).message,
    );
    return intent;
  }
}
