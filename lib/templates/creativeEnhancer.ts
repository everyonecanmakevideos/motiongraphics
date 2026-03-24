/**
 * Creative Enhancement Layer
 *
 * Sits between intentAnalyzer and resolver in the pipeline.
 * Takes structurally correct but visually bland params and
 * upgrades them with better colors, backgrounds, animations,
 * and composition choices — without changing content or templateId.
 *
 * Single LLM call returns creative enhancements plus a styleArchetype; deterministic
 * archetype mapping layers consistency on top (no separate judge call).
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
- "styleArchetype": REQUIRED. One of: "personal_story" | "product_progress" | "tech_terminal" | "news_alert" | "promo_ad" | "minimal_ui" | "neon_cyberpunk" | "default"
  - Classify the user's prompt theme (vlog/story → personal_story; order/status/progress UI → product_progress; tech/dev/loading → tech_terminal; breaking news/broadcast → news_alert; sale/offer/CTA ad → promo_ad; clean boxes/minimal UI → minimal_ui; neon/cyber → neon_cyberpunk; else default).
- "archetypeConfidence": optional number 0..1 (how sure you are of the archetype).
- "enhancedParams": an object containing ONLY the aesthetic fields you want to improve. Omit any field you are NOT changing. Do NOT include content fields (text, data, iconId). We will merge your changes over the originals.
- "changes": array of strings describing what you changed and why

The server applies deterministic styling on top of your archetype choice for consistency — still fill enhancedParams with a strong creative proposal.

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

7. STYLE PRESET — If the prompt has a clear vibe, set stylePreset:
   - "modern-clean" for clean, minimal, professional vibes
   - "bold-startup" for energetic, startup, launch vibes
   - "neon-tech" for tech, futuristic, cyberpunk vibes
   - "minimal-luxury" for premium, elegant, luxury vibes
   - "cinematic-noir" for movie, dramatic, film noir vibes (slow dramatic easing, strong shadows)
   - "retro-arcade" for gaming, retro, 80s vibes (snappy fast, neon glow)
   - "editorial" for news, magazine, storytelling (dramatic easing, clash-display font)
   - "brutalist" for bold raw statements (black weight, tight spacing, strong shadows)
   - "glass-morphism" for modern UI, translucent, futuristic (subtle glow + blur)
   - "gradient-dream" for creative, artistic, dreamy vibes (elastic motion, clash-display)
   - "tech-terminal" for hacker, code, developer vibes (snappy fast, neon glow + blur)
   - "warm-organic" for wellness, nature, calm vibes (smooth slow, soft shadows)
   Only set this if the mood is clear. It acts as a shorthand for typography + motion + effects.

8. TYPOGRAPHY — Set when specific typographic character is needed:
   - fontFamily: "inter" for clean/corporate, "clash-display" for bold/impact, "space-grotesk" for tech/modern
   - weight: "black" for hero statements, "bold" for headlines, "medium" for body-heavy, "regular" for elegant
   - letterSpacing: "tight" for dense impact, "normal" for balanced, "wide" for luxury/minimal
   - lineHeight: "compact" for headlines, "normal" for mixed, "relaxed" for body text
   ALL sub-fields are required when setting typography.

9. MOTION STYLE — Set to control animation feel:
   - easing: "smooth" for luxury/corporate, "snappy" for startup/CTA, "elastic" for playful/fun, "dramatic" for cinematic/film (slow start+end), "playful" for bouncy/overshoot
   - speed: "slow" for cinematic/elegant, "medium" for balanced, "fast" for urgent/energetic
   - stagger: true for templates with multiple items (cards, bullets, steps, bars)
   - microMotion: true for premium/cinematic templates (adds subtle floating)
   ALL sub-fields are required when setting motionStyle.

10. EFFECTS — Set for visual polish:
    - shadow: "soft" for most templates, "strong" for bold/dramatic, "none" for minimal
    - glow: "neon" ONLY for neon-tech style, "subtle" for premium, "none" for clean
    - blur: "transition" for cinematic exits, "subtle" for layered depth, "none" for clean
    ALL sub-fields are required when setting effects.

11. PACING PROFILE — Controls the rhythm of entrance/main/exit timing:
    - "dramatic": slow reveals, long entrance (35%), shorter main. Use for cinematic/movie/dramatic prompts.
    - "energetic": fast entrance (12%), long main display. Use for sale/CTA/urgent prompts.
    - "elegant": leisurely pace, balanced timing. Use for luxury/premium/editorial prompts.
    - "standard": default balanced 20/60/20 timing. Use when no strong mood signal.
    - "suspense": very long build-up (40%), short main. Use for reveals, mystery, trailer-style.
    Set this when the prompt has a clear emotional rhythm. Omit for default standard pacing.

12. SECONDARY MOTION — Continuous subtle motion during the main phase (keeps elements alive):
    - type "breathe": subtle scale pulsing (1.0→1.015→1.0). Best for luxury, elegant, cinematic.
    - type "float": gentle vertical bobbing. Best for playful, creative, dreamy.
    - type "drift": gentle horizontal swaying. Best for cinematic, editorial, organic.
    - type "rotate": subtle pendulum rotation. Best for retro, arcade, playful.
    - type "none": static during hold phase. Only for brutalist, minimal, or when stillness is intentional.
    - intensity: "subtle" (barely noticeable), "medium" (visible but gentle), "strong" (clear movement).
    ALL sub-fields (type + intensity) are required when setting secondaryMotion.
    STRONGLY RECOMMENDED for any video > 3 seconds — prevents the "frozen" look.

13. DECORATIVE THEME — Adds depth with background accent shapes:
    - "geometric": hollow circles + rotated squares + thin lines. Use for tech, premium, corporate.
    - "minimal-dots": scattered small dots at varying opacities. Use for modern, clean, minimal.
    - "light-streaks": diagonal gradient sweeps. Use for cinematic, dramatic, epic.
    - "corner-accents": L-shaped brackets in two corners. Use for editorial, corporate, formal.
    - "none": no decorative elements. Use for brutalist, minimal, or when background is already complex (stripe/grain).
    Set this to add visual depth. Works best with gradient or solid backgrounds. Avoid with stripe backgrounds.

DIVERSITY ENFORCEMENT — THIS IS MANDATORY:
- You MUST change the background from the input params. The intent analyzer sets bland defaults — your job is to replace them with mood-appropriate variants from the palettes above.
- NEVER return the same background you received. Always upgrade it using the mood variants above.
- NEVER output #FFFFFF as headlineColor/titleColor without considering warm alternatives: #F8FAFC (warm white), #E2E8F0 (cool gray-white), #FFF8E1 (cream), #F0FFF4 (mint white), #FFF0F5 (rose white). Pure #FFFFFF is only for high-contrast needs.
- NEVER output #4FC3F7 as accent color unless the prompt specifically calls for light blue/cyan. Each mood has its own accent — use it.
- If you find yourself picking Variant A for a mood, reconsider — Variant B/C/D often produce more distinctive results. Actively rotate through variants.
- Background type distribution guideline: gradient ~50%, grain ~25%, stripe ~15%, solid ~10%. Avoid overusing any one type.
- Text colors should reflect the mood: warm prompts get warm whites (#F8FAFC, #FFF8E1), cool prompts get cool whites (#E2E8F0, #F0F9FF), bold prompts get pure white or near-white.
- EVERY enhancement MUST include a background change and at least one text color change. If you only tweak one color, you are not doing your job.

CRITICAL CONSTRAINTS:
- NEVER include templateId in enhancedParams
- NEVER include text content fields (headline, subheadline, title, quote, label, description, body, items, bars, segments, milestones, steps, lines, bullets, attribution, kicker, sectionLabel, vsText, problemLabel, solutionLabel, beforeLabel, afterLabel, beforeTitle, afterTitle, leftTitle, rightTitle)
- NEVER include numeric data (value, stat, duration, x, y coordinates)
- NEVER include iconId
- ONLY include aesthetic fields: colors (*Color), background, entranceAnimation, style/layout/mood enums, decoration, boolean toggles (lightSweep, markerPulse, donut, etc.), stylePreset, typography, motionStyle, effects
- ALL hex colors MUST be exactly 7 characters: #RRGGBB
- stylePreset, typography, motionStyle, effects are OBJECTS/ENUMS — not hex colors
- Return ONLY valid JSON, no markdown code fences

EXAMPLE — Input: hero-text template with bland defaults (solid #111111 bg, #FFFFFF text, #4FC3F7 accent) for a "premium luxury watch brand reveal" prompt:
{
  "styleArchetype": "default",
  "archetypeConfidence": 0.85,
  "enhancedParams": {
    "headlineColor": "#FFF8E1",
    "subheadlineColor": "#C9A96E",
    "accentColor": "#D4AF37",
    "background": { "type": "grain", "baseColor": "#0F0A05", "grainOpacity": 0.06 },
    "entranceAnimation": "blur-reveal",
    "style": "centered",
    "decoration": "accent-line",
    "fontSize": "xlarge",
    "fontWeight": "normal",
    "stylePreset": "minimal-luxury",
    "typography": { "fontFamily": "inter", "weight": "regular", "letterSpacing": "wide", "lineHeight": "compact" },
    "motionStyle": { "easing": "dramatic", "speed": "slow", "stagger": false, "microMotion": true },
    "effects": { "shadow": "soft", "glow": "subtle", "blur": "transition" },
    "pacingProfile": "elegant",
    "secondaryMotion": { "type": "breathe", "intensity": "subtle" },
    "decorativeTheme": "geometric"
  },
  "changes": ["Replaced solid black with grain texture for premium feel", "Changed #FFFFFF to cream #FFF8E1 for warmth", "Gold accent #D4AF37 for luxury mood", "blur-reveal animation for elegant slow entrance", "minimal-luxury preset with wide letter spacing", "Elegant pacing for leisurely reveal", "Subtle breathe motion keeps elements alive", "Geometric decoratives add depth"]
}

EXAMPLE 2 — Input: stat-counter with bland defaults for a "neon cyberpunk gaming stats" prompt:
{
  "styleArchetype": "neon_cyberpunk",
  "archetypeConfidence": 0.95,
  "enhancedParams": {
    "valueColor": "#39FF14",
    "labelColor": "#00D4FF",
    "accentColor": "#FF00FF",
    "background": { "type": "gradient", "from": "#000000", "to": "#0A1A0A", "direction": "to-bottom" },
    "entranceAnimation": "count-up",
    "valueSize": "xlarge",
    "stylePreset": "tech-terminal",
    "typography": { "fontFamily": "space-grotesk", "weight": "bold", "letterSpacing": "wide", "lineHeight": "compact" },
    "motionStyle": { "easing": "snappy", "speed": "fast", "stagger": false, "microMotion": true },
    "effects": { "shadow": "none", "glow": "neon", "blur": "subtle" },
    "pacingProfile": "energetic",
    "secondaryMotion": { "type": "rotate", "intensity": "subtle" },
    "decorativeTheme": "minimal-dots"
  },
  "changes": ["Hacker-green value color for cyberpunk", "Matrix-style dark gradient background", "Neon glow + blur effect for electric feel", "Hot pink accent for cyberpunk contrast", "Energetic pacing for fast reveals", "Subtle rotate keeps numbers alive", "Minimal dots add tech depth"]
}

EXAMPLE 3 — Input: quote-highlight for a "dramatic movie trailer quote" prompt:
{
  "styleArchetype": "default",
  "archetypeConfidence": 0.8,
  "enhancedParams": {
    "quoteColor": "#F8FAFC",
    "attributionColor": "#A855F7",
    "accentColor": "#A855F7",
    "background": { "type": "gradient", "from": "#050510", "to": "#0A0A20", "direction": "to-bottom" },
    "entranceAnimation": "blur-reveal",
    "quoteStyle": "serif",
    "quoteMarkStyle": "large",
    "stylePreset": "cinematic-noir",
    "motionStyle": { "easing": "dramatic", "speed": "slow", "stagger": false, "microMotion": true },
    "effects": { "shadow": "strong", "glow": "none", "blur": "transition" },
    "pacingProfile": "suspense",
    "secondaryMotion": { "type": "drift", "intensity": "subtle" },
    "decorativeTheme": "light-streaks"
  },
  "changes": ["Noir gradient for cinematic depth", "Suspense pacing for long dramatic build", "Drift motion adds cinematic life", "Light streaks add epic visual depth", "Strong shadows for drama"]
}`;

const MULTI_SCENE_ADDENDUM = `

MULTI-SCENE RULES:
- You receive an array of scenes. Enhance EACH scene's params.
- Also return top-level "styleArchetype" (same enum as single-scene) and optional "archetypeConfidence" once for the whole prompt — classify the overall video theme.
- Ensure visual CONSISTENCY across scenes: shared color palette, similar gradient directions, complementary accents.
- The first scene sets the palette; subsequent scenes should harmonize with it.
- Adjacent scenes should share at least one accent color for cohesion.
- Return ONLY valid JSON in this shape:
  { "styleArchetype": "...", "archetypeConfidence": 0.0-1.0, "enhancedScenes": [ ... ] }
- "enhancedScenes" array with one entry per scene (same order).
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

const SHARED_CREATIVE_FIELDS: Record<string, string> = {
  stylePreset: "modern-clean|bold-startup|neon-tech|minimal-luxury|cinematic-noir|retro-arcade|editorial|brutalist|glass-morphism|gradient-dream|tech-terminal|warm-organic",
  typography: "{ fontFamily: inter|clash-display|space-grotesk, weight: regular|medium|bold|black, letterSpacing: tight|normal|wide, lineHeight: compact|normal|relaxed }",
  motionStyle: "{ easing: smooth|snappy|elastic|dramatic|playful, speed: slow|medium|fast, stagger: boolean, microMotion: boolean }",
  effects: "{ shadow: none|soft|strong, glow: none|subtle|neon, blur: none|subtle|transition }",
  pacingProfile: "dramatic|energetic|elegant|standard|suspense (controls entrance/main/exit phase timing ratios)",
  secondaryMotion: "{ type: breathe|float|drift|rotate|none, intensity: subtle|medium|strong } (continuous motion during main phase)",
  decorativeTheme: "geometric|minimal-dots|light-streaks|corner-accents|none (adds depth with decorative background elements)",
};

const ENHANCEABLE_FIELDS: Record<string, Record<string, string>> = {
  "hero-text": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    titleColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "spin|fade-in|scale-pop|none",
    donut: "boolean",
    strokeWidth: "0-4 (number, gap between segments)",
    strokeColor: "hex color #RRGGBB (gap color, usually matches background)",
  },
  "stat-counter": {
    ...SHARED_CREATIVE_FIELDS,
    valueColor: "hex color #RRGGBB",
    labelColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "count-up|fade-in|scale-pop|none",
    valueSize: "medium|large|xlarge",
    accentColor: "hex color #RRGGBB (optional, accent line under value)",
  },
  "kinetic-typography": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    leftColor: "hex color #RRGGBB",
    rightColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    vsColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-in|scale-pop|none",
    dividerColor: "hex color #RRGGBB (VS divider line color)",
  },
  "timeline-scene": {
    ...SHARED_CREATIVE_FIELDS,
    lineColor: "hex color #RRGGBB",
    dotColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    subtitleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    markerStyle: "dot|ring|diamond",
    // Typography hierarchy + spacing
    titleGapPx: "0-200 (number, pixels)",
    subtitleGapPx: "0-80 (number, pixels)",
    titleFontWeight: "regular|medium|bold|black",
    subtitleFontWeight: "regular|medium|bold|black",
    labelFontWeight: "regular|medium|bold|black",
    descriptionFontWeight: "regular|medium|bold|black",
    labelFontSizePx: "10-90 (number, pixels)",
    descriptionFontSizePx: "8-80 (number, pixels)",
    subtitleFontSizePx: "10-90 (number, pixels)",
    nodeSizePx: "14-120 (number, pixels)",
  },
  "card-layout": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    titleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    bulletColor: "hex color #RRGGBB",
    bulletStyle: "dot|checkmark|number|dash|arrow",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    spacing: "tight|normal|relaxed",
  },
  "quote-highlight": {
    ...SHARED_CREATIVE_FIELDS,
    quoteColor: "hex color #RRGGBB",
    attributionColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    quoteMarkStyle: "large|small|bar|none",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    entranceAnimation: "fade-in|slide-up|scale-pop|blur-reveal|typewriter|none",
    quoteStyle: "sans|serif|italic",
  },
  "data-callout": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    beforeColor: "hex color #RRGGBB",
    afterColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    revealStyle: "wipe|fade|split",
    entranceAnimation: "fade-in|slide-up|scale-pop|none",
    accentColor: "hex color #RRGGBB (transition/divider accent)",
  },
  "process-steps": {
    ...SHARED_CREATIVE_FIELDS,
    stepColor: "hex color #RRGGBB",
    titleColor: "hex color #RRGGBB",
    subtitleColor: "hex color #RRGGBB",
    textColor: "hex color #RRGGBB",
    descriptionColor: "hex color #RRGGBB",
    numberColor: "hex color #RRGGBB",
    connectorStyle: "arrow|line|dashed",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
    markerStyle: "circle|square|pill",
    // Typography hierarchy + spacing
    titleGapPx: "0-200 (number, pixels)",
    subtitleGapPx: "0-80 (number, pixels)",
    titleFontWeight: "regular|medium|bold|black",
    subtitleFontWeight: "regular|medium|bold|black",
    labelFontWeight: "regular|medium|bold|black",
    descriptionFontWeight: "regular|medium|bold|black",
    labelFontSizePx: "10-90 (number, pixels)",
    descriptionFontSizePx: "8-80 (number, pixels)",
    subtitleFontSizePx: "10-90 (number, pixels)",
    nodeSizePx: "20-140 (number, pixels)",
  },
  "map-highlight": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    headlineColor: "hex color #RRGGBB",
    subheadlineColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    maskShape: "wipe-left|wipe-right|circle-expand|diagonal-slice|vertical-split|horizontal-split",
    exitStyle: "fade|reverse-mask",
    fontSize: "medium|large|xlarge",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "cinematic-hero": {
    ...SHARED_CREATIVE_FIELDS,
    headlineColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    mood: "minimal|bold|elegant",
    revealDirection: "left|right|center|bottom",
    lightSweep: "boolean",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "cinematic-transition": {
    ...SHARED_CREATIVE_FIELDS,
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
    ...SHARED_CREATIVE_FIELDS,
    titleColor: "hex color #RRGGBB",
    accentColor: "hex color #RRGGBB",
    glowColor: "hex color #RRGGBB",
    orbitStyle: "dots|rings|mixed",
    orbitCount: "3-8 (number)",
    layout: "center|left-focus",
    background: "BackgroundSchema object (see BACKGROUND FORMAT above)",
  },
  "parallax-showcase": {
    ...SHARED_CREATIVE_FIELDS,
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

const DARK_NEAR: string = "#0B0B0F";
const LIGHT_NEAR: string = "#F8FAFC";

// These keys are expected to drive actual readable text color in templates.
// Accent colors/glows may legitimately be light even on light backgrounds.
const TEXT_COLOR_KEYS = new Set<string>([
  "headlineColor",
  "subheadlineColor",
  "titleColor",
  "subtitleColor",
  "textColor",
  "labelColor",
  "valueColor",
  "quoteColor",
  "attributionColor",
  "descriptionColor",
  "headingColor",
  "bodyColor",
  "bulletColor",
  "badgeColor",
  "problemColor",
  "solutionColor",
  "beforeColor",
  "afterColor",
  "leftColor",
  "rightColor",
  "vsColor",
  "accentColor", // sometimes used as text in certain templates
]);

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!HEX_RE.test(hex)) return null;
  const clean = hex.slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  // WCAG: convert sRGB -> linear and apply relative luminance.
  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function isLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Threshold tuned to catch "washed out / near-white" backgrounds and colors.
  return relativeLuminance(rgb) > 0.62;
}

function pickBackgroundHex(bg: unknown): string | undefined {
  if (!bg || typeof bg !== "object") return undefined;
  const b = bg as { type?: string; color?: unknown; from?: unknown; to?: unknown; baseColor?: unknown };

  if (b.type === "solid" && typeof b.color === "string") return b.color;
  if (b.type === "gradient" && typeof b.from === "string" && typeof b.to === "string") {
    // Sample by averaging the two ends (approx but deterministic).
    const a = hexToRgb(b.from);
    const c = hexToRgb(b.to);
    if (!a || !c) return undefined;
    const avg = (x: number, y: number) => Math.round((x + y) / 2);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return (
      "#" +
      toHex(avg(a.r, c.r)) +
      toHex(avg(a.g, c.g)) +
      toHex(avg(a.b, c.b))
    );
  }
  if (b.type === "grain" && typeof b.baseColor === "string") return b.baseColor;
  if (b.type === "stripe" && typeof b.baseColor === "string") return b.baseColor;
  return undefined;
}

function enforceContrastOnParams(params: Record<string, unknown>): Record<string, unknown> {
  const bgHex = pickBackgroundHex(params.background);
  if (!bgHex) return params;

  const bgIsLight = isLightHex(bgHex);
  if (!bgIsLight) {
    // Dark background: ensure text is not too dark.
    const out = { ...params };
    for (const key of TEXT_COLOR_KEYS) {
      const val = out[key];
      if (typeof val !== "string") continue;
      if (!HEX_RE.test(val)) continue;
      if (!isLightHex(val)) out[key] = LIGHT_NEAR;
    }
    return out;
  }

  // Light background: ensure text is not also light.
  const out = { ...params };
  for (const key of TEXT_COLOR_KEYS) {
    const val = out[key];
    if (typeof val !== "string") continue;
    if (!HEX_RE.test(val)) continue;
    if (isLightHex(val)) out[key] = DARK_NEAR;
  }
  return out;
}

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

// ── Style archetype (merged former “judge” pass) ─────────────────────────────
// Single LLM returns styleArchetype + enhancedParams; we deterministically
// layer archetype defaults on top so outputs stay consistent. Step-7-style
// domain rules can still run elsewhere in the pipeline.

const STYLE_ARCHETYPES = new Set([
  "personal_story",
  "product_progress",
  "tech_terminal",
  "news_alert",
  "promo_ad",
  "minimal_ui",
  "neon_cyberpunk",
  "default",
]);

export type StyleArchetype =
  | "personal_story"
  | "product_progress"
  | "tech_terminal"
  | "news_alert"
  | "promo_ad"
  | "minimal_ui"
  | "neon_cyberpunk"
  | "default";

function normalizeStyleArchetype(raw: unknown): StyleArchetype {
  if (typeof raw === "string" && STYLE_ARCHETYPES.has(raw)) {
    return raw as StyleArchetype;
  }
  return "default";
}

function promptPrefersDark(p: string): boolean {
  return (
    p.includes("dark mode") ||
    p.includes("dark theme") ||
    p.includes("in dark") ||
    p.includes("night mode") ||
    /\bdark\b/.test(p)
  );
}

function forceArchetypeForPrompt(prompt: string, rawStyleArchetype: unknown): StyleArchetype {
  const p = prompt.toLowerCase();
  // Educational / onboarding / SaaS explainer content should prefer a clean
  // UI-like look (light + calm palette) instead of tech-terminal defaults.
  if (/(education|learn|course|tutorial|study|onboarding|explainer|saas|software)/.test(p)) {
    return "minimal_ui";
  }
  return normalizeStyleArchetype(rawStyleArchetype);
}

function detectWarmBrownAccent(promptLower: string): boolean {
  return (
    promptLower.includes("brown") ||
    promptLower.includes("cocoa") ||
    promptLower.includes("chocolate") ||
    promptLower.includes("caramel") ||
    promptLower.includes("tan") ||
    promptLower.includes("umber") ||
    promptLower.includes("sepia") ||
    promptLower.includes("rust") ||
    promptLower.includes("earth")
  );
}

function detectOffwhite(promptLower: string): boolean {
  return (
    promptLower.includes("offwhite") ||
    promptLower.includes("off-white") ||
    promptLower.includes("cream") ||
    promptLower.includes("ivory") ||
    promptLower.includes("beige") ||
    promptLower.includes("ecru") ||
    promptLower.includes("warm white")
  );
}

function detectExplicitDarkBackground(promptLower: string): boolean {
  return (
    promptLower.includes("dark") ||
    promptLower.includes("black") ||
    promptLower.includes("charcoal") ||
    promptLower.includes("midnight") ||
    promptLower.includes("pitch black") ||
    promptLower.includes("night")
  );
}

function detectGlowNeonIntent(promptLower: string): boolean {
  return (
    promptLower.includes("glow") ||
    promptLower.includes("neon") ||
    promptLower.includes("light behind") ||
    promptLower.includes("behind the text")
  );
}

function applyPromptColorOverrides(
  originalPrompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const p = originalPrompt.toLowerCase();
  const warmBrown = detectWarmBrownAccent(p);
  const offwhite = detectOffwhite(p);
  const explicitDarkBg = detectExplicitDarkBackground(p);
  const wantsGlow = detectGlowNeonIntent(p);
  const wantsGradient = p.includes("gradient");
  const wantsBoxDecoration =
    p.includes("highlight box") ||
    p.includes("highlight-box") ||
    p.includes("boxed text") ||
    p.includes("text box") ||
    p.includes("rectangle behind") ||
    p.includes("panel behind");

  // If the user explicitly asks for brown icons, we treat that as:
  // - icon / step number color -> brown (numberColor / activeNumberColor)
  // - active marker fill -> warm offwhite so brown icons remain visible
  // This matches `ProcessSteps` marker logic:
  // - fill uses `activeStepColor ?? stepColor`
  // - icon/number uses `activeNumberColor ?? numberColor`
  if (warmBrown) {
    const brown = "#8B5E3C";
    const warmOffwhite = "#FDF7ED";
    params = { ...params };
    params.stepColor = brown;
    params.numberColor = brown;
    params.activeNumberColor = brown;
    params.activeStepColor = warmOffwhite;
  }

  // Explicit dark/black background intent should override vibe defaults.
  if (explicitDarkBg) {
    const darkFrom = "#050510";
    const darkTo = "#0A0A20";
    params = {
      ...params,
      background: wantsGradient
        ? { type: "gradient", from: darkFrom, to: darkTo, direction: "to-bottom" }
        : { type: "solid", color: "#0A0A0A" },
    };
  } else if (offwhite) {
    // Explicit light/offwhite intent.
    const from = "#FFF7ED";
    const to = "#F1E5D0";
    params = {
      ...params,
      background: wantsGradient
        ? { type: "gradient", from, to, direction: "to-bottom" }
        : { type: "solid", color: from },
    };
  }

  // If user asks for glow/neon, reinforce glow fields so renderer can show it.
  if (wantsGlow) {
    params = {
      ...params,
      effects: { shadow: "strong", glow: "neon", blur: "subtle" },
      activeGlowColor: typeof params.activeGlowColor === "string" ? params.activeGlowColor : "#4FC3F7",
      activeGlowStrength: typeof params.activeGlowStrength === "number" ? params.activeGlowStrength : 22,
    };
  }

  // Avoid accidental rectangle overlays behind headline text unless user
  // explicitly asked for a boxed/highlighted text treatment.
  if (!wantsBoxDecoration && typeof params.decoration === "string" && params.decoration === "highlight-box") {
    params = { ...params, decoration: "none" };
  }

  return params;
}

type VibeMode = "light" | "dark";

type VibePalette = {
  background: Record<string, unknown>;
  textPrimary: string; // hex
  textSecondary: string; // hex
  accentPrimary: string; // hex (icons/steps outlines)
  accentOnAccent: string; // hex (filled marker fill)
  accentSoft: string; // hex (glow accents)
};

type VibeId =
  | "documentary"
  | "corporate"
  | "education"
  | "minimal"
  | "premium_luxury"
  | "wellness"
  | "tech_terminal"
  | "futuristic"
  | "cyberpunk"
  | "news_broadcast"
  | "punchy_funky"
  | "playful"
  | "retro_arcade"
  | "vintage_sepia"
  | "sports"
  | "eco_nature"
  | "festive"
  | "romantic"
  | "urban_grit"
  | "abstract_art"
  | "travel"
  | "gaming_arcade"
  | "cinematic_noir"
  | "street_poster";

const VIBE_PALETTES: Record<VibeId, { light: VibePalette; dark: VibePalette }> = {
  documentary: {
    light: {
      background: { type: "gradient", from: "#FFF7ED", to: "#F1E5D0", direction: "to-bottom" },
      textPrimary: "#3A2F2A",
      textSecondary: "#6B6258",
      accentPrimary: "#7A5C3A",
      accentOnAccent: "#FDF7ED",
      accentSoft: "#B08968",
    },
    dark: {
      background: { type: "gradient", from: "#111827", to: "#2A1D17", direction: "to-bottom-right" },
      textPrimary: "#F4EEE4",
      textSecondary: "#B9B0A2",
      accentPrimary: "#A67C52",
      accentOnAccent: "#111827",
      accentSoft: "#D2B48C",
    },
  },
  corporate: {
    light: {
      background: { type: "gradient", from: "#F8FAFC", to: "#EEF2FF", direction: "to-bottom" },
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accentPrimary: "#2563EB",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#93C5FD",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#111827", direction: "to-bottom-right" },
      textPrimary: "#F1F5F9",
      textSecondary: "#A6B0C2",
      accentPrimary: "#60A5FA",
      accentOnAccent: "#0B1020",
      accentSoft: "#93C5FD",
    },
  },
  education: {
    light: {
      background: { type: "gradient", from: "#F4F6FB", to: "#EEF2FF", direction: "to-bottom" },
      textPrimary: "#111827",
      textSecondary: "#6B7280",
      accentPrimary: "#4F46E5",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#A5B4FC",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#111827", direction: "to-bottom-right" },
      textPrimary: "#F9FAFB",
      textSecondary: "#94A3B8",
      accentPrimary: "#818CF8",
      accentOnAccent: "#0B1020",
      accentSoft: "#A5B4FC",
    },
  },
  minimal: {
    light: {
      background: { type: "gradient", from: "#F8FAFC", to: "#EEF2FF", direction: "to-bottom" },
      textPrimary: "#0F172A",
      textSecondary: "#6B7280",
      accentPrimary: "#0284C7",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#7DD3FC",
    },
    dark: {
      background: { type: "solid", color: "#050816" },
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      accentPrimary: "#38BDF8",
      accentOnAccent: "#050816",
      accentSoft: "#7DD3FC",
    },
  },
  premium_luxury: {
    light: {
      background: { type: "gradient", from: "#FFF7ED", to: "#FFE8D1", direction: "to-bottom-right" },
      textPrimary: "#2B1B12",
      textSecondary: "#7B5E45",
      accentPrimary: "#C9A96E",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#E7D19F",
    },
    dark: {
      background: { type: "gradient", from: "#0A0A0A", to: "#1A1508", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#C9A96E",
      accentPrimary: "#D4AF37",
      accentOnAccent: "#0A0A0A",
      accentSoft: "#E7D19F",
    },
  },
  wellness: {
    light: {
      background: { type: "gradient", from: "#ECFDF5", to: "#E0F2FE", direction: "to-bottom" },
      textPrimary: "#064E3B",
      textSecondary: "#0F766E",
      accentPrimary: "#10B981",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#6EE7B7",
    },
    dark: {
      background: { type: "gradient", from: "#042F2E", to: "#052E16", direction: "to-bottom-right" },
      textPrimary: "#ECFDF5",
      textSecondary: "#6EE7B7",
      accentPrimary: "#34D399",
      accentOnAccent: "#052E16",
      accentSoft: "#6EE7B7",
    },
  },
  tech_terminal: {
    light: {
      background: { type: "grain", baseColor: "#F1F5F9", grainOpacity: 0.05 },
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accentPrimary: "#4FC3F7",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#38BDF8",
    },
    dark: {
      background: { type: "gradient", from: "#050816", to: "#0B1B2A", direction: "radial" },
      textPrimary: "#E5E7EB",
      textSecondary: "#93A4B5",
      accentPrimary: "#00FF88",
      accentOnAccent: "#050816",
      accentSoft: "#2DD4BF",
    },
  },
  futuristic: {
    light: {
      background: { type: "gradient", from: "#EEF2FF", to: "#FCE7F3", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#6B7280",
      accentPrimary: "#7C3AED",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#A78BFA",
    },
    dark: {
      background: { type: "gradient", from: "#020010", to: "#0A0030", direction: "radial" },
      textPrimary: "#E5E7EB",
      textSecondary: "#C7D2FE",
      accentPrimary: "#7C3AED",
      accentOnAccent: "#020010",
      accentSoft: "#A78BFA",
    },
  },
  cyberpunk: {
    light: {
      background: { type: "gradient", from: "#FDF4FF", to: "#ECFEFF", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#6B7280",
      accentPrimary: "#FF00FF",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#F472B6",
    },
    dark: {
      background: { type: "gradient", from: "#000A1A", to: "#001A3A", direction: "radial" },
      textPrimary: "#E0F2FE",
      textSecondary: "#A5B4FC",
      accentPrimary: "#00D4FF",
      accentOnAccent: "#001A3A",
      accentSoft: "#22D3EE",
    },
  },
  news_broadcast: {
    light: {
      background: { type: "gradient", from: "#F8FAFC", to: "#EEF2FF", direction: "to-bottom" },
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      accentPrimary: "#EF4444",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#FDA4AF",
    },
    dark: {
      background: { type: "gradient", from: "#050510", to: "#0A0A20", direction: "to-bottom" },
      textPrimary: "#F8FAFC",
      textSecondary: "#A1A1AA",
      accentPrimary: "#FF4D4D",
      accentOnAccent: "#0A0A20",
      accentSoft: "#FF7A7A",
    },
  },
  punchy_funky: {
    light: {
      background: { type: "gradient", from: "#FFF1F2", to: "#EEF2FF", direction: "to-bottom-right" },
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      accentPrimary: "#FF3E8A",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#FFC1DD",
    },
    dark: {
      background: { type: "gradient", from: "#1A0020", to: "#2A0040", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#C7D2FE",
      accentPrimary: "#FF3E8A",
      accentOnAccent: "#1A0020",
      accentSoft: "#FF7CC1",
    },
  },
  playful: {
    light: {
      background: { type: "gradient", from: "#F0FDFF", to: "#FFF7ED", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#6B7280",
      accentPrimary: "#06B6D4",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#67E8F9",
    },
    dark: {
      background: { type: "gradient", from: "#06121A", to: "#0B1020", direction: "to-bottom-right" },
      textPrimary: "#E0F2FE",
      textSecondary: "#94A3B8",
      accentPrimary: "#22C55E",
      accentOnAccent: "#0B1020",
      accentSoft: "#86EFAC",
    },
  },
  retro_arcade: {
    light: {
      background: { type: "gradient", from: "#FEF3C7", to: "#DBEAFE", direction: "to-bottom-right" },
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
      accentPrimary: "#EAB308",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#FDE68A",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#111827", direction: "to-bottom-right" },
      textPrimary: "#F9FAFB",
      textSecondary: "#CBD5E1",
      accentPrimary: "#22C55E",
      accentOnAccent: "#0B1020",
      accentSoft: "#86EFAC",
    },
  },
  vintage_sepia: {
    light: {
      background: { type: "gradient", from: "#FDF1E3", to: "#F4E6D0", direction: "to-bottom-right" },
      textPrimary: "#4A3A2A",
      textSecondary: "#7A624B",
      accentPrimary: "#8B5E3C",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#CFA27A",
    },
    dark: {
      background: { type: "gradient", from: "#1F140B", to: "#3B2A1A", direction: "to-bottom-right" },
      textPrimary: "#F5E6D1",
      textSecondary: "#D1B89B",
      accentPrimary: "#B45309",
      accentOnAccent: "#1F140B",
      accentSoft: "#D6A56A",
    },
  },
  sports: {
    light: {
      background: { type: "gradient", from: "#EFF6FF", to: "#F0FDF4", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accentPrimary: "#22C55E",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#86EFAC",
    },
    dark: {
      background: { type: "gradient", from: "#071A0E", to: "#0B1020", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      accentPrimary: "#22C55E",
      accentOnAccent: "#0B1020",
      accentSoft: "#86EFAC",
    },
  },
  eco_nature: {
    light: {
      background: { type: "gradient", from: "#ECFDF5", to: "#E0F2FE", direction: "to-bottom-right" },
      textPrimary: "#064E3B",
      textSecondary: "#0F766E",
      accentPrimary: "#14B8A6",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#5EEAD4",
    },
    dark: {
      background: { type: "gradient", from: "#042F2E", to: "#052E16", direction: "to-bottom-right" },
      textPrimary: "#ECFDF5",
      textSecondary: "#6EE7B7",
      accentPrimary: "#2DD4BF",
      accentOnAccent: "#052E16",
      accentSoft: "#5EEAD4",
    },
  },
  festive: {
    light: {
      background: { type: "gradient", from: "#FFF7ED", to: "#FFE4E6", direction: "to-bottom-right" },
      textPrimary: "#111827",
      textSecondary: "#6B7280",
      accentPrimary: "#F97316",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#FDBA74",
    },
    dark: {
      background: { type: "gradient", from: "#120019", to: "#1F2937", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      accentPrimary: "#F472B6",
      accentOnAccent: "#1F2937",
      accentSoft: "#FDA4AF",
    },
  },
  romantic: {
    light: {
      background: { type: "gradient", from: "#FFF1F2", to: "#FFF7ED", direction: "to-bottom-right" },
      textPrimary: "#3B1D2A",
      textSecondary: "#7A4A5E",
      accentPrimary: "#DB2777",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#F472B6",
    },
    dark: {
      background: { type: "gradient", from: "#0F102A", to: "#2A0B1A", direction: "to-bottom-right" },
      textPrimary: "#FDF2F8",
      textSecondary: "#FBCFE8",
      accentPrimary: "#FB7185",
      accentOnAccent: "#0F102A",
      accentSoft: "#F472B6",
    },
  },
  urban_grit: {
    light: {
      background: { type: "gradient", from: "#F8FAFC", to: "#F1F5F9", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      accentPrimary: "#0EA5E9",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#7DD3FC",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#111827", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      accentPrimary: "#38BDF8",
      accentOnAccent: "#0B1020",
      accentSoft: "#7DD3FC",
    },
  },
  abstract_art: {
    light: {
      background: { type: "gradient", from: "#EEF2FF", to: "#FFFAF0", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#6B7280",
      accentPrimary: "#6366F1",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#A5B4FC",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#1F2937", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      accentPrimary: "#F472B6",
      accentOnAccent: "#0B1020",
      accentSoft: "#FDA4AF",
    },
  },
  travel: {
    light: {
      background: { type: "gradient", from: "#E0F2FE", to: "#FFFBEB", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accentPrimary: "#0EA5E9",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#7DD3FC",
    },
    dark: {
      background: { type: "gradient", from: "#061A2B", to: "#0B1020", direction: "to-bottom-right" },
      textPrimary: "#E0F2FE",
      textSecondary: "#94A3B8",
      accentPrimary: "#38BDF8",
      accentOnAccent: "#0B1020",
      accentSoft: "#7DD3FC",
    },
  },
  gaming_arcade: {
    light: {
      background: { type: "gradient", from: "#ECFDF5", to: "#FEF3C7", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accentPrimary: "#06B6D4",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#67E8F9",
    },
    dark: {
      background: { type: "gradient", from: "#06121A", to: "#0B1020", direction: "to-bottom-right" },
      textPrimary: "#E0F2FE",
      textSecondary: "#94A3B8",
      accentPrimary: "#22C55E",
      accentOnAccent: "#0B1020",
      accentSoft: "#86EFAC",
    },
  },
  cinematic_noir: {
    light: {
      background: { type: "gradient", from: "#F1F5F9", to: "#E5E7EB", direction: "to-bottom-right" },
      textPrimary: "#111827",
      textSecondary: "#374151",
      accentPrimary: "#8B5E3C",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#B08968",
    },
    dark: {
      background: { type: "gradient", from: "#050510", to: "#0A0A20", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#A1A1AA",
      accentPrimary: "#C9A96E",
      accentOnAccent: "#0A0A20",
      accentSoft: "#FBBF24",
    },
  },
  street_poster: {
    light: {
      background: { type: "gradient", from: "#FDF2F8", to: "#E0F2FE", direction: "to-bottom-right" },
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      accentPrimary: "#3B82F6",
      accentOnAccent: "#FFFFFF",
      accentSoft: "#93C5FD",
    },
    dark: {
      background: { type: "gradient", from: "#0B1020", to: "#1F2937", direction: "to-bottom-right" },
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      accentPrimary: "#60A5FA",
      accentOnAccent: "#0B1020",
      accentSoft: "#93C5FD",
    },
  },
};

function detectVibeFromPrompt(prompt: string, templateId?: string): VibeId {
  const p = prompt.toLowerCase();

  const templatesBias: Partial<Record<VibeId, string[]>> = {
    news_broadcast: ["news", "breaking", "broadcast", "headline"],
    education: ["onboarding", "learn", "education", "tutorial", "course", "steps", "explain", "explainer"],
    tech_terminal: ["tech", "ai", "digital", "code", "terminal", "software", "dev"],
  };

  // Hard overrides: if the prompt explicitly calls out a vibe, it should win
  // even if the template/use-case keywords also match (e.g. “documentary”
  // + “onboarding steps” should still use documentary muted colors).
  if (p.includes("noir") || p.includes("moody") || p.includes("low light") || p.includes("gloom") || p.includes("dramatic")) {
    return "cinematic_noir";
  }
  if (p.includes("documentary") || p.includes("filmic") || p.includes("film") || p.includes("editorial")) {
    return "documentary";
  }
  if (p.includes("news") || p.includes("breaking") || p.includes("broadcast") || p.includes("headline") || p.includes("alert")) {
    return "news_broadcast";
  }
  if (p.includes("vintage") || p.includes("sepia") || p.includes("old") || p.includes("paper") || p.includes("typewriter") || p.includes("aged")) {
    return "vintage_sepia";
  }
  if (p.includes("retro") || p.includes("80s") || (p.includes("arcade") && !p.includes("gaming"))) {
    return "retro_arcade";
  }
  if (p.includes("gaming") || (p.includes("arcade") && p.includes("levels"))) {
    return "gaming_arcade";
  }
  if (p.includes("cyberpunk") || p.includes("neon") || p.includes("hacker") || p.includes("retrowave") || p.includes("synth")) {
    return "cyberpunk";
  }
  if (p.includes("futuristic") || p.includes("future") || p.includes("sci-fi") || p.includes("space") || p.includes("galaxy") || p.includes("nebula") || p.includes("interstellar")) {
    return "futuristic";
  }
  if (p.includes("corporate") || p.includes("b2b") || p.includes("enterprise") || p.includes("professional") || p.includes("business")) {
    return "corporate";
  }
  if (p.includes("premium") || p.includes("luxury") || p.includes("opulent") || p.includes("vip") || p.includes("gold") || p.includes("champagne")) {
    return "premium_luxury";
  }
  if (p.includes("wellness") || p.includes("medical") || p.includes("health") || p.includes("fitness") || p.includes("yoga") || p.includes("therapy")) {
    return "wellness";
  }
  if (p.includes("eco") || p.includes("nature") || p.includes("organic") || p.includes("forest") || p.includes("garden") || p.includes("sustainable")) {
    return "eco_nature";
  }
  if (p.includes("sports") || p.includes("tournament") || p.includes("match") || p.includes("energetic") || p.includes("goal")) {
    return "sports";
  }
  if (p.includes("festive") || p.includes("celebration") || p.includes("party") || p.includes("holiday") || p.includes("event")) {
    return "festive";
  }
  if (p.includes("romantic") || p.includes("love") || p.includes("wedding") || p.includes("valentine")) {
    return "romantic";
  }
  if (p.includes("urban") || p.includes("street") || p.includes("gritty") || p.includes("city") || p.includes("alley")) {
    return "urban_grit";
  }
  if (p.includes("abstract") || p.includes("artistic") || p.includes("gallery") || p.includes("modern art")) {
    return "abstract_art";
  }
  if (p.includes("travel") || p.includes("journey") || p.includes("explore") || p.includes("adventure") || p.includes("trip")) {
    return "travel";
  }
  if (p.includes("punchy") || p.includes("funky") || p.includes("colorful") || p.includes("vibrant") || p.includes("pop")) {
    return "punchy_funky";
  }
  if (p.includes("playful") || p.includes("kid") || p.includes("children") || p.includes("cartoon") || p.includes("friendly") || p.includes("funny")) {
    return "playful";
  }
  if (p.includes("tech") || p.includes("ai") || p.includes("digital") || p.includes("code") || p.includes("terminal") || p.includes("software") || p.includes("dev")) {
    return "tech_terminal";
  }
  if (p.includes("minimal") || p.includes("clean") || p.includes("simple") || p.includes("sleek") || p.includes("modern") || p.includes("whitespace")) {
    return "minimal";
  }
  if (p.includes("poster") || p.includes("campaign") || p.includes("advert") || p.includes("street")) {
    return "street_poster";
  }

  const vibeKeywordMap: Array<{ id: VibeId; keywords: string[] }> = [
    { id: "documentary", keywords: ["documentary", "film", "filmic", "editorial", "cinematic", "story"] },
    { id: "corporate", keywords: ["corporate", "b2b", "enterprise", "professional", "business"] },
    { id: "education", keywords: ["education", "learn", "tutorial", "course", "onboarding", "steps", "explainer"] },
    { id: "minimal", keywords: ["minimal", "clean", "simple", "sleek", "modern", "whitespace"] },
    { id: "premium_luxury", keywords: ["premium", "luxury", "opulent", "vip", "gold", "champagne"] },
    { id: "wellness", keywords: ["wellness", "medical", "health", "fitness", "yoga", "therapy"] },
    { id: "tech_terminal", keywords: ["tech", "ai", "digital", "code", "terminal", "software", "dev"] },
    { id: "futuristic", keywords: ["futuristic", "future", "sci-fi", "space", "galaxy", "nebula", "interstellar"] },
    { id: "cyberpunk", keywords: ["cyberpunk", "neon", "hacker", "glow", "synth", "retrowave"] },
    { id: "news_broadcast", keywords: ["news", "breaking", "broadcast", "headline", "alert"] },
    { id: "punchy_funky", keywords: ["punchy", "funky", "fun", "colorful", "vibrant", "pop"] },
    { id: "playful", keywords: ["playful", "kid", "children", "cartoon", "friendly", "funny"] },
    { id: "retro_arcade", keywords: ["retro", "80s", "arcade"] },
    { id: "gaming_arcade", keywords: ["gaming", "arcade", "levels", "game"] },
    { id: "vintage_sepia", keywords: ["vintage", "sepia", "old", "paper", "typewriter", "aged"] },
    { id: "sports", keywords: ["sports", "tournament", "match", "energetic", "goal"] },
    { id: "eco_nature", keywords: ["eco", "nature", "organic", "forest", "garden", "sustainable"] },
    { id: "festive", keywords: ["festive", "celebration", "party", "holiday", "event"] },
    { id: "romantic", keywords: ["romantic", "love", "wedding", "valentine"] },
    { id: "urban_grit", keywords: ["urban", "street", "gritty", "city", "alley"] },
    { id: "abstract_art", keywords: ["abstract", "artistic", "gallery", "modern art"] },
    { id: "travel", keywords: ["travel", "journey", "explore", "adventure", "trip"] },
    { id: "cinematic_noir", keywords: ["noir", "moody", "low light", "gloom", "night", "dramatic"] },
    { id: "street_poster", keywords: ["poster", "street", "campaign", "advert", "bold typography"] },
  ];

  let best: { id: VibeId; score: number } | null = null;
  for (const { id, keywords } of vibeKeywordMap) {
    let score = 0;
    for (const kw of keywords) {
      if (p.includes(kw)) score += 3;
    }
    if (templatesBias[id] && templateId && templatesBias[id].some((kw) => p.includes(kw))) {
      score += 2;
    }
    if (!best || score > best.score) best = { id, score };
  }

  if (!best || best.score === 0) {
    // Template/use-case fallback (keeps “vibe palettes” usable even if prompt is vague).
    if (templateId === "news-alert") return "news_broadcast";
    if (templateId === "process-steps" || templateId === "timeline-scene") return "education";
    if (templateId?.includes("stream") || templateId?.includes("loading")) return "tech_terminal";
    return "minimal";
  }

  return best.id;
}

function selectVibeMode(prompt: string, vibeId: VibeId, templateId?: string): VibeMode {
  const p = prompt.toLowerCase();

  const templateLightBias = new Set<string>(["process-steps", "timeline-scene", "education", "map-highlight"]);
  const templateDarkBias = new Set<string>(["news-alert", "loading-screen"]);

  let mode: VibeMode = templateLightBias.has(templateId ?? "") ? "light" : templateDarkBias.has(templateId ?? "") ? "dark" : "light";

  const moody = /(^|\W)(noir|moody|low light|gloom|night|dramatic)(\W|$)/.test(p);
  if (moody || vibeId === "cinematic_noir" || vibeId === "cyberpunk") mode = "dark";
  if (detectExplicitDarkBackground(p)) mode = "dark";

  // Documentary/retro defaults to muted light unless explicitly “noir-ish”.
  if (vibeId === "documentary" || vibeId === "retro_arcade" || vibeId === "vintage_sepia") {
    if (!moody) mode = "light";
  }

  // Offwhite/paper implies light.
  if (detectOffwhite(p)) mode = "light";

  // News + futuristic typically dark.
  if (vibeId === "news_broadcast" || vibeId === "futuristic") mode = "dark";

  return mode;
}

function snapParamsToVibePalette(
  originalPrompt: string,
  templateId: string | undefined,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const p = originalPrompt.toLowerCase();
  const warmBrown = detectWarmBrownAccent(p);
  const offwhite = detectOffwhite(p);
  const explicitDarkBg = detectExplicitDarkBackground(p);
  const wantsGradient = p.includes("gradient");

  const pinnedKeys = new Set<string>();
  // Pin background only when user expressed explicit light/dark background intent.
  if (offwhite || explicitDarkBg) {
    pinnedKeys.add("background");
    pinnedKeys.add("backgroundAfter");
  }
  if (warmBrown) {
    pinnedKeys.add("stepColor");
    pinnedKeys.add("numberColor");
    pinnedKeys.add("activeNumberColor");
    pinnedKeys.add("activeStepColor");
    pinnedKeys.add("accentColor");
  }

  const vibeId = detectVibeFromPrompt(originalPrompt, templateId);
  const mode = selectVibeMode(originalPrompt, vibeId, templateId);
  const palette = VIBE_PALETTES[vibeId][mode];

  const out: Record<string, unknown> = { ...params };

  if (!pinnedKeys.has("background")) {
    out.background = palette.background;
  }
  if (!pinnedKeys.has("backgroundAfter")) {
    out.backgroundAfter = palette.background;
  }

  const primaryTextKeys = new Set<string>([
    "titleColor",
    "headlineColor",
    "headingColor",
    "kickerColor",
    "sectionLabelColor",
    "problemLabelColor",
    "solutionLabelColor",
  ]);
  const secondaryTextKeys = new Set<string>([
    "subtitleColor",
    "subheadlineColor",
    "textColor",
    "descriptionColor",
    "bodyColor",
    "labelColor",
    "bulletColor",
    "quoteColor",
    "attributionColor",
    "subTitleColor",
  ]);

  for (const key of Object.keys(out)) {
    if (pinnedKeys.has(key)) continue;
    const val = out[key];
    if (typeof val !== "string" || !HEX_RE.test(val)) continue;

    const k = key.toLowerCase();
    const keyLower = key;

    let snapped: string | null = null;

    if (keyLower === "activeStepColor") snapped = palette.accentOnAccent;
    else if (keyLower === "activeNumberColor" || keyLower === "activeIconColor") snapped = palette.accentPrimary;
    else if (keyLower === "activeGlowColor") snapped = palette.accentSoft;
    else if (primaryTextKeys.has(keyLower)) snapped = palette.textPrimary;
    else if (secondaryTextKeys.has(keyLower) || k.includes("subtitle") || k.includes("description") || k.includes("subheadline") || k === "textcolor" || k.includes("body") || k.includes("label") || k.includes("bullet") || k.includes("quote") || k.includes("attribution")) snapped = palette.textSecondary;
    else if (k.includes("stepcolor") || k.includes("numbercolor") || k.includes("badgecolor") || k.includes("accentcolor") || k.includes("markercolor") || k.includes("iconcolor") || k.includes("problemcolor") || k.includes("solutioncolor") || k.includes("beforecolor") || k.includes("aftercolor") || k === "vscolor") {
      snapped = palette.accentPrimary;
    } else if (k.includes("activetextcolor") || (k.startsWith("activet") && k.includes("color"))) snapped = palette.textPrimary;
    else if (k.includes("activedescriptioncolor")) snapped = palette.textSecondary;
    else if (k.includes("accent") && k.includes("color")) snapped = palette.accentPrimary;

    if (snapped) out[key] = snapped;
  }

  return out;
}

/**
 * Deterministic bundle per archetype (template-agnostic aesthetic fields).
 * Shallow-merged over LLM enhancedParams so archetype wins for keys we set.
 */
function getArchetypeBundle(archetype: StyleArchetype, originalPrompt: string): Record<string, unknown> {
  const p = originalPrompt.toLowerCase();
  const dark = promptPrefersDark(p);

  const baseEffects = {
    shadow: "soft" as const,
    glow: "none" as const,
    blur: "none" as const,
  };

  switch (archetype) {
    case "personal_story":
      return {
        stylePreset: "editorial",
        typography: {
          fontFamily: "inter",
          weight: "medium",
          letterSpacing: "normal",
          lineHeight: "relaxed",
        },
        background: dark
          ? { type: "grain", baseColor: "#0B1020", grainOpacity: 0.07 }
          : { type: "gradient", from: "#FFF7ED", to: "#FFEBD6", direction: "to-bottom-right" },
        motionStyle: { easing: "smooth", speed: "slow", stagger: false, microMotion: true },
        effects: baseEffects,
        pacingProfile: "elegant",
      };
    case "product_progress":
      return {
        stylePreset: "modern-clean",
        typography: {
          fontFamily: "inter",
          weight: "bold",
          letterSpacing: "tight",
          lineHeight: "compact",
        },
        background: dark
          ? { type: "gradient", from: "#0B1020", to: "#111827", direction: "to-bottom-right" }
          : { type: "solid", color: "#F5F7FB" },
        motionStyle: { easing: "snappy", speed: "medium", stagger: false, microMotion: false },
        effects: baseEffects,
      };
    case "tech_terminal":
      return {
        stylePreset: "tech-terminal",
        typography: {
          fontFamily: "space-grotesk",
          weight: "bold",
          letterSpacing: "wide",
          lineHeight: "compact",
        },
        background: dark
          ? { type: "gradient", from: "#050816", to: "#0B1B2A", direction: "radial" }
          : { type: "grain", baseColor: "#F1F5F9", grainOpacity: 0.05 },
        motionStyle: { easing: "snappy", speed: "medium", stagger: false, microMotion: true },
        effects: { shadow: "none", glow: "none", blur: "subtle" },
      };
    case "news_alert":
      return {
        stylePreset: "editorial",
        typography: {
          fontFamily: "inter",
          weight: "bold",
          letterSpacing: "normal",
          lineHeight: "compact",
        },
        // Breaking-news / broadcast visuals should stay dark by default.
        // This avoids the "all white" preview when the user doesn't explicitly say "dark mode".
        background: { type: "gradient", from: "#050510", to: "#0A0A20", direction: "to-bottom" },
        motionStyle: { easing: "snappy", speed: "fast", stagger: false, microMotion: false },
        effects: { shadow: "strong", glow: "none", blur: "none" },
      };
    case "promo_ad":
      return {
        stylePreset: "bold-startup",
        typography: {
          fontFamily: "clash-display",
          weight: "black",
          letterSpacing: "tight",
          lineHeight: "compact",
        },
        background: dark
          ? { type: "gradient", from: "#0F0520", to: "#1A0A3A", direction: "to-bottom-right" }
          : { type: "solid", color: "#111827" },
        motionStyle: { easing: "snappy", speed: "fast", stagger: false, microMotion: true },
        effects: { shadow: "strong", glow: "subtle", blur: "none" },
        pacingProfile: "energetic",
      };
    case "minimal_ui":
      return {
        stylePreset: "modern-clean",
        typography: {
          fontFamily: "clash-display",
          weight: "medium",
          letterSpacing: "normal",
          lineHeight: "compact",
        },
        background: dark ? { type: "solid", color: "#050816" } : { type: "solid", color: "#F4F6FB" },
        motionStyle: { easing: "smooth", speed: "medium", stagger: true, microMotion: false },
        effects: baseEffects,
      };
    case "neon_cyberpunk":
      return {
        stylePreset: "neon-tech",
        typography: {
          fontFamily: "space-grotesk",
          weight: "bold",
          letterSpacing: "wide",
          lineHeight: "compact",
        },
        background: dark
          ? { type: "gradient", from: "#000A1A", to: "#001A3A", direction: "radial" }
          : { type: "solid", color: "#0B1020" },
        motionStyle: { easing: "snappy", speed: "fast", stagger: false, microMotion: true },
        effects: { shadow: "none", glow: "neon", blur: "subtle" },
      };
    default:
      return {
        stylePreset: "modern-clean",
        typography: {
          fontFamily: "inter",
          weight: "medium",
          letterSpacing: "normal",
          lineHeight: "compact",
        },
        background: dark
          ? { type: "gradient", from: "#0B1020", to: "#0F172A", direction: "to-bottom" }
          : { type: "gradient", from: "#F4F6FB", to: "#EEF2FF", direction: "to-bottom" },
        motionStyle: { easing: "smooth", speed: "medium", stagger: false, microMotion: false },
        effects: baseEffects,
      };
  }
}

/** Archetype layer wins over LLM for overlapping keys (single shallow merge). */
export function applyArchetypeToEnhancedParams(
  styleArchetype: unknown,
  enhancedParams: Record<string, unknown>,
  originalPrompt: string,
): Record<string, unknown> {
  const arch = normalizeStyleArchetype(styleArchetype);
  const bundle = getArchetypeBundle(arch, originalPrompt);
  // Fill missing keys from the archetype bundle, but never overwrite any
  // keys the LLM already proposed (this is important for user-provided
  // color vibes like "offwhite gradient" or "brown icons").
  const merged: Record<string, unknown> = { ...enhancedParams };
  for (const [key, value] of Object.entries(bundle)) {
    if (merged[key] === undefined) merged[key] = value;
  }
  return merged;
}

// ── Single-Scene Enhancement ─────────────────────────────────────────────────

export async function enhanceCreatively(
  originalPrompt: string,
  intent: IntentResult,
): Promise<IntentResult> {
  // Skip low/medium-confidence results (they'll fallback to legacy anyway)
  if (intent.confidence === "low" || intent.confidence === "medium") {
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
      model: "gpt-4o",
      temperature: 0.7,
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

    // Merge style archetype (same response as creative pass — no second LLM call)
    const forcedArchetype = forceArchetypeForPrompt(
      originalPrompt,
      parsed.styleArchetype,
    );
    const enhancedAfterArchetype = applyArchetypeToEnhancedParams(
      forcedArchetype,
      parsed.enhancedParams as Record<string, unknown>,
      originalPrompt,
    );

    // Merge enhanced over original (content-protected, sanitized)
    const mergedParams = mergeAndSanitize(
      intent.params as Record<string, unknown>,
      enhancedAfterArchetype,
      intent.templateId,
    );

    const mergedWithPromptColors = applyPromptColorOverrides(originalPrompt, mergedParams as Record<string, unknown>);
    const mergedWithVibePalette = snapParamsToVibePalette(originalPrompt, intent.templateId, mergedWithPromptColors);
    const mergedParamsWithContrast = enforceContrastOnParams(mergedWithVibePalette);

    // Validate merged params against the template's Zod schema
    let validation = entry.schema.safeParse(mergedParamsWithContrast);

    // If validation fails, strip the bad fields and retry with partial enhancements
    if (!validation.success) {
      const errors = validation.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; ");
      console.warn("[creativeEnhancer] First validation failed:", errors);

      const retryParams = stripFailedFields(
        intent.params as Record<string, unknown>,
        enhancedAfterArchetype,
        validation.error.issues as any[],
        intent.templateId,
      );

      const retryWithVibePalette = snapParamsToVibePalette(originalPrompt, intent.templateId, retryParams);
      const retryParamsWithContrast = enforceContrastOnParams(retryWithVibePalette);
      validation = entry.schema.safeParse(retryParamsWithContrast);
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

    // Post-validate contrast again after Zod defaults have been applied.
    // This prevents cases where the LLM omitted a color field and Zod
    // defaulted it to (e.g.) white on a light background.
    const validatedData = validation.data as Record<string, unknown>;
    const snappedAfterDefaults = snapParamsToVibePalette(originalPrompt, intent.templateId, validatedData);
    const withFinalContrast = enforceContrastOnParams(snappedAfterDefaults);
    const finalValidation = entry.schema.safeParse(withFinalContrast);
    const finalParams = finalValidation.success ? (finalValidation.data as Record<string, unknown>) : validatedData;

    return {
      ...intent,
      params: finalParams,
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
  if (result.confidence === "low" || result.confidence === "medium") {
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
      temperature: 0.6,
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

    const multiArchetype = (parsed as { styleArchetype?: unknown }).styleArchetype;
    const forcedMultiArchetype = forceArchetypeForPrompt(originalPrompt, multiArchetype);

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

          const regionParamsAfterArchetype = applyArchetypeToEnhancedParams(
            forcedMultiArchetype,
            regionEnhancement.enhancedParams as Record<string, unknown>,
            originalPrompt,
          );

          const mergedParams = mergeAndSanitize(
            (region.params || {}) as Record<string, unknown>,
            regionParamsAfterArchetype,
            region.templateId,
          );

          const mergedWithPromptColors = applyPromptColorOverrides(
            originalPrompt,
            mergedParams as Record<string, unknown>,
          );
          const mergedWithVibePalette = snapParamsToVibePalette(
            originalPrompt,
            region.templateId,
            mergedWithPromptColors,
          );
          const mergedParamsWithContrast = enforceContrastOnParams(mergedWithVibePalette);
          let validation = regionEntry.schema.safeParse(mergedParamsWithContrast);
          if (!validation.success) {
            const retryParams = stripFailedFields(
              (region.params || {}) as Record<string, unknown>,
              regionParamsAfterArchetype,
              validation.error.issues as any[],
              region.templateId,
            );
            const retryWithPromptColors = applyPromptColorOverrides(originalPrompt, retryParams as Record<string, unknown>);
            const retryWithVibePalette = snapParamsToVibePalette(
              originalPrompt,
              region.templateId,
              retryWithPromptColors,
            );
            const retryParamsWithContrast = enforceContrastOnParams(retryWithVibePalette);
            validation = regionEntry.schema.safeParse(retryParamsWithContrast);
            if (!validation.success) {
              console.warn(`[creativeEnhancer] Scene ${i} region ${r} validation failed, keeping original`);
              return region;
            }
          }

          const validatedData = validation.data as Record<string, unknown>;
          const validatedWithPromptColors = applyPromptColorOverrides(originalPrompt, validatedData);
          const validatedWithVibePalette = snapParamsToVibePalette(
            originalPrompt,
            region.templateId,
            validatedWithPromptColors,
          );
          const withFinalContrast = enforceContrastOnParams(validatedWithVibePalette);
          const finalValidation = regionEntry.schema.safeParse(withFinalContrast);
          const finalParams = finalValidation.success
            ? (finalValidation.data as Record<string, unknown>)
            : validatedData;

          return { ...region, params: finalParams };
        });

        const enhancedBg = enhancement.background ?? scene.background;
        return { ...scene, regions: enhancedRegions, background: enhancedBg };
      }

      if (scene.templateId && enhancement.enhancedParams) {
        const sceneEntry = SERVER_TEMPLATE_REGISTRY[scene.templateId];
        if (!sceneEntry) return scene;

        const sceneParamsAfterArchetype = applyArchetypeToEnhancedParams(
          forcedMultiArchetype,
          enhancement.enhancedParams as Record<string, unknown>,
          originalPrompt,
        );

        const mergedParams = mergeAndSanitize(
          (scene.params || {}) as Record<string, unknown>,
          sceneParamsAfterArchetype,
          scene.templateId,
        );

        const mergedWithPromptColors = applyPromptColorOverrides(
          originalPrompt,
          mergedParams as Record<string, unknown>,
        );
        const mergedWithVibePalette = snapParamsToVibePalette(
          originalPrompt,
          scene.templateId,
          mergedWithPromptColors,
        );
        const mergedParamsWithContrast = enforceContrastOnParams(mergedWithVibePalette);
        let validation = sceneEntry.schema.safeParse(mergedParamsWithContrast);
        if (!validation.success) {
          const retryParams = stripFailedFields(
            (scene.params || {}) as Record<string, unknown>,
            sceneParamsAfterArchetype,
            validation.error.issues as any[],
            scene.templateId,
          );
          const retryWithPromptColors = applyPromptColorOverrides(originalPrompt, retryParams as Record<string, unknown>);
          const retryWithVibePalette = snapParamsToVibePalette(
            originalPrompt,
            scene.templateId,
            retryWithPromptColors,
          );
          const retryParamsWithContrast = enforceContrastOnParams(retryWithVibePalette);
          validation = sceneEntry.schema.safeParse(retryParamsWithContrast);
          if (!validation.success) {
            console.warn(`[creativeEnhancer] Scene ${i} (${scene.templateId}) validation failed, keeping original`);
            return scene;
          }
        }

        const validatedData = validation.data as Record<string, unknown>;
        const validatedWithPromptColors = applyPromptColorOverrides(originalPrompt, validatedData);
        const validatedWithVibePalette = snapParamsToVibePalette(
          originalPrompt,
          scene.templateId,
          validatedWithPromptColors,
        );
        const withFinalContrast = enforceContrastOnParams(validatedWithVibePalette);
        const finalValidation = sceneEntry.schema.safeParse(withFinalContrast);
        const finalParams = finalValidation.success
          ? (finalValidation.data as Record<string, unknown>)
          : validatedData;

        const enhancedBg = enhancement.background ?? scene.background;
        return { ...scene, params: finalParams, background: enhancedBg };
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
    const enhanced = isMultiSceneResult(intent)
      ? await enhanceMultiSceneCreatively(originalPrompt, intent)
      : await enhanceCreatively(originalPrompt, intent as IntentResult);

    // Hard requirement for breaking-news visuals: never allow light/white backgrounds.
    // If the enhancer fails or chooses a mismatched archetype, we still enforce a dark TV-style bg.
    if (!isMultiSceneResult(enhanced)) {
      if (enhanced.templateId === "news-alert") {
        const nextParams = {
          ...(enhanced.params as Record<string, unknown>),
          background: {
            type: "gradient" as const,
            from: "#050510",
            to: "#0A0A20",
            direction: "to-bottom" as const,
          },
        };
        enhanced.params = enforceContrastOnParams(nextParams);
      }
      return enhanced;
    }

    const patchedScenes = enhanced.scenes.map((scene) => {
      if (!scene.templateId && isCompositeScene(scene)) {
        return {
          ...scene,
          background: {
            ...(scene.background as Record<string, unknown>),
            type: "gradient" as const,
            from: "#050510",
            to: "#0A0A20",
            direction: "to-bottom" as const,
          },
          regions: scene.regions?.map((r) => {
            if (r.templateId !== "news-alert") return r;
            const nextParams = enforceContrastOnParams({
              ...(r.params as Record<string, unknown>),
              background: {
                type: "gradient" as const,
                from: "#050510",
                to: "#0A0A20",
                direction: "to-bottom" as const,
              },
            });

            return {
              ...r,
              params: nextParams,
            };
          }),
        };
      }

      if (scene.templateId === "news-alert") {
        return {
          ...scene,
          params: enforceContrastOnParams({
            ...(scene.params as Record<string, unknown>),
            background: {
              type: "gradient" as const,
              from: "#050510",
              to: "#0A0A20",
              direction: "to-bottom" as const,
            },
          }),
        };
      }

      return scene;
    });

    return { ...enhanced, scenes: patchedScenes };
  } catch (err) {
    console.warn(
      "[creativeEnhancer] Unexpected error, passing through original:",
      (err as Error).message,
    );
    return intent;
  }
}
