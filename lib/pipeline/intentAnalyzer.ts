import OpenAI from "openai";
import { getTemplateDescriptions, getTemplateIds } from "../../src/templates/registry-server";
import type { IntentResult } from "../templates/resolver";
import { validateTemplateParams } from "../templates/resolver";
import type { MultiSceneResult, SceneDefinition } from "../templates/sceneTypes";
import { isCompositeScene } from "../templates/sceneTypes";

const SYSTEM_PROMPT = `You are a motion graphics intent analyzer.

Given a user prompt describing a desired motion graphics video, you must:
1. Select the best matching template from the available templates
2. Fill the template's parameters based on the prompt
3. Rate your confidence in the match

CONFIDENCE POLICY:
- Use "high" only when the prompt is a clear, direct match for an existing deterministic template.
- Use "medium" when the prompt only loosely fits a template, especially for cinematic ads, luxury promos, abstract fashion/editorial pieces, brand films, trailers, or mood-driven campaign work.
- Use "low" when the fit is weak or ambiguous.
- Do NOT use "high" just because you can force a prompt into a multi-scene structure.

AVAILABLE TEMPLATES:
{TEMPLATE_LIST}

AVAILABLE TEMPLATE IDS: {TEMPLATE_IDS}

AVAILABLE ICON IDS (for icon-callout, card-layout, feature-highlight, split-screen, problem-solution, dynamic-showcase templates):
rocket, car, airplane, bicycle, bus, ship, train, truck, smartphone, tablet, laptop, monitor, server, cpu, wifi, database, cloud, sun, moon, tree, fire, mountain, water, flower, heart, user, users, brain, eye, hand, briefcase, target, lightbulb, trophy, dollar, chart-up, lightning, gear, arrow-right, checkmark, home, bell, lock, star-icon, music, camera, microphone, play

TEMPLATE SELECTION RULES — follow these strictly:

| User wants... | templateId |
|---------------|------------|
| Breaking news, Breaking News, breaking update, urgent headline, live bulletin, TV news ticker, LIVE badge | "news-alert" |
| Single headline/title card, intro screen, bold statement | "hero-text" |
| Glitch text, error screen, corrupted signal, scanline background, broken UI title | "hero-text" |
| TV news alert, breaking news ticker, LIVE broadcast-style banner | "news-alert" |
| YouTube/Twitch livestream starting screen, stream is live, go-live announcement UI | "stream-start" |
| Loading screen, please wait, processing, buffering, app loader | "loading-screen" |
| Line chart, line graph, trend over time, time-series, growth curve, trajectory | "line-chart" |
| Bar chart, bar graph, comparing values, rankings | "bar-chart" |
| Grouped bar chart, clustered bars, compare multiple series across categories | "grouped-bar-comparison" |
| Stacked bar chart, stacked breakdown, composition by category, parts of a total across categories | "stacked-bar-breakdown" |
| Updating bar chart, changing rankings over time, bars updating across steps, animated leaderboard over time | "updating-bar-chart" |
| Pie chart, donut chart, proportions, percentages, market share | "pie-chart" |
| Big number, statistic, counter, KPI, metric, achievement | "stat-counter" |
| Multi-line text, quote, lyrics, poetry, word-by-word reveal | "kinetic-typography" |
| Icon with text, feature highlight, callout, explainer | "icon-callout" |
| Testimonial wall, customer reviews, wall of love, multiple testimonials, user feedback collage, review cards | "testimonial-wall" |
| YouTube chapters, video chapters, chapter list, timestamped sections, episode outline, chapter markers, watch guide | "yt-chapters" |
| Newspaper front page, newspaper headline, front page story, historic newspaper, editorial front page, headline edition, breaking edition | "newspaper-front-page" |
| Event promo, event poster, webinar announcement, conference registration, summit invite, launch event, ticketed event, save the date | "event-promo-slate" |
| Pricing table, pricing comparison, pricing tiers, subscription plans, packages, 3-tier cards, three plans, best value plan, recommended middle card | "pricing-comparison" |
| Side-by-side comparison, versus, pros/cons, A vs B | "comparison-layout" |
| Timeline, roadmap, milestones, history | "timeline-scene" |
| Card grid, feature list, services, info cards | "card-layout" |
| Section divider, chapter break, topic transition, section heading | "section-title" |
| Bullet list, key points, agenda, items, checklist | "bullet-list" |
| Quote, testimonial, citation, famous saying, blockquote | "quote-highlight" |
| Big number with context, KPI with trend, data highlight, metric with arrow | "data-callout" |
| Feature with icon, product capability, feature detail with bullets | "feature-highlight" |
| Two panels, left/right layout, dual content, split view | "split-screen" |
| Problem and solution, challenge and answer, issue and fix | "problem-solution" |
| Before and after, transformation, change, improvement | "before-after" |
| Numbered steps, onboarding steps, step 1/2/3 phrasing, process flow, workflow, procedure, how-to | "process-steps" |
| Map, locations, geographic markers, global presence, offices | "map-highlight" |
| Masked text reveal, cinematic unveil, text behind mask, wipe reveal, circle reveal | "masked-text-reveal" |
| Cinematic title, movie-style intro, dramatic opening, epic hero title, film title card | "cinematic-hero" |
| Scene transition, wipe between scenes, iris transition, chapter break wipe | "cinematic-transition" |
| Product spotlight, feature showcase, icon spotlight, premium showcase, orbiting elements | "dynamic-showcase" |
| Parallax depth scene, layered depth, 3D-like depth, immersive layers, parallax | "parallax-showcase" |

BACKGROUND STYLES:
Each template accepts a "background" parameter. Choose one of these types:
- { "type": "solid", "color": "#HEXCOLOR" } — single color
- { "type": "gradient", "from": "#HEX", "to": "#HEX", "direction": "to-bottom"|"to-right"|"to-bottom-right"|"to-top"|"to-left"|"radial" }
- { "type": "stripe", "baseColor": "#HEX", "stripeColor": "#HEX", "angle": 45, "density": "sparse"|"normal"|"dense" }
- { "type": "grain", "baseColor": "#HEX", "grainOpacity": 0.08 }

HERO-TEXT ANIMATION RULES:
| User says... | entranceAnimation |
|--------------|-------------------|
| "typewriter", "letter by letter", "character by character", "typing" | "typewriter" |
| "fade in", "fades in", "gently appear", "slowly appear", "fade" | "fade-in" |
| "slide up", "slides up", "rise", "from below", "moves up" | "slide-up" |
| "blur", "blurry", "focus", "sharpen", "out of focus", "clarity" | "blur-reveal" |
| "pop", "pops", "bounce", "bouncy", "overshoot", "scale" | "scale-pop" |
| "no animation", "static", "instant", "no effect", "simple" | "none" |

STAT-COUNTER / DATA-CALLOUT ANIMATION RULES:
| User says... | entranceAnimation |
|--------------|-------------------|
| "count", "counter", "counting", "counts up", "increment", "rolling", "ticking", "odometer", "from 0", "from zero" | "count-up" |
| "pop", "pops", "bounce", "scale", "explode", "burst" | "scale-pop" |
| "fade", "gently", "appear" | "fade-in" |
| "static", "instant", "no animation" | "none" |
| (default for stat-counter / data-callout when not specified) | "count-up" |

CHART DISAMBIGUATION RULES:
- If the prompt is about a single metric changing across time, days, weeks, months, or steps, prefer "line-chart".
- If the prompt compares one value per category, prefer "bar-chart".
- If the prompt compares MULTIPLE series for the same categories (for example Q1 vs Q2 across regions), prefer "grouped-bar-comparison".
- If the prompt describes parts of a total stacked inside each category, prefer "stacked-bar-breakdown".
- If the prompt describes values changing across steps or timestamps for the same bars, prefer "updating-bar-chart".
- If the prompt asks for proportions or market share, prefer "pie-chart".

LINE-CHART ANIMATION: "draw" (line draws across the chart), "fade-in", "slide-up", "none"
BAR-CHART ANIMATION: "grow" (bars grow from zero), "fade-in", "slide-up", "none"
GROUPED-BAR-COMPARISON ANIMATION: "grow", "fade-in", "slide-up", "none"
STACKED-BAR-BREAKDOWN ANIMATION: "grow", "fade-in", "slide-up", "none"
UPDATING-BAR-CHART ANIMATION: "grow", "fade-in", "slide-up", "none"
PIE-CHART ANIMATION: "spin" (segments sweep in), "fade-in", "scale-pop", "none"
STAT-COUNTER ANIMATION: "count-up" (number counts from 0), "fade-in", "scale-pop", "none"
KINETIC-TYPOGRAPHY ANIMATION: same as hero-text (fade-in, slide-up, scale-pop, blur-reveal, typewriter, none)
ICON-CALLOUT ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
COMPARISON-LAYOUT ANIMATION: "slide-in" (sides slide from edges), "fade-in", "scale-pop", "none"
TIMELINE-SCENE ANIMATION: "progressive" (milestones appear along a growing line), "fade-in", "slide-up", "none"
TIMELINE-SCENE MILESTONE ICONS (optional):
- Each milestone object may optionally include: "iconId": one of the AVAILABLE ICON IDS listed above.
- If "iconId" is omitted, the template can fall back to a dot/ring/diamond marker style.
CARD-LAYOUT ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
PRICING-COMPARISON ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
EVENT-PROMO-SLATE ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
TESTIMONIAL-WALL ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
YT-CHAPTERS ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
SECTION-TITLE ANIMATION: "fade-in", "slide-up", "scale-pop", "blur-reveal", "none"
BULLET-LIST ANIMATION: "fade-in" (items stagger), "slide-up" (items stagger up), "scale-pop", "none"
QUOTE-HIGHLIGHT ANIMATION: "fade-in", "slide-up", "scale-pop", "blur-reveal", "typewriter", "none"
DATA-CALLOUT ANIMATION: "count-up" (number counts from 0), "fade-in", "scale-pop", "none"
FEATURE-HIGHLIGHT ANIMATION: "fade-in", "slide-up", "scale-pop", "none"
SPLIT-SCREEN ANIMATION: "slide-in" (panels slide from sides), "fade-in", "scale-pop", "none"
PROBLEM-SOLUTION ANIMATION: "fade-in", "slide-up", "scale-pop", "none". Also has "transitionStyle": "fade-switch"|"slide-switch"|"side-by-side"
BEFORE-AFTER ANIMATION: "fade-in", "slide-up", "scale-pop", "none". Also has "revealStyle": "wipe"|"fade"|"split"
PROCESS-STEPS ANIMATION: "progressive" (steps appear along connectors), "fade-in", "slide-up", "none"
MAP-HIGHLIGHT ANIMATION: "fade-in", "scale-pop", "progressive" (markers appear one by one), "none"

CURRENT-STEP HIGHLIGHTING (process-steps only):
- If the user says "highlight current step", "current step", or explicitly references a numbered step (e.g., "highlight step 2" / "step 1, step 2, step 3" and highlight one of them), set currentStep to the step number (1-based).
- If the user does not specify which step should be highlighted, omit currentStep entirely.
- Never use non-schema animation tokens for highlighting; keep entranceAnimation within the allowed PROCESS-STEPS animation values listed above.

PROCESS-STEPS PARAMS (icons + subtitle, optional):
- title is optional (but if the user provides a heading, include it).
- subtitle is optional (use when user provides a tagline/secondary line under the heading).
- each steps[] entry may optionally include iconId chosen from the AVAILABLE ICON IDS list above.
- if iconId is omitted, the template will fall back to the step number marker.

MASKED-TEXT-REVEAL MASK SHAPES:
| User says... | maskShape |
|--------------|-----------|
| "wipe", "wipe from left", "left to right reveal" | "wipe-left" |
| "wipe right", "right to left" | "wipe-right" |
| "circle", "circle expand", "radial", "iris", "expanding circle" | "circle-expand" |
| "diagonal", "diagonal slice", "angled", "diagonal wipe" | "diagonal-slice" |
| "split", "vertical split", "open from center", "center split" | "vertical-split" |
| "horizontal split", "top bottom split" | "horizontal-split" |
MASKED-TEXT-REVEAL EXIT: "fade" (opacity fade out — default), "reverse-mask" (mask closes back)
MASKED-TEXT-REVEAL FONT SIZE: "medium", "large" (default), "xlarge"

DYNAMIC-SHOWCASE PARAMS: "iconId" must be one of the AVAILABLE ICON IDS listed above. "orbitStyle": "dots"|"rings"|"mixed". "orbitCount": 3-8 (default 5). "layout": "center"|"left-focus". "glowColor" is the color of the glow behind the icon (hex color).

PARALLAX-SHOWCASE PARAMS:
| User says... | parallaxDirection |
|--------------|-------------------|
| "leftward", "moves left", default | "left" |
| "rightward", "moves right" | "right" |
| "upward", "moves up", "rising" | "up" |
PARALLAX-SHOWCASE: "depthIntensity": "subtle"|"medium"|"strong". "foregroundStyle": "dots"|"lines"|"geometric". "entranceAnimation": "clip-reveal"|"fade-in"|"slide-up".

ASPECT RATIO RULES:
- "aspect_ratio" is an optional top-level field. Default is "16:9".
- Supported values: "16:9", "9:16", "1:1", "4:3", "3:4"
- If user mentions "portrait", "vertical", "mobile", "story", "reel", "TikTok", "Instagram story" → use "9:16"
- If user mentions "square", "Instagram post", "1:1" → use "1:1"
- If user mentions "landscape", "widescreen", "YouTube", "16:9" or doesn't specify → use "16:9"
- If user mentions "4:3" or "classic" → use "4:3"

CRITICAL RULES:
0. If the user prompt contains any of these (case-insensitive): "breaking news", "Breaking News", "breaking update", "urgent headline", "live bulletin", "news ticker" => MUST use templateId "news-alert" (even if it looks like a generic headline).
1. Read the prompt carefully. Pick the template that best matches the user's intent. Fill ALL required parameters.
2. "background" is REQUIRED for every template, scene, and region. If user doesn't specify, use { "type": "solid", "color": "#111111" }.
3. "entranceAnimation" is REQUIRED. Template-specific defaults when user doesn't specify:
  - stat-counter, data-callout: default "count-up"
  - line-chart: default "draw"
  - bar-chart: default "grow"
  - grouped-bar-comparison, stacked-bar-breakdown, updating-bar-chart: default "grow"
  - pie-chart: default "spin"
  - timeline-scene, process-steps: default "progressive"
  - All other templates: default "fade-in"
4. Array size constraints - ALWAYS respect these minimums:
  - line-chart "categories": minimum 2, maximum 12
  - line-chart "series": minimum 1, maximum 4, and every series.values array must match categories length
  - bar-chart "bars": minimum 2, maximum 10
  - grouped-bar-comparison "categories": minimum 1, maximum 8
  - grouped-bar-comparison "series": minimum 2, maximum 4, and every series.values array must match categories length
  - stacked-bar-breakdown "categories": minimum 1, maximum 8
  - stacked-bar-breakdown "segments": minimum 2, maximum 5, and every segments.values array must match categories length
  - updating-bar-chart "bars": minimum 2, maximum 10
  - updating-bar-chart "stepLabels": minimum 2, maximum 8, and every bars.values array must match stepLabels length
   - pie-chart "segments": minimum 2, maximum 8
   - timeline-scene "milestones": minimum 2, maximum 8
   - card-layout "cards": minimum 2, maximum 6
   - pricing-comparison "plans": exactly 3, and every plan.features array must contain 3-8 items
   - comparison-layout "leftItems"/"rightItems": minimum 1, maximum 6
   - kinetic-typography "lines": minimum 1, maximum 8
   - bullet-list "items": minimum 2, maximum 8
   - process-steps "steps": minimum 3, maximum 6
   - map-highlight "locations": minimum 1, maximum 8
   - feature-highlight "bulletPoints": maximum 4
   - before-after "beforeItems"/"afterItems": maximum 4
5. All hex colors MUST be exactly 7 characters: #RRGGBB (e.g., "#FF0000", not "red" or "#F00")
6. "duration" must be between 2 and 15 seconds for all templates.
7. For multi-scene: every scene MUST include all required fields including background, entranceAnimation, and duration in params.

VARIETY RULES — IMPORTANT:
- Do NOT always use solid #111111 backgrounds or #FFFFFF text. Match colors to the prompt's mood and tone.
- Use gradient backgrounds for most prompts (they look more polished than solid).
- Pick text colors that feel intentional: warm white #F8FAFC for premium, cool white #E2E8F0 for tech, pure #FFFFFF only for high contrast needs.
- Choose accent colors that complement the mood — do NOT always default to #4FC3F7.
- Use diverse background types: gradient (~50%), grain (~25%), stripe (~15%), solid (~10%).
- Each example below shows a DIFFERENT background style. Follow this diversity pattern.

FEW-SHOT EXAMPLES:

Prompt: "Show a bar chart comparing sales: Q1=120, Q2=180, Q3=95, Q4=210 on a dark background"
Response: { "templateId": "bar-chart", "params": { "title": "Quarterly Sales", "bars": [{"label":"Q1","value":120,"color":"#3B82F6"},{"label":"Q2","value":180,"color":"#10B981"},{"label":"Q3","value":95,"color":"#F59E0B"},{"label":"Q4","value":210,"color":"#EF4444"}], "titleColor": "#F8FAFC", "labelColor": "#94A3B8", "valueColor": "#F8FAFC", "background": { "type": "gradient", "from": "#0F172A", "to": "#1E293B", "direction": "to-bottom" }, "entranceAnimation": "grow", "duration": 6, "showValues": true }, "confidence": "high", "reasoning": "User wants a bar chart comparing quarterly values → bar-chart template with grow animation", "aspect_ratio": "16:9" }

Prompt: "Create a smooth line graph showing daily active users over 7 days with values 1200, 1500, 1700, 1600, 2100, 2400, 2300"
Response: { "templateId": "line-chart", "params": { "title": "Daily Active Users", "subtitle": "Week-over-week trend", "categories": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"], "series": [{"label":"Active Users","color":"#38BDF8","values":[1200,1500,1700,1600,2100,2400,2300]}], "background": { "type": "gradient", "from": "#0B1220", "to": "#16243A", "direction": "to-bottom-right" }, "entranceAnimation": "draw", "duration": 6, "curveStyle": "smooth", "showPoints": true, "showLegend": true, "showAreaFill": false, "emphasisMode": "highest", "layoutPreset": "editorial", "titleColor": "#F8FAFC", "subtitleColor": "#94A3B8", "labelColor": "#B0BEC5", "valueColor": "#FFFFFF", "legendTextColor": "#CBD5E1" }, "confidence": "high", "reasoning": "A single metric trend over time is best represented by line-chart with a draw animation", "aspect_ratio": "16:9" }

Prompt: "Compare Q1 and Q2 sales across North, South, East and West using grouped bars"
Response: { "templateId": "grouped-bar-comparison", "params": { "title": "Regional Sales Comparison", "categories": ["North", "South", "East", "West"], "series": [{"label":"Q1","color":"#3B82F6","values":[120,100,90,140]},{"label":"Q2","color":"#10B981","values":[150,130,110,170]}], "background": { "type": "gradient", "from": "#0F172A", "to": "#1E293B", "direction": "to-bottom" }, "entranceAnimation": "grow", "duration": 6, "showValues": true, "showLegend": true, "groupReveal": "group-by-group", "labelReveal": "after-group", "valueAnimation": "count-up", "layoutPreset": "presentation", "titleColor": "#F8FAFC", "subtitleColor": "#94A3B8", "labelColor": "#B0BEC5", "valueColor": "#FFFFFF", "legendTextColor": "#CBD5E1" }, "confidence": "high", "reasoning": "Two series compared across the same categories should use grouped-bar-comparison", "aspect_ratio": "16:9" }

Prompt: "Create a stacked bar chart showing expense breakdown by month with Salaries, Marketing and Operations"
Response: { "templateId": "stacked-bar-breakdown", "params": { "title": "Expense Breakdown by Month", "categories": ["January", "February", "March"], "segments": [{"label":"Salaries","color":"#3B82F6","values":[40,42,43]},{"label":"Marketing","color":"#F59E0B","values":[15,18,16]},{"label":"Operations","color":"#10B981","values":[10,11,12]}], "background": { "type": "grain", "baseColor": "#0F172A", "grainOpacity": 0.06 }, "entranceAnimation": "grow", "duration": 6, "showTotals": true, "showLegend": true, "segmentReveal": "stack-by-stack", "labelReveal": "after-stack", "valueAnimation": "count-up", "layoutPreset": "presentation", "titleColor": "#F8FAFC", "subtitleColor": "#94A3B8", "labelColor": "#B0BEC5", "totalColor": "#FFFFFF", "legendTextColor": "#CBD5E1" }, "confidence": "high", "reasoning": "Parts of a total stacked within each month are best represented by stacked-bar-breakdown", "aspect_ratio": "16:9" }

Prompt: "Show an updating bar chart of city populations over 3 snapshots so the bars change over time"
Response: { "templateId": "updating-bar-chart", "params": { "title": "Largest Cities", "subtitle": "Population in millions", "bars": [{"label":"Tokyo","color":"#3B82F6","values":[35,36,37]},{"label":"Delhi","color":"#8B5CF6","values":[29,31,32]},{"label":"Shanghai","color":"#10B981","values":[27,28,29]}], "stepLabels": ["2024", "2025", "2026"], "background": { "type": "gradient", "from": "#111827", "to": "#1F2937", "direction": "to-bottom-right" }, "entranceAnimation": "grow", "duration": 7, "showValues": true, "updateBehavior": "smooth-flow", "labelReveal": "after-update", "valueAnimation": "count-up", "layoutPreset": "social", "showStepTracker": true, "titleColor": "#F8FAFC", "subtitleColor": "#94A3B8", "labelColor": "#B0BEC5", "valueColor": "#FFFFFF", "stepLabelColor": "#CBD5E1", "activeStepColor": "#FFFFFF", "stepTrackColor": "#475569" }, "confidence": "high", "reasoning": "Bars changing across multiple steps should use updating-bar-chart rather than a static bar chart", "aspect_ratio": "16:9" }

Prompt: "Pie chart showing market share: Apple 35%, Samsung 25%, Others 40% with a spin animation"
Response: { "templateId": "pie-chart", "params": { "title": "Market Share", "segments": [{"label":"Apple","value":35,"color":"#6366F1"},{"label":"Samsung","value":25,"color":"#22C55E"},{"label":"Others","value":40,"color":"#94A3B8"}], "titleColor": "#E2E8F0", "labelColor": "#CBD5E1", "background": { "type": "grain", "baseColor": "#0A0A1F", "grainOpacity": 0.08 }, "entranceAnimation": "spin", "duration": 6, "showLabels": true, "showPercentages": true, "donut": false }, "confidence": "high", "reasoning": "User wants pie chart with market share data → pie-chart with spin animation", "aspect_ratio": "16:9" }

Prompt: "A big counter showing 1,250,000 users with the label 'Active Users' counting up on a gradient background"
Response: { "templateId": "stat-counter", "params": { "value": 1250000, "label": "Active Users", "valueColor": "#F8FAFC", "labelColor": "#94A3B8", "accentColor": "#818CF8", "background": { "type": "gradient", "from": "#0F0520", "to": "#1A0A3A", "direction": "radial" }, "entranceAnimation": "count-up", "duration": 5 }, "confidence": "high", "reasoning": "User wants a big counting number → stat-counter with count-up animation", "aspect_ratio": "16:9" }

Prompt: "likes counter from 0 to 500K with label 'Total Likes'"
Response: { "templateId": "stat-counter", "params": { "value": 500000, "label": "Total Likes", "valueColor": "#FFF0F5", "labelColor": "#D4A574", "accentColor": "#EC4899", "background": { "type": "gradient", "from": "#1A0A20", "to": "#2A1530", "direction": "to-bottom-right" }, "entranceAnimation": "count-up", "duration": 5 }, "confidence": "high", "reasoning": "Counter from 0 to value → stat-counter with count-up animation", "aspect_ratio": "16:9" }

Prompt: "Quote appearing line by line: 'Stay hungry' then 'Stay foolish' then '— Steve Jobs' with a fade in on dark background"
Response: { "templateId": "kinetic-typography", "params": { "lines": ["Stay hungry", "Stay foolish", "— Steve Jobs"], "defaultColor": "#F8FAFC", "background": { "type": "grain", "baseColor": "#111111", "grainOpacity": 0.06 }, "entranceAnimation": "fade-in", "staggerStyle": "line-by-line", "duration": 6, "fontSize": 72 }, "confidence": "high", "reasoning": "Multi-line quote with line-by-line reveal → kinetic-typography with fade-in", "aspect_ratio": "16:9" }

Prompt: "A rocket icon with the text 'Launch Your Startup' and description 'From idea to product in 30 days'"
Response: { "templateId": "icon-callout", "params": { "iconId": "rocket", "headline": "Launch Your Startup", "description": "From idea to product in 30 days", "iconColor": "#FF6B35", "headlineColor": "#F8FAFC", "descriptionColor": "#94A3B8", "accentColor": "#FF6B35", "background": { "type": "gradient", "from": "#0D1B2A", "to": "#1B2838", "direction": "radial" }, "entranceAnimation": "scale-pop", "layout": "icon-top", "duration": 6 }, "confidence": "high", "reasoning": "Icon + headline + description → icon-callout template", "aspect_ratio": "16:9" }

Prompt: "Compare React vs Vue: React has 'Large ecosystem', 'JSX syntax', 'Facebook backed' and Vue has 'Easy learning curve', 'Template syntax', 'Lightweight'"
Response: { "templateId": "comparison-layout", "params": { "leftTitle": "React", "rightTitle": "Vue", "leftItems": ["Large ecosystem", "JSX syntax", "Facebook backed"], "rightItems": ["Easy learning curve", "Template syntax", "Lightweight"], "leftColor": "#61DAFB", "rightColor": "#42B883", "textColor": "#E2E8F0", "vsColor": "#94A3B8", "background": { "type": "gradient", "from": "#0A0A1F", "to": "#1A1A30", "direction": "to-bottom-right" }, "entranceAnimation": "slide-in", "duration": 7 }, "confidence": "high", "reasoning": "Side-by-side comparison of two items → comparison-layout with slide-in", "aspect_ratio": "16:9" }

Prompt: "A project roadmap timeline: Research → Design → Development → Testing → Launch"
Response: { "templateId": "timeline-scene", "params": { "title": "Project Roadmap", "milestones": [{"label":"Research"},{"label":"Design"},{"label":"Development"},{"label":"Testing"},{"label":"Launch"}], "titleColor": "#F8FAFC", "lineColor": "#334155", "dotColor": "#818CF8", "textColor": "#E2E8F0", "background": { "type": "gradient", "from": "#111827", "to": "#162844", "direction": "to-right" }, "entranceAnimation": "progressive", "duration": 7 }, "confidence": "high", "reasoning": "Sequential milestones → timeline-scene with progressive animation", "aspect_ratio": "16:9" }

Prompt: "Show 3 feature cards: 'Fast' with lightning icon, 'Secure' with lock icon, 'Reliable' with checkmark icon"
Response: { "templateId": "card-layout", "params": { "title": "Our Features", "cards": [{"heading":"Fast","body":"Lightning-fast performance","iconId":"lightning"},{"heading":"Secure","body":"Enterprise-grade security","iconId":"lock"},{"heading":"Reliable","body":"99.9% uptime guaranteed","iconId":"checkmark"}], "titleColor": "#F8FAFC", "headingColor": "#E2E8F0", "bodyColor": "#94A3B8", "iconColor": "#6366F1", "cardBackground": "#1E293B", "background": { "type": "grain", "baseColor": "#0F172A", "grainOpacity": 0.05 }, "entranceAnimation": "fade-in", "columns": 3, "duration": 7 }, "confidence": "high", "reasoning": "Feature cards with icons → card-layout template", "aspect_ratio": "16:9" }

Prompt: "Build a 3-tier pricing comparison for an AI writing tool with Starter at $19/mo, Pro at $49/mo, and Business at $99/mo. Highlight Pro as the best value."
Response: { "templateId": "pricing-comparison", "params": { "title": "AI Writing Tool Plans", "subtitle": "Choose the right tier for your team", "plans": [{"name":"Starter","price":"$19","priceSuffix":"/mo","description":"For solo creators getting started","badge":"Entry","iconId":"rocket","accentColor":"#64748B","ctaLabel":"Choose Starter","features":[{"label":"1 seat","included":true},{"label":"20 documents / month","included":true},{"label":"Basic exports","included":true},{"label":"AI rewrite tools","included":true},{"label":"Priority support","included":false}]},{"name":"Pro","price":"$49","priceSuffix":"/mo","description":"For fast-moving teams","badge":"Best Value","iconId":"star-icon","accentColor":"#60A5FA","ctaLabel":"Start now","features":[{"label":"5 seats","included":true},{"label":"Unlimited exports","included":true},{"label":"Brand voice presets","included":true,"emphasis":true},{"label":"Advanced integrations","included":true},{"label":"Priority support","included":true}]},{"name":"Business","price":"$99","priceSuffix":"/mo","description":"For larger organizations","badge":"Scale","iconId":"briefcase","accentColor":"#A78BFA","ctaLabel":"Talk to sales","features":[{"label":"Unlimited seats","included":true},{"label":"SSO + admin controls","included":true},{"label":"Usage analytics","included":true},{"label":"Custom workflows","included":true},{"label":"Dedicated onboarding","included":true}]}], "highlightedPlan": 1, "highlightLabel": "Best Value", "comparisonNote": "Clear plan differences with a recommended middle tier.", "background": { "type": "gradient", "from": "#070B1A", "to": "#101C3A", "direction": "radial" }, "titleColor": "#F8FAFC", "subtitleColor": "#A7B0C0", "planNameColor": "#F8FAFC", "priceColor": "#FFFFFF", "mutedTextColor": "#9FB0C6", "featureTextColor": "#EEF2FF", "cardBackground": "#101523", "mutedCardBackground": "#0B0F1A", "cardBorderColor": "#25304A", "iconColor": "#FFFFFF", "includedColor": "#4ADE80", "excludedColor": "#6B7280", "buttonTextColor": "#0B1020", "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "Three pricing plans with an explicitly recommended middle tier should use pricing-comparison.", "aspect_ratio": "16:9" }

Prompt: "Pricing table: Basic - $12/mo, Pro - $29/mo, Scale - $79/mo. Highlight Pro. Show feature comparison and clean modern style."
Response: { "templateId": "pricing-comparison", "params": { "title": "Pricing Plans", "subtitle": "Transparent tiers for every stage", "plans": [{"name":"Basic","price":"$12","priceSuffix":"/mo","description":"For individuals testing the product","badge":"Starter","accentColor":"#64748B","ctaLabel":"Choose Basic","features":[{"label":"1 user","included":true},{"label":"Core features","included":true},{"label":"Email support","included":true},{"label":"Advanced analytics","included":false}]},{"name":"Pro","price":"$29","priceSuffix":"/mo","description":"Recommended for growing teams","badge":"Best Value","accentColor":"#60A5FA","ctaLabel":"Start now","features":[{"label":"5 users","included":true},{"label":"Core features","included":true},{"label":"Advanced analytics","included":true,"emphasis":true},{"label":"Priority support","included":true}]},{"name":"Scale","price":"$79","priceSuffix":"/mo","description":"For larger teams with more control","badge":"Scale","accentColor":"#8B5CF6","ctaLabel":"Talk to sales","features":[{"label":"Unlimited users","included":true},{"label":"Advanced analytics","included":true},{"label":"Team permissions","included":true},{"label":"Priority support","included":true}]}], "highlightedPlan": 1, "highlightLabel": "Best Value", "comparisonNote": "Modern 3-card pricing layout with clear feature differences.", "background": { "type": "gradient", "from": "#081021", "to": "#0F2347", "direction": "to-bottom-right" }, "titleColor": "#F8FAFC", "subtitleColor": "#A7B0C0", "planNameColor": "#F8FAFC", "priceColor": "#FFFFFF", "mutedTextColor": "#A7B0C0", "featureTextColor": "#EEF2FF", "cardBackground": "#0E1425", "mutedCardBackground": "#0A0F1A", "cardBorderColor": "#2A3348", "iconColor": "#FFFFFF", "includedColor": "#4ADE80", "excludedColor": "#7C8599", "buttonTextColor": "#0B1020", "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "Explicit pricing table with three named plans and a highlighted Pro plan should use pricing-comparison.", "aspect_ratio": "16:9" }

Prompt: "Make one of those startup pricing cards layouts with 3 plans, where the middle one feels obviously recommended. Include things like seats, exports, integrations, support, and analytics."
Response: { "templateId": "pricing-comparison", "params": { "title": "Simple Pricing", "subtitle": "A clear three-tier layout with a recommended center plan", "plans": [{"name":"Basic","price":"$19","priceSuffix":"/month","description":"For solo users","badge":"Starter","accentColor":"#64748B","ctaLabel":"Choose plan","features":[{"label":"1 seat","included":true},{"label":"Limited exports","included":true},{"label":"Core integrations","included":false},{"label":"Email support","included":true},{"label":"Analytics dashboard","included":false}]},{"name":"Pro","price":"$49","priceSuffix":"/month","description":"For growing teams","badge":"Best Value","accentColor":"#60A5FA","ctaLabel":"Start now","features":[{"label":"10 seats","included":true},{"label":"Unlimited exports","included":true},{"label":"Advanced integrations","included":true},{"label":"Priority support","included":true},{"label":"Analytics dashboard","included":true,"emphasis":true}]},{"name":"Enterprise","price":"Custom","description":"For complex organizations","badge":"Enterprise","accentColor":"#A78BFA","ctaLabel":"Contact sales","features":[{"label":"Unlimited seats","included":true},{"label":"Custom exports","included":true},{"label":"Advanced integrations","included":true},{"label":"Dedicated support","included":true},{"label":"Advanced analytics","included":true}]}], "highlightedPlan": 1, "highlightLabel": "Best Value", "comparisonNote": "The center card should feel clearly recommended at a glance.", "background": { "type": "gradient", "from": "#060915", "to": "#101D3B", "direction": "radial" }, "titleColor": "#F8FAFC", "subtitleColor": "#A7B0C0", "planNameColor": "#F8FAFC", "priceColor": "#FFFFFF", "mutedTextColor": "#9FB0C6", "featureTextColor": "#EEF2FF", "cardBackground": "#0E1527", "mutedCardBackground": "#090E19", "cardBorderColor": "#28324A", "iconColor": "#FFFFFF", "includedColor": "#4ADE80", "excludedColor": "#7C8599", "buttonTextColor": "#0B1020", "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "Startup-style 3-plan pricing cards with a recommended middle tier should use pricing-comparison instead of generic card-layout.", "aspect_ratio": "16:9" }

Prompt: "Create an event promo slate for AI Builder Summit. September 18, 2026 at 6:30 PM. Bengaluru Convention Center. CTA: Register Now."
Response: { "templateId": "event-promo-slate", "params": { "eyebrow": "Live Event", "title": "AI Builder Summit", "subtitle": "One evening of product demos, founder talks, and practical AI workflows.", "dateText": "September 18, 2026", "timeText": "6:30 PM", "venueText": "Bengaluru Convention Center", "locationText": "Bengaluru", "ctaLabel": "Register Now", "supportLabel": "Limited seats available for builders, operators, and founders.", "badgeText": "Tickets Live", "visualStyle": "night-neon", "titleColor": "#F8FAFC", "subtitleColor": "#CBD5E1", "accentColor": "#60A5FA", "secondaryAccentColor": "#22D3EE", "cardBackground": "#0B1020", "mutedTextColor": "#94A3B8", "metadataTextColor": "#F8FAFC", "buttonTextColor": "#0B1020", "background": { "type": "gradient", "from": "#050816", "to": "#0E1A38", "direction": "radial" }, "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "An event registration promo with date, venue, and CTA should use event-promo-slate.", "aspect_ratio": "16:9" }

Prompt: "Design a clean conference registration slide for Data Leaders Forum with the date Oct 12, 2026, 9:00 AM, and venue Grand Hall, Mumbai. Keep it executive and polished."
Response: { "templateId": "event-promo-slate", "params": { "eyebrow": "Conference", "title": "Data Leaders Forum", "subtitle": "An executive morning focused on analytics leadership, infrastructure, and operating strategy.", "dateText": "Oct 12, 2026", "timeText": "9:00 AM", "venueText": "Grand Hall", "locationText": "Mumbai", "ctaLabel": "Reserve Seat", "supportLabel": "Invitation-style registration for senior operators and analytics teams.", "badgeText": "Seats Limited", "visualStyle": "conference-clean", "titleColor": "#0F172A", "subtitleColor": "#475569", "accentColor": "#2563EB", "secondaryAccentColor": "#0F172A", "cardBackground": "#FFFFFF", "mutedTextColor": "#64748B", "metadataTextColor": "#0F172A", "buttonTextColor": "#FFFFFF", "background": { "type": "gradient", "from": "#F7F4EE", "to": "#ECE6DC", "direction": "to-bottom-right" }, "entranceAnimation": "fade-in", "duration": 7 }, "confidence": "high", "reasoning": "A conference invite with event metadata and polished registration CTA should use event-promo-slate with a clean presentation style.", "aspect_ratio": "16:9" }

Prompt: "Create a premium creative-studio event poster for Motion Night Live. Friday, 8 PM. Warehouse 9, Delhi. Highlight that tickets are on sale now."
Response: { "templateId": "event-promo-slate", "params": { "eyebrow": "One Night Only", "title": "Motion Night Live", "subtitle": "Creative talks, visual sets, and a late-night showcase for designers, filmmakers, and animators.", "dateText": "Friday", "timeText": "8:00 PM", "venueText": "Warehouse 9", "locationText": "Delhi", "ctaLabel": "Buy Tickets", "supportLabel": "A premium studio-style event poster with bold contrast and urgency.", "badgeText": "On Sale", "visualStyle": "festival-burst", "titleColor": "#FFF7ED", "subtitleColor": "#F5D0FE", "accentColor": "#F97316", "secondaryAccentColor": "#FACC15", "cardBackground": "#1A1029", "mutedTextColor": "#D8B4FE", "metadataTextColor": "#FFF7ED", "buttonTextColor": "#120A1E", "background": { "type": "gradient", "from": "#15081C", "to": "#30104A", "direction": "radial" }, "entranceAnimation": "scale-pop", "duration": 7 }, "confidence": "high", "reasoning": "A ticketed event poster with venue, time, and strong CTA should use event-promo-slate with a creative promo treatment.", "aspect_ratio": "16:9" }

Prompt: "Create a testimonial wall showing customer love for FlowPilot with quotes from Priya, Marcus, Elena, and Jason. Make it feel like polished SaaS social proof."
Response: { "templateId": "testimonial-wall", "params": { "title": "Loved by Product Teams", "subtitle": "A wall of customer feedback from operators, founders, and growth leads.", "testimonials": [{"quote":"FlowPilot helped us cut reporting time in half within the first week.","name":"Priya Shah","role":"Head of Operations","company":"FlowPilot","rating":5,"accentColor":"#60A5FA"},{"quote":"The team picked it up immediately and our handoffs got dramatically smoother.","name":"Marcus Reed","role":"Growth Lead","company":"Northstar","rating":5,"accentColor":"#34D399"},{"quote":"It feels like the rare tool that reduces chaos instead of adding another dashboard.","name":"Elena Park","role":"Product Manager","company":"Juniper","rating":5,"accentColor":"#A78BFA"},{"quote":"We finally have one place where launches, tasks, and updates stay aligned.","name":"Jason Miller","role":"Founder","company":"Relay Labs","rating":5,"accentColor":"#F59E0B"}], "featuredIndex": 0, "visualStyle": "saas-grid", "accentColor": "#60A5FA", "secondaryAccentColor": "#F59E0B", "titleColor": "#F8FAFC", "subtitleColor": "#A7B0C0", "quoteColor": "#F8FAFC", "metaTextColor": "#CBD5E1", "mutedTextColor": "#94A3B8", "cardBackground": "#101523", "mutedCardBackground": "#0B0F1A", "cardBorderColor": "#25304A", "background": { "type": "gradient", "from": "#050816", "to": "#0E1A38", "direction": "radial" }, "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "Multiple customer quotes arranged as social proof should use testimonial-wall.", "aspect_ratio": "16:9" }

Prompt: "Create YouTube chapters for a product strategy video with sections Intro 0:00, Market Shift 0:42, Positioning 1:30, Pricing Strategy 2:18, GTM Plan 3:05, Final Takeaways 4:10. Keep it clean and editorial."
Response: { "templateId": "yt-chapters", "params": { "eyebrow": "Episode Guide", "title": "Product Strategy Breakdown", "subtitle": "A timestamped chapter index designed for fast scanning and creator-friendly navigation.", "chapters": [{"timestamp":"0:00","title":"Intro","summary":"Set the frame for the discussion.","iconId":"play","accentColor":"#2563EB"},{"timestamp":"0:42","title":"Market Shift","summary":"Context on the macro change driving the strategy.","iconId":"chart-up","accentColor":"#2563EB"},{"timestamp":"1:30","title":"Positioning","summary":"How the product stands apart in the category.","iconId":"target","accentColor":"#2563EB"},{"timestamp":"2:18","title":"Pricing Strategy","summary":"The role of tiers, packaging, and buyer perception.","iconId":"dollar","accentColor":"#2563EB"},{"timestamp":"3:05","title":"GTM Plan","summary":"Core launch and distribution approach.","iconId":"rocket","accentColor":"#2563EB"},{"timestamp":"4:10","title":"Final Takeaways","summary":"The biggest lessons and actions to carry forward.","iconId":"checkmark","accentColor":"#2563EB"}], "activeChapter": 3, "currentTimestamp":"2:18","totalDurationLabel":"6:02 total","ctaLabel":"Watch now","visualStyle":"editorial-index","accentColor":"#2563EB","secondaryAccentColor":"#C2410C","titleColor":"#0F172A","subtitleColor":"#475569","bodyColor":"#1E293B","mutedTextColor":"#64748B","panelBackground":"#FFFFFF","mutedPanelBackground":"#F8FAFC","panelBorderColor":"#CBD5E1","buttonTextColor":"#FFF7ED","background": { "type": "gradient", "from": "#F7F4EE", "to": "#E6EEF8", "direction": "to-bottom-right" }, "entranceAnimation":"slide-up","duration":7 }, "confidence":"high", "reasoning":"Timestamped chapter sections for a YouTube-style video outline should use yt-chapters.", "aspect_ratio":"16:9" }

Prompt: "Design a clean editorial testimonial wall for a consulting firm with four client quotes and reviewer names. Keep it minimal and elegant."
Response: { "templateId": "testimonial-wall", "params": { "title": "What Clients Say", "subtitle": "Selected feedback from leadership teams and transformation partners.", "testimonials": [{"quote":"Their team brought clarity to a complex transformation program and moved quickly.","name":"Amrita Rao","role":"Chief Strategy Officer","company":"Meridian","rating":5,"accentColor":"#2563EB"},{"quote":"The work was thoughtful, sharp, and unusually actionable for a leadership workshop.","name":"Daniel Ross","role":"Managing Director","company":"NorthPeak","rating":5,"accentColor":"#0F172A"},{"quote":"We left with a far more aligned operating model and a practical next-quarter roadmap.","name":"Neha Kapoor","role":"VP Operations","company":"Crestline","rating":5,"accentColor":"#64748B"},{"quote":"They helped turn broad ambition into a plan our teams could actually execute.","name":"James Cole","role":"CEO","company":"Axiom","rating":5,"accentColor":"#94A3B8"}], "featuredIndex": 1, "visualStyle": "editorial-light", "accentColor": "#2563EB", "secondaryAccentColor": "#0F172A", "titleColor": "#0F172A", "subtitleColor": "#475569", "quoteColor": "#0F172A", "metaTextColor": "#1E293B", "mutedTextColor": "#64748B", "cardBackground": "#FFFFFF", "mutedCardBackground": "#F8FAFC", "cardBorderColor": "#CBD5E1", "background": { "type": "gradient", "from": "#F7F4EE", "to": "#ECE6DC", "direction": "to-bottom-right" }, "entranceAnimation": "fade-in", "duration": 7 }, "confidence": "high", "reasoning": "A minimal wall of client quotes should use testimonial-wall with an editorial treatment.", "aspect_ratio": "16:9" }

Prompt: "Make a warm branded testimonial wall for a creative agency with glowing client quotes from founders and CMOs."
Response: { "templateId": "testimonial-wall", "params": { "title": "Trusted by Bold Brands", "subtitle": "Founder and CMO feedback from recent campaigns, launches, and rebrands.", "testimonials": [{"quote":"They gave our launch a level of emotional clarity we were struggling to reach internally.","name":"Maya Fernandez","role":"Founder","company":"Luna Studio","rating":5,"accentColor":"#F59E0B"},{"quote":"The campaign system felt premium, cinematic, and unmistakably on-brand.","name":"Leo Carter","role":"CMO","company":"Canvas & Co.","rating":5,"accentColor":"#FB7185"},{"quote":"Every touchpoint felt considered, from motion to messaging to rollout assets.","name":"Rina Patel","role":"Brand Director","company":"Northlight","rating":5,"accentColor":"#F97316"},{"quote":"We got the kind of creative confidence that normally takes months to build.","name":"Oliver Grant","role":"Founder","company":"Wildframe","rating":5,"accentColor":"#A78BFA"}], "featuredIndex": 0, "visualStyle": "warm-brand", "accentColor": "#A855F7", "secondaryAccentColor": "#F59E0B", "titleColor": "#FFF7ED", "subtitleColor": "#F5D0FE", "quoteColor": "#FFF7ED", "metaTextColor": "#FDE68A", "mutedTextColor": "#D8B4FE", "cardBackground": "#2A1022", "mutedCardBackground": "#180B18", "cardBorderColor": "#5B2140", "background": { "type": "gradient", "from": "#18071D", "to": "#3A122A", "direction": "radial" }, "entranceAnimation": "scale-pop", "duration": 7 }, "confidence": "high", "reasoning": "A branded wall of glowing founder and marketing quotes should use testimonial-wall with a warm visual treatment.", "aspect_ratio": "16:9" }

Prompt: "Text 'Hello World' appears letter by letter"
Response: { "templateId": "hero-text", "params": { "headline": "Hello World", "headlineColor": "#E2E8F0", "background": { "type": "gradient", "from": "#0A0A1A", "to": "#1A1A2E", "direction": "to-bottom" }, "entranceAnimation": "typewriter", "duration": 6, "style": "centered", "decoration": "none" }, "confidence": "high", "reasoning": "Single headline with letter-by-letter → hero-text with typewriter", "aspect_ratio": "16:9" }

Prompt: "Section title 'Chapter 3: Architecture' with subtitle 'Building scalable systems' and a blue accent line on the left"
Response: { "templateId": "section-title", "params": { "title": "Chapter 3: Architecture", "subtitle": "Building scalable systems", "accentStyle": "line-left", "accentColor": "#3B82F6", "titleColor": "#F8FAFC", "subtitleColor": "#94A3B8", "background": { "type": "gradient", "from": "#111827", "to": "#1F2937", "direction": "to-bottom" }, "entranceAnimation": "fade-in", "duration": 4 }, "confidence": "high", "reasoning": "Section heading with subtitle and accent → section-title", "aspect_ratio": "16:9" }

Prompt: "Show a bullet list of 5 key benefits: Fast performance, Easy integration, 24/7 support, Secure by default, Scalable infrastructure"
Response: { "templateId": "bullet-list", "params": { "title": "Key Benefits", "items": ["Fast performance", "Easy integration", "24/7 support", "Secure by default", "Scalable infrastructure"], "bulletStyle": "checkmark", "bulletColor": "#22C55E", "titleColor": "#F8FAFC", "textColor": "#CBD5E1", "background": { "type": "gradient", "from": "#0A1A1A", "to": "#0A2A20", "direction": "to-bottom" }, "entranceAnimation": "slide-up", "duration": 6 }, "confidence": "high", "reasoning": "List of key points → bullet-list with staggered slide-up", "aspect_ratio": "16:9" }

Prompt: "Display the quote 'The only way to do great work is to love what you do' by Steve Jobs"
Response: { "templateId": "quote-highlight", "params": { "quote": "The only way to do great work is to love what you do.", "attribution": "Steve Jobs", "attributionTitle": "Co-founder, Apple", "quoteMarkStyle": "large", "quoteColor": "#F8FAFC", "attributionColor": "#C9A96E", "accentColor": "#D4AF37", "background": { "type": "grain", "baseColor": "#0F0A05", "grainOpacity": 0.06 }, "entranceAnimation": "fade-in", "duration": 6 }, "confidence": "high", "reasoning": "Famous quote with attribution → quote-highlight", "aspect_ratio": "16:9" }

Prompt: "Show 2.5 million as a big number with label 'Downloads' and a green up trend of +18% this month"
Response: { "templateId": "data-callout", "params": { "value": 2500000, "label": "Downloads", "context": "This month's performance", "trend": "up", "trendValue": "+18%", "valueColor": "#F0FFF4", "labelColor": "#86EFAC", "contextColor": "#94A3B8", "trendUpColor": "#22C55E", "trendDownColor": "#EF4444", "background": { "type": "gradient", "from": "#0A1A0A", "to": "#152A15", "direction": "to-bottom" }, "entranceAnimation": "count-up", "duration": 6 }, "confidence": "high", "reasoning": "Big number with trend indicator → data-callout with count-up", "aspect_ratio": "16:9" }

Prompt: "Feature highlight: rocket icon, title 'Fast Deployment', description 'Deploy in seconds with one click', bullet points: 'Zero downtime', 'Auto-scaling', 'Global CDN'"
Response: { "templateId": "feature-highlight", "params": { "iconId": "rocket", "title": "Fast Deployment", "description": "Deploy in seconds with one click", "bulletPoints": ["Zero downtime", "Auto-scaling", "Global CDN"], "layout": "icon-left", "iconColor": "#FF6B35", "titleColor": "#F8FAFC", "descriptionColor": "#CBD5E1", "bulletColor": "#FF6B35", "accentColor": "#FF6B35", "background": { "type": "stripe", "baseColor": "#0D1B2A", "stripeColor": "#FF6B3510", "angle": 45, "density": "sparse" }, "entranceAnimation": "fade-in", "duration": 6 }, "confidence": "high", "reasoning": "Icon + title + description + bullets → feature-highlight", "aspect_ratio": "16:9" }

Prompt: "Split screen: left side 'Cloud' with description 'Scalable infrastructure', right side 'On-Premise' with description 'Full data control'"
Response: { "templateId": "split-screen", "params": { "left": { "title": "Cloud", "body": "Scalable infrastructure", "iconId": "cloud" }, "right": { "title": "On-Premise", "body": "Full data control", "iconId": "server" }, "dividerStyle": "line", "dividerColor": "#334155", "titleColor": "#E2E8F0", "bodyColor": "#94A3B8", "leftAccentColor": "#3B82F6", "rightAccentColor": "#8B5CF6", "background": { "type": "gradient", "from": "#0F1219", "to": "#1E2330", "direction": "to-bottom-right" }, "entranceAnimation": "slide-in", "duration": 6 }, "confidence": "high", "reasoning": "Two-panel comparison → split-screen with slide-in", "aspect_ratio": "16:9" }

Prompt: "Problem: Teams waste hours on manual deployments. Solution: Our CI/CD pipeline automates everything in minutes."
Response: { "templateId": "problem-solution", "params": { "problem": "Teams waste hours on manual deployments", "solution": "Our CI/CD pipeline automates everything in minutes", "problemIconId": "fire", "solutionIconId": "checkmark", "transitionStyle": "fade-switch", "problemColor": "#EF4444", "solutionColor": "#22C55E", "textColor": "#E2E8F0", "labelColor": "#94A3B8", "background": { "type": "gradient", "from": "#0A0A1A", "to": "#1A1A30", "direction": "to-bottom" }, "entranceAnimation": "slide-up", "duration": 7 }, "confidence": "high", "reasoning": "Problem then solution → problem-solution with fade-switch", "aspect_ratio": "16:9" }

Prompt: "Before: Manual testing with 3-day cycles. After: Automated testing with instant feedback. Show the transformation."
Response: { "templateId": "before-after", "params": { "beforeTitle": "Manual Testing", "afterTitle": "Automated Testing", "beforeItems": ["3-day test cycles", "Human error prone", "Limited coverage"], "afterItems": ["Instant feedback", "Consistent results", "Full coverage"], "revealStyle": "wipe", "beforeColor": "#EF4444", "afterColor": "#10B981", "textColor": "#E2E8F0", "background": { "type": "grain", "baseColor": "#111827", "grainOpacity": 0.05 }, "entranceAnimation": "fade-in", "duration": 7 }, "confidence": "high", "reasoning": "Before/after transformation → before-after with wipe reveal", "aspect_ratio": "16:9" }

Prompt: "Show the onboarding process: Sign Up → Verify Email → Set Profile → Start Using"
Response: { "templateId": "process-steps", "params": { "title": "Onboarding Process", "subtitle": "Get started in seconds", "steps": [{"label":"Sign Up","iconId":"user"},{"label":"Verify Email","iconId":"bell"},{"label":"Set Profile","iconId":"smartphone"},{"label":"Start Using","iconId":"arrow-right"}], "connectorStyle": "arrow", "titleColor": "#F8FAFC", "stepColor": "#818CF8", "textColor": "#CBD5E1", "numberColor": "#F8FAFC", "background": { "type": "gradient", "from": "#10101A", "to": "#1A2040", "direction": "to-right" }, "entranceAnimation": "progressive", "duration": 7 }, "confidence": "high", "reasoning": "Sequential steps with flow → process-steps with progressive animation (icons + subtitle)", "aspect_ratio": "16:9" }

Prompt: "Show our global offices on a map: New York (25%, 30%), London (45%, 22%), Tokyo (80%, 35%), Sydney (85%, 70%)"
Response: { "templateId": "map-highlight", "params": { "title": "Global Offices", "locations": [{"label":"New York","x":25,"y":30},{"label":"London","x":45,"y":22},{"label":"Tokyo","x":80,"y":35},{"label":"Sydney","x":85,"y":70}], "mapStyle": "world-dots", "markerPulse": true, "connectionLines": true, "markerColor": "#38BDF8", "titleColor": "#F8FAFC", "labelColor": "#CBD5E1", "mapColor": "#1E293B", "background": { "type": "gradient", "from": "#020010", "to": "#0A0030", "direction": "radial" }, "entranceAnimation": "progressive", "duration": 7 }, "confidence": "high", "reasoning": "Office locations on map → map-highlight with progressive markers", "aspect_ratio": "16:9" }

Prompt: "Instagram story: big bold 'Flash Sale' with subtitle '50% off today only' on a red gradient. Fade-in animation."
Response: { "templateId": "hero-text", "params": { "headline": "Flash Sale", "subheadline": "50% off today only", "headlineColor": "#FFFFFF", "subheadlineColor": "#FFE0E0", "background": { "type": "gradient", "from": "#E53935", "to": "#B71C1C", "direction": "to-bottom" }, "entranceAnimation": "fade-in", "subheadlineAnimation": "fade-in", "duration": 4, "style": "centered", "decoration": "none" }, "confidence": "high", "reasoning": "Instagram story → portrait 9:16, bold headline with subtitle → hero-text", "aspect_ratio": "9:16" }

Prompt: "Square Instagram post: pie chart showing budget split — Marketing 40%, Engineering 35%, Operations 25%. Spin animation."
Response: { "templateId": "pie-chart", "params": { "title": "Budget Split", "segments": [{"label":"Marketing","value":40,"color":"#8B5CF6"},{"label":"Engineering","value":35,"color":"#06B6D4"},{"label":"Operations","value":25,"color":"#F59E0B"}], "titleColor": "#F8FAFC", "labelColor": "#CBD5E1", "background": { "type": "gradient", "from": "#0A0A10", "to": "#1A1A28", "direction": "to-bottom" }, "entranceAnimation": "spin", "duration": 6, "showLabels": true, "showPercentages": true, "donut": false }, "confidence": "high", "reasoning": "Square Instagram post → 1:1, pie chart with budget data → pie-chart with spin", "aspect_ratio": "1:1" }

Prompt: "TikTok vertical video: big number 500K with label 'Followers' and green upward trend +25%. Count-up animation."
Response: { "templateId": "data-callout", "params": { "value": 500000, "label": "Followers", "context": "Social media growth", "trend": "up", "trendValue": "+25%", "valueColor": "#F0FFF4", "labelColor": "#86EFAC", "contextColor": "#94A3B8", "trendUpColor": "#22C55E", "trendDownColor": "#EF4444", "background": { "type": "gradient", "from": "#1A0A20", "to": "#0A1A2A", "direction": "radial" }, "entranceAnimation": "count-up", "duration": 5 }, "confidence": "high", "reasoning": "TikTok vertical → portrait 9:16, big number with trend → data-callout with count-up", "aspect_ratio": "9:16" }

Prompt: "Cinematic circle expand reveal showing 'Launching Soon' in extra large text"
Response: { "templateId": "masked-text-reveal", "params": { "headline": "Launching Soon", "headlineColor": "#F8FAFC", "accentColor": "#A855F7", "maskShape": "circle-expand", "exitStyle": "fade", "background": { "type": "gradient", "from": "#050510", "to": "#0A0A20", "direction": "to-bottom" }, "fontSize": "xlarge", "duration": 6 }, "confidence": "high", "reasoning": "Circle expand reveal of text → masked-text-reveal with circle-expand mask", "aspect_ratio": "16:9" }

Prompt: "Spotlight showcase for a rocket icon with title 'Launch Faster' and description 'Deploy in seconds', orbiting rings, blue glow on dark gradient"
Response: { "templateId": "dynamic-showcase", "params": { "iconId": "rocket", "title": "Launch Faster", "description": "Deploy in seconds", "titleColor": "#F8FAFC", "accentColor": "#38BDF8", "glowColor": "#2563EB", "orbitStyle": "rings", "orbitCount": 5, "background": { "type": "gradient", "from": "#0A1628", "to": "#162844", "direction": "radial" }, "layout": "center", "duration": 7 }, "confidence": "high", "reasoning": "Product spotlight with icon and orbiting elements → dynamic-showcase", "aspect_ratio": "16:9" }

Prompt: "Layered parallax scene: title 'Our Journey', strong depth intensity, rightward motion, dots foreground, cyan accent on dark blue gradient"
Response: { "templateId": "parallax-showcase", "params": { "title": "Our Journey", "titleColor": "#E2E8F0", "accentColor": "#22D3EE", "parallaxDirection": "right", "depthIntensity": "strong", "foregroundStyle": "dots", "background": { "type": "gradient", "from": "#000A1A", "to": "#001530", "direction": "to-right" }, "entranceAnimation": "clip-reveal", "duration": 8 }, "confidence": "high", "reasoning": "Layered depth with rightward parallax → parallax-showcase with right direction and dots foreground", "aspect_ratio": "16:9" }

MULTI-SCENE RULES:
If the user describes MULTIPLE DISTINCT content segments that should appear SEQUENTIALLY (e.g., "show title, then chart, then counter"), decompose into multiple scenes.
- Each scene gets its own templateId and params.
- Each scene MUST include a "duration" in its params.
- Use "transition" to specify how scenes connect:
  - "crossfade" (0.5s smooth blend between scenes — DEFAULT)
  - "cut" (instant switch, no transition)
  - "fade-through-black" (fade out to black, then fade in next scene)
- Duration allocation guidelines:
  - Title/hero scenes: 3-4s
  - Data scenes (charts, counters): 5-7s
  - Text-heavy scenes (quotes, comparisons): 5-6s
- If only ONE scene is needed, use the single-scene format (no "scenes" array).

COMPOSITE SCENE RULES:
If the user wants multiple data visualizations or content blocks IN THE SAME FRAME at the same time (e.g., "chart on left, stats on right"), use a composite layout.
- Available layouts: "split-horizontal" (left|right 50/50), "split-vertical" (top/bottom 50/50), "main-sidebar" (2/3|1/3), "grid-2x2" (4 quadrants)
- Each region gets its own templateId and params.
- Provide a shared "background" for the composite scene.
- Use matching/complementary backgrounds across regions for visual consistency.
- A composite scene goes inside the "scenes" array.

MULTI-SCENE FEW-SHOT EXAMPLES:

Prompt: "Show title 'Q3 Results', then a bar chart of sales Q1=100 Q2=150 Q3=200, then total revenue counter showing 450"
Response: { "scenes": [{ "templateId": "hero-text", "params": { "headline": "Q3 Results", "headlineColor": "#FFFFFF", "background": { "type": "gradient", "from": "#1A1A2E", "to": "#16213E", "direction": "to-bottom" }, "entranceAnimation": "fade-in", "duration": 3, "style": "centered", "decoration": "none" }, "transition": "crossfade" }, { "templateId": "bar-chart", "params": { "title": "Quarterly Sales", "bars": [{"label":"Q1","value":100,"color":"#4FC3F7"},{"label":"Q2","value":150,"color":"#81C784"},{"label":"Q3","value":200,"color":"#FFB74D"}], "background": { "type": "gradient", "from": "#1A1A2E", "to": "#16213E", "direction": "to-bottom" }, "entranceAnimation": "grow", "duration": 5, "showValues": true }, "transition": "crossfade" }, { "templateId": "stat-counter", "params": { "value": 450, "label": "Total Revenue", "background": { "type": "gradient", "from": "#1A1A2E", "to": "#16213E", "direction": "to-bottom" }, "entranceAnimation": "count-up", "duration": 4 }, "transition": "cut" }], "confidence": "high", "reasoning": "Three distinct sequential segments → hero-text, bar-chart, stat-counter with crossfade transitions", "aspect_ratio": "16:9" }

Prompt: "Bar chart on the left showing sales, pie chart on the right showing market share"
Response: { "scenes": [{ "layout": "split-horizontal", "regions": [{ "templateId": "bar-chart", "params": { "title": "Sales", "bars": [{"label":"Q1","value":120,"color":"#4FC3F7"},{"label":"Q2","value":180,"color":"#81C784"},{"label":"Q3","value":95,"color":"#FFB74D"}], "background": { "type": "solid", "color": "#111111" }, "entranceAnimation": "grow", "duration": 7, "showValues": true } }, { "templateId": "pie-chart", "params": { "title": "Market Share", "segments": [{"label":"Apple","value":35,"color":"#4FC3F7"},{"label":"Samsung","value":25,"color":"#81C784"},{"label":"Others","value":40,"color":"#B0BEC5"}], "background": { "type": "solid", "color": "#111111" }, "entranceAnimation": "spin", "duration": 7, "showLabels": true, "showPercentages": true, "donut": false } }], "background": { "type": "solid", "color": "#111111" }, "duration": 7, "transition": "cut" }], "confidence": "high", "reasoning": "Two charts side by side → split-horizontal composite layout", "aspect_ratio": "16:9" }

OUTPUT FORMAT: Return ONLY valid JSON matching ONE of these schemas:

SINGLE SCENE (use when prompt describes one content segment):
{
  "templateId": "string (one of the available template IDs)",
  "params": { ... template-specific parameters ... },
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of why this template was chosen",
  "aspect_ratio": "16:9" (optional, default "16:9")
}

MULTI-SCENE (use when prompt describes multiple sequential or composite segments):
{
  "scenes": [
    {
      "templateId": "string",
      "params": { ... },
      "duration": number,
      "transition": "crossfade" | "cut" | "fade-through-black"
    }
  ],
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation",
  "aspect_ratio": "16:9" (optional, default "16:9")
}

For composite scenes within the scenes array, replace templateId/params with:
{
  "layout": "split-horizontal" | "split-vertical" | "main-sidebar" | "grid-2x2",
  "regions": [{ "templateId": "...", "params": { ... } }, ...],
  "background": { ... },
  "duration": number,
  "transition": "crossfade" | "cut" | "fade-through-black"
}`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT
    .replace("{TEMPLATE_LIST}", getTemplateDescriptions())
    .replace("{TEMPLATE_IDS}", getTemplateIds().join(", "));
}

export type AnalyzerResult = IntentResult | MultiSceneResult;

/**
 * Type guard: returns true if the LLM returned a multi-scene result.
 */
export function isMultiSceneResult(result: AnalyzerResult): result is MultiSceneResult {
  return "scenes" in result && Array.isArray((result as MultiSceneResult).scenes);
}

function promptLooksLikeCreativeFallbackCandidate(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return [
    "cinematic",
    "trailer",
    "teaser",
    "luxury",
    "abstract",
    "fashion",
    "streetwear",
    "runway",
    "editorial",
    "brand film",
    "brand-film",
    "campaign film",
    "campaign video",
    "perfume",
    "skincare",
    "beauty ad",
    "supercar",
    "silhouette",
    "spotlight",
    "moody",
    "high-end",
  ].some((term) => normalized.includes(term));
}

function promptHasExplicitDeterministicTemplateAnchor(prompt: string): boolean {
  return /(pricing|tiers|plans|testimonial|reviews|wall of love|event|conference|webinar|summit|register|tickets|save the date|bar chart|line chart|pie chart|donut chart|market share|counter|kpi|metric|timeline|roadmap|milestones|process|workflow|step\b|steps\b|before[ -]?after|comparison|compare|quote|bullet list|loading screen|breaking news|news ticker|stream|masked text|wipe reveal|circle reveal|parallax|product spotlight|feature showcase|orbiting elements|newspaper|front page|front-page|headline edition|newspaper cover|historic newspaper|archival editorial|old-print)/i.test(prompt);
}

function downgradeBorderlineCreativeMatch(prompt: string, result: AnalyzerResult): AnalyzerResult {
  if (!promptLooksLikeCreativeFallbackCandidate(prompt)) return result;
  if (promptHasExplicitDeterministicTemplateAnchor(prompt)) return result;

  const downgradeReason =
    "Borderline cinematic / brand-film style prompt should fall back unless the template match is exceptionally clear.";

  if (isMultiSceneResult(result)) {
    if (result.confidence === "high") {
      return {
        ...result,
        confidence: "medium",
        reasoning: downgradeReason + " " + result.reasoning,
      };
    }
    return result;
  }

  const likelyOverfitTemplateIds = new Set([
    "hero-text",
    "cinematic-hero",
    "cinematic-transition",
    "dynamic-showcase",
    "parallax-showcase",
    "masked-text-reveal",
  ]);

  if (result.confidence === "high" && likelyOverfitTemplateIds.has(result.templateId)) {
    return {
      ...result,
      confidence: "medium",
      reasoning: downgradeReason + " " + result.reasoning,
    };
  }

  return result;
}

/**
 * Validates all scenes in a multi-scene result against their template schemas.
 * Returns an array of error strings (empty = valid).
 */
function validateMultiSceneParams(result: MultiSceneResult): string[] {
  const errors: string[] = [];

  for (let i = 0; i < result.scenes.length; i++) {
    const scene: SceneDefinition = result.scenes[i];

    if (isCompositeScene(scene)) {
      // Validate each region's params
      for (let r = 0; r < (scene.regions?.length ?? 0); r++) {
        const region = scene.regions![r];
        const regionErrors = validateTemplateParams(region.templateId, region.params);
        for (const err of regionErrors) {
          errors.push(`scene[${i}].region[${r}].${region.templateId}: ${err}`);
        }
      }
    } else if (scene.templateId) {
      // Single-template scene — validate params
      const sceneParams = scene.params ?? {};
      // Inject duration into params if not present (scene.duration is at scene level)
      if (scene.duration && !sceneParams.duration) {
        sceneParams.duration = scene.duration;
      }
      const sceneErrors = validateTemplateParams(scene.templateId, sceneParams);
      for (const err of sceneErrors) {
        errors.push(`scene[${i}].${scene.templateId}: ${err}`);
      }
    }
  }

  return errors;
}

export async function analyzeIntent(prompt: string): Promise<AnalyzerResult> {
  // Heuristic fallback: when OpenAI is unavailable/broken, still route
  // obvious "numbered onboarding steps" prompts to process-steps so the
  // template (and current-step highlighting) works reliably.

  function maybeInjectDeliveryProcessStepIconsEarly(p: string, result: IntentResult): void {
    if (result.templateId !== "process-steps") return;
    const l = p.toLowerCase();
    const wantsDelivery =
      l.includes("delivery") ||
      l.includes("out for delivery") ||
      l.includes("on the way") ||
      l.includes("order") ||
      l.includes("track") ||
      l.includes("shipped") ||
      l.includes("prepar") ||
      l.includes("prepared") ||
      l.includes("delivered");
    if (!wantsDelivery) return;
    const stepsAny = result.params?.steps;
    if (!Array.isArray(stepsAny)) return;

    const normalizedToIcon = (label: string): string | undefined => {
      const ll = label.toLowerCase();
      if (ll.includes("order placed") || ll.includes("placed") || ll.includes("order")) return "checkmark";
      if (ll.includes("prepar") || ll.includes("being prepared")) return "gear";
      if (ll.includes("out for delivery") || ll.includes("on the way") || ll.includes("deliver")) return "truck";
      if (ll.includes("delivered") || ll.includes("complete") || ll.includes("received")) return "home";
      return undefined;
    };

    result.params = {
      ...result.params,
      steps: stepsAny.map((s: unknown, i: number) => {
        if (!s || typeof s !== "object") return s;
        const step = s as Record<string, unknown>;
        if (typeof step.iconId === "string" && step.iconId.trim()) return step;
        const label = typeof step.label === "string" ? step.label : "";
        const inferred = normalizedToIcon(label);
        if (inferred) return { ...step, iconId: inferred };
        const fallback = [undefined, "checkmark", "gear", "truck", "home"][i + 1];
        return fallback ? { ...step, iconId: fallback } : step;
      }),
    };
  }

  const heuristic = heuristicProcessStepsIntent(prompt);
  if (heuristic) {
    maybeInjectDeliveryProcessStepIconsEarly(prompt, heuristic);
    return heuristic;
  }

  // Heuristic fallback for simple text animations (so we don't need OpenAI
  // just to pick hero-text and set headline).
  const textHeuristic = heuristicHeroTextFromTextAnimation(prompt);
  if (textHeuristic) return textHeuristic;

  // Heuristic fallback for obvious 3-tier pricing prompts so they stay on
  // the template path even when the model drifts toward older card layouts.
  const pricingHeuristic = heuristicPricingComparisonIntent(prompt);
  if (pricingHeuristic) return pricingHeuristic;

  // Heuristic fallback for obvious newspaper / front-page prompts so they stay
  // on the deterministic template path instead of being downgraded into Hera.
  const newspaperHeuristic = heuristicNewspaperFrontPageIntent(prompt);
  if (newspaperHeuristic) return newspaperHeuristic;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const MAX_RETRIES = 2;
  let lastError = "";

  function maybeInjectDeliveryProcessStepIcons(p: string, result: IntentResult): void {
    if (result.templateId !== "process-steps") return;
    const l = p.toLowerCase();
    const wantsDelivery =
      l.includes("delivery") ||
      l.includes("out for delivery") ||
      l.includes("on the way") ||
      l.includes("order") ||
      l.includes("track") ||
      l.includes("shipped") ||
      l.includes("prepar") ||
      l.includes("prepared") ||
      l.includes("delivered");
    if (!wantsDelivery) return;
    const stepsAny = result.params?.steps;
    if (!Array.isArray(stepsAny)) return;

    const normalizedToIcon = (label: string): string | undefined => {
      const ll = label.toLowerCase();
      if (ll.includes("order placed") || ll.includes("placed") || ll.includes("order")) return "checkmark";
      if (ll.includes("prepar") || ll.includes("being prepared")) return "gear";
      if (ll.includes("out for delivery") || ll.includes("on the way") || ll.includes("deliver")) return "truck";
      if (ll.includes("delivered") || ll.includes("complete") || ll.includes("received")) return "home";
      return undefined;
    };

    result.params = {
      ...result.params,
      steps: stepsAny.map((s: unknown, i: number) => {
        if (!s || typeof s !== "object") return s;
        const step = s as Record<string, unknown>;
        if (typeof step.iconId === "string" && step.iconId.trim()) return step;
        const label = typeof step.label === "string" ? step.label : "";
        const inferred = normalizedToIcon(label);
        if (inferred) return { ...step, iconId: inferred };
        // Fallback by progression index for delivery-style step sets.
        const fallback = [undefined, "checkmark", "gear", "truck", "home"][i + 1];
        return fallback ? { ...step, iconId: fallback } : step;
      }),
    };
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: prompt },
      ];

      // On retry, include validation errors
      if (attempt > 0 && lastError) {
        messages.push({
          role: "user",
          content: "The previous response had validation errors: " + lastError + "\nPlease fix the params and try again.",
        });
      }

      const response = await client.responses.create({
        model: "gpt-4o",
        temperature: 0,
        input: messages,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (response.output[0] as any).content[0].text as string;
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed: AnalyzerResult;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = "Invalid JSON: " + (parseErr as Error).message;
        if (attempt < MAX_RETRIES) continue;
        return {
          templateId: "",
          params: {},
          confidence: "low",
          reasoning: "Failed to parse LLM response: " + lastError,
        };
      }

      // Multi-scene result — validate each scene's params before returning
      parsed = downgradeBorderlineCreativeMatch(prompt, parsed);
      if (isMultiSceneResult(parsed)) {
        const msErrors = validateMultiSceneParams(parsed);
        if (msErrors.length === 0) {
          return parsed;
        }
        lastError = msErrors.join("; ");
        if (attempt < MAX_RETRIES) continue;
        // If validation keeps failing, return as low confidence
        parsed.confidence = "low";
        parsed.reasoning = "Multi-scene param validation failed after retries: " + lastError;
        return parsed;
      }

      // Single-scene: validate the params against the template schema
      const singleResult = parsed as IntentResult;
      if (singleResult.templateId && singleResult.confidence === "high") {
        const errors = validateTemplateParams(singleResult.templateId, singleResult.params);
        if (errors.length > 0) {
          lastError = errors.join("; ");
          if (attempt < MAX_RETRIES) continue;
          // Return as low confidence if validation keeps failing
          singleResult.confidence = "low";
          singleResult.reasoning = "Param validation failed after retries: " + lastError;
        }
      }

      maybeInjectDeliveryProcessStepIcons(prompt, singleResult);
      return singleResult;
    } catch (err) {
      lastError = (err as Error).message;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
    }
  }

  return {
    templateId: "",
    params: {},
    confidence: "low",
    reasoning: "Intent analysis failed: " + lastError,
  };
}

function heuristicProcessStepsIntent(prompt: string): IntentResult | null {
  const normalized = prompt.toLowerCase();

  const hasOnboardingHints =
    normalized.includes("onboarding") ||
    normalized.includes("on-boarding") ||
    normalized.includes("on board") ||
    normalized.includes("signup") ||
    normalized.includes("sign up") ||
    normalized.includes("step") ||
    normalized.includes("steps");

  if (!hasOnboardingHints) return null;

  // Extract step numbers (e.g. "step 1", "step 2", ...)
  const stepNums: number[] = [];
  const seen = new Set<number>();
  const stepRegex = /step\s*(\d{1,2})/gim;
  let match: RegExpExecArray | null = null;
  while ((match = stepRegex.exec(prompt)) !== null) {
    const n = Number(match[1]);
    if (!Number.isFinite(n)) continue;
    if (n < 1 || n > 6) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    stepNums.push(n);
  }

  if (stepNums.length < 3) return null;

  // Parse UI-added constraints if present.
  const durationMatch = prompt.match(/Total duration:\s*(\d+)\s*s/i);
  const durationRaw = durationMatch ? Number(durationMatch[1]) : undefined;
  const durationSec = typeof durationRaw === "number" && Number.isFinite(durationRaw)
    ? Math.min(15, Math.max(3, Math.round(durationRaw)))
    : undefined;

  const aspectMatch = prompt.match(/Aspect ratio:\s*([0-9]+:[0-9]+)/i);
  const aspect_ratio = aspectMatch?.[1]?.trim() || "16:9";

  // If user explicitly says "highlight step X", set currentStep.
  const explicitCurrentStep =
    (() => {
      const m =
        prompt.match(/highlight\s*(?:current\s*)?step\s*(\d{1,2})/i) ||
        prompt.match(/current\s*step\s*(\d{1,2})/i) ||
        prompt.match(/highlight\s*step\s*(\d{1,2})/i);
      if (!m) return null;
      const n = Number(m[1]);
      if (!Number.isFinite(n)) return null;
      if (n < 1 || n > 6) return null;
      return n;
    })() ?? undefined;

  return {
    templateId: "process-steps",
    confidence: "high",
    reasoning: "Heuristic: detected numbered onboarding steps prompt",
    aspect_ratio,
    params: {
      entranceAnimation: "progressive",
      connectorStyle: "arrow",
      duration: durationSec ?? 7,
      steps: stepNums.map((n) => ({ label: "Step " + n })),
      ...(typeof explicitCurrentStep === "number" ? { currentStep: explicitCurrentStep } : {}),
    },
  };
}

function heuristicHeroTextFromTextAnimation(prompt: string): IntentResult | null {
  const normalized = prompt.toLowerCase();

  const looksLikeTextAnimation =
    normalized.includes("text animation") ||
    normalized.includes("animate text") ||
    normalized.includes("typewriter") ||
    normalized.includes("letter by letter") ||
    normalized.includes("character by character");

  if (!looksLikeTextAnimation) return null;

  // Try to extract the first quoted phrase.
  // Handles both straight quotes "..." and curly quotes “...”.
  const quoted =
    prompt.match(/["“]([^"”]{1,120})["”]/)?.[1]?.trim() ||
    prompt.match(/saying\s+["“]([^"”]{1,120})["”]/i)?.[1]?.trim();

  const headline = quoted && quoted.length > 0 ? quoted : null;
  if (!headline) return null;

  const durationMatch = prompt.match(/Total duration:\s*(\d+)\s*s/i);
  const durationRaw = durationMatch ? Number(durationMatch[1]) : undefined;
  const durationSec = typeof durationRaw === "number" && Number.isFinite(durationRaw)
    ? Math.min(15, Math.max(2, Math.round(durationRaw)))
    : undefined;

  const aspectMatch = prompt.match(/Aspect ratio:\s*([0-9]+:[0-9]+)/i);
  const aspect_ratio = aspectMatch?.[1]?.trim() || "16:9";

  const entranceAnimation =
    normalized.includes("typewriter") ||
    normalized.includes("letter by letter") ||
    normalized.includes("character by character")
      ? "typewriter"
      : "typewriter";

  return {
    templateId: "hero-text",
    confidence: "high",
    reasoning: "Heuristic: detected simple text animation prompt with quoted headline",
    aspect_ratio,
    params: {
      headline,
      entranceAnimation,
      duration: durationSec ?? 6,
      style: "centered",
      decoration: "none",
    },
  };
}

function heuristicPricingComparisonIntent(prompt: string): IntentResult | null {
  const normalized = prompt.toLowerCase();

  const hasPricingIntent =
    normalized.includes("pricing") ||
    normalized.includes("pricing table") ||
    normalized.includes("pricing comparison") ||
    normalized.includes("3-tier") ||
    normalized.includes("three-tier") ||
    normalized.includes("plan") ||
    normalized.includes("plans") ||
    normalized.includes("tier") ||
    normalized.includes("tiers") ||
    normalized.includes("package") ||
    normalized.includes("packages") ||
    normalized.includes("best value") ||
    normalized.includes("recommended") ||
    normalized.includes("smartest choice");

  if (!hasPricingIntent) return null;

  const priceTokens = Array.from(prompt.matchAll(/\$[\d,]+(?:\s*\/\s*[A-Za-z]+)?/g));
  const wantsThreePlans =
    /(?:three|3)\s+(?:plans|tiers|packages|cards)/i.test(prompt) ||
    normalized.includes("middle one") ||
    normalized.includes("middle card") ||
    normalized.includes("highlight pro") ||
    normalized.includes("highlight growth") ||
    normalized.includes("highlight brand");

  if (!wantsThreePlans && priceTokens.length < 3) return null;

  const toTitleCase = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((word) => {
        if (word.toUpperCase() === word && word.length <= 5) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");

  const splitPriceToken = (value: string): { price: string; priceSuffix?: string } => {
    const compact = value.replace(/\s+/g, "");
    const parts = compact.split("/");
    return parts.length > 1
      ? { price: parts[0], priceSuffix: `/${parts.slice(1).join("/")}` }
      : { price: compact };
  };

  const extractNamedPlans = (): Array<{ name: string; price: string; priceSuffix?: string }> => {
    const patterns = [
      /([A-Za-z][A-Za-z0-9&+/-]*(?:\s+[A-Za-z][A-Za-z0-9&+/-]*){0,2})\s+at\s+(\$[\d,]+(?:\s*\/\s*[A-Za-z]+)?)/gi,
      /([A-Za-z][A-Za-z0-9&+/-]*(?:\s+[A-Za-z][A-Za-z0-9&+/-]*){0,2})\s*[-:]\s*(\$[\d,]+(?:\s*\/\s*[A-Za-z]+)?)/gi,
    ];
    const results: Array<{ name: string; price: string; priceSuffix?: string }> = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
      let match: RegExpExecArray | null = null;
      while ((match = pattern.exec(prompt)) !== null) {
        const name = toTitleCase(match[1]);
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const priceParts = splitPriceToken(match[2]);
        results.push({ name, ...priceParts });
      }
    }

    return results.slice(0, 3);
  };

  const extractListedNames = (): string[] => {
    const listMatch = prompt.match(/(?:three|3)\s+(?:plans|tiers|packages)\s*:\s*([^.!?\n]+)/i);
    if (!listMatch) return [];
    return listMatch[1]
      .split(/,|and/gi)
      .map((part) => toTitleCase(part.replace(/[^A-Za-z0-9&+/\-\s]/g, "").trim()))
      .filter(Boolean)
      .slice(0, 3);
  };

  const inferredHighlightName =
    prompt.match(/highlight\s+([A-Za-z][A-Za-z0-9&+\-/ ]{1,24})/i)?.[1] ||
    prompt.match(/emphas(?:i|y)ze\s+([A-Za-z][A-Za-z0-9&+\-/ ]{1,24})/i)?.[1] ||
    prompt.match(/recommended\s+([A-Za-z][A-Za-z0-9&+\-/ ]{1,24})/i)?.[1] ||
    prompt.match(/best value(?:\s+is|\s*[:=-])?\s+([A-Za-z][A-Za-z0-9&+\-/ ]{1,24})/i)?.[1] ||
    undefined;

  const visualStyle = (() => {
    if (
      normalized.includes("investor") ||
      normalized.includes("boardroom") ||
      normalized.includes("executive") ||
      normalized.includes("b2b") ||
      normalized.includes("polished pricing slide")
    ) {
      return "investor-clean" as const;
    }
    if (
      normalized.includes("agency") ||
      normalized.includes("studio") ||
      normalized.includes("creative") ||
      normalized.includes("brand package") ||
      normalized.includes("premium package")
    ) {
      return "creative-studio" as const;
    }
    return "saas-dark" as const;
  })();

  const namedPlans = extractNamedPlans();
  const listedNames = extractListedNames();
  const defaultPlans = [
    { name: "Basic", price: "$19", priceSuffix: "/month" },
    { name: "Pro", price: "$49", priceSuffix: "/month" },
    { name: "Enterprise", price: "Custom" },
  ];

  const plans =
    namedPlans.length >= 3
      ? namedPlans
      : listedNames.length >= 3
        ? listedNames.map((name, index) => ({
            ...(defaultPlans[index] ?? defaultPlans[Math.min(index, defaultPlans.length - 1)]),
            name,
          }))
        : priceTokens.length >= 3
          ? priceTokens.slice(0, 3).map((token, index) => ({
              name: defaultPlans[index].name,
              ...splitPriceToken(token[0]),
            }))
          : defaultPlans;

  if (plans.length < 3) return null;

  const highlightIndex = (() => {
    const hint = inferredHighlightName ? toTitleCase(inferredHighlightName).toLowerCase() : "";
    const hintedIndex = hint ? plans.findIndex((plan) => plan.name.toLowerCase() === hint) : -1;
    if (hintedIndex >= 0) return hintedIndex;
    return 1;
  })();

  const featurePool = [
    normalized.includes("seat") ? "Team seats" : "Users",
    normalized.includes("export") ? "Exports" : "Core features",
    normalized.includes("integration") ? "Integrations" : "Automation tools",
    normalized.includes("support") ? "Support" : "Priority support",
    normalized.includes("analytics") ? "Analytics" : "Analytics dashboard",
  ];

  const uniqueFeatures = Array.from(new Set(featurePool)).slice(0, 5);
  while (uniqueFeatures.length < 5) {
    uniqueFeatures.push(`Feature ${uniqueFeatures.length + 1}`);
  }

  const buildPlanFeatures = (planIndex: number) =>
    uniqueFeatures.map((label, featureIndex) => ({
      label,
      included: planIndex === 2 ? true : planIndex === 1 ? true : featureIndex < 3,
      ...(planIndex === highlightIndex && featureIndex === Math.min(3, uniqueFeatures.length - 1)
        ? { emphasis: true }
        : {}),
    }));

  const subject =
    prompt.match(/\bfor\s+an?\s+([^,.]+)/i)?.[1]?.trim() ||
    prompt.match(/\bfor\s+([^,.]+)/i)?.[1]?.trim() ||
    "";

  const title =
    normalized.includes("agency") || normalized.includes("studio")
      ? "Service Packages"
      : visualStyle === "investor-clean"
        ? "Investment Tiers"
        : "Pricing Plans";
  const subtitle =
    subject
      ? `Designed for ${subject}`
      : visualStyle === "creative-studio"
        ? "Three signature packages with a standout center offer"
        : visualStyle === "investor-clean"
          ? "A structured pricing slide with a recommended growth tier"
          : "Three plans with a clear recommended tier";

  const accentColors =
    visualStyle === "creative-studio"
      ? ["#7C3AED", "#F97316", "#FACC15"]
      : visualStyle === "investor-clean"
        ? ["#94A3B8", "#2563EB", "#0F172A"]
        : ["#64748B", "#60A5FA", "#A78BFA"];
  const badges = ["Starter", "Best Value", "Scale"];
  const ctas = ["Choose plan", "Start now", "Talk to sales"];

  const palette =
    visualStyle === "investor-clean"
      ? {
          background: { type: "gradient" as const, from: "#F7F4EE", to: "#EAE5DC", direction: "to-bottom-right" as const },
          titleColor: "#0F172A",
          subtitleColor: "#475569",
          planNameColor: "#0F172A",
          priceColor: "#020617",
          mutedTextColor: "#64748B",
          featureTextColor: "#1E293B",
          cardBackground: "#FFFFFF",
          mutedCardBackground: "#F8FAFC",
          cardBorderColor: "#CBD5E1",
          iconColor: "#0F172A",
          includedColor: "#2563EB",
          excludedColor: "#94A3B8",
          buttonTextColor: "#FFFFFF",
        }
      : visualStyle === "creative-studio"
        ? {
            background: { type: "gradient" as const, from: "#15081C", to: "#30104A", direction: "radial" as const },
            titleColor: "#FFF7ED",
            subtitleColor: "#F5D0FE",
            planNameColor: "#FFF7ED",
            priceColor: "#FFFFFF",
            mutedTextColor: "#D8B4FE",
            featureTextColor: "#FEF3C7",
            cardBackground: "#1A1029",
            mutedCardBackground: "#120A1E",
            cardBorderColor: "#5B21B6",
            iconColor: "#FFF7ED",
            includedColor: "#F97316",
            excludedColor: "#A78BFA",
            buttonTextColor: "#120A1E",
          }
        : {
            background: { type: "gradient" as const, from: "#070B1A", to: "#101C3A", direction: "radial" as const },
            titleColor: "#F8FAFC",
            subtitleColor: "#A7B0C0",
            planNameColor: "#F8FAFC",
            priceColor: "#FFFFFF",
            mutedTextColor: "#9FB0C6",
            featureTextColor: "#EEF2FF",
            cardBackground: "#101523",
            mutedCardBackground: "#0B0F1A",
            cardBorderColor: "#25304A",
            iconColor: "#FFFFFF",
            includedColor: "#4ADE80",
            excludedColor: "#6B7280",
            buttonTextColor: "#0B1020",
          };

  const aspectMatch = prompt.match(/Aspect ratio:\s*([0-9]+:[0-9]+)/i);
  const aspect_ratio = aspectMatch?.[1]?.trim() || "16:9";

  return {
    templateId: "pricing-comparison",
    confidence: "high",
    reasoning: "Heuristic: detected an obvious three-plan pricing prompt with a recommended tier",
    aspect_ratio,
    params: {
      title,
      subtitle,
      visualStyle,
      plans: plans.slice(0, 3).map((plan, index) => ({
        name: plan.name,
        price: plan.price,
        ...(plan.priceSuffix ? { priceSuffix: plan.priceSuffix } : {}),
        description:
          index === 0 ? "For individuals or small teams" : index === 1 ? "Recommended for growing teams" : "For larger organizations",
        badge: index === highlightIndex ? "Best Value" : badges[index] ?? "Plan",
        accentColor: accentColors[index] ?? accentColors[1],
        ctaLabel: ctas[index] ?? "Choose plan",
        features: buildPlanFeatures(index),
      })),
      highlightedPlan: highlightIndex,
      highlightLabel: "Best Value",
      comparisonNote:
        visualStyle === "creative-studio"
          ? "Package lineup with a strong featured middle offer."
          : visualStyle === "investor-clean"
            ? "Structured plan comparison for a presentation-ready pricing slide."
            : "Three-tier pricing comparison with a recommended middle plan.",
      background: palette.background,
      titleColor: palette.titleColor,
      subtitleColor: palette.subtitleColor,
      planNameColor: palette.planNameColor,
      priceColor: palette.priceColor,
      mutedTextColor: palette.mutedTextColor,
      featureTextColor: palette.featureTextColor,
      cardBackground: palette.cardBackground,
      mutedCardBackground: palette.mutedCardBackground,
      cardBorderColor: palette.cardBorderColor,
      iconColor: palette.iconColor,
      includedColor: palette.includedColor,
      excludedColor: palette.excludedColor,
      buttonTextColor: palette.buttonTextColor,
      entranceAnimation: "slide-up",
      duration: 7,
    },
  };
}

function heuristicNewspaperFrontPageIntent(prompt: string): IntentResult | null {
  const normalized = prompt.toLowerCase();

  const hasNewspaperIntent =
    /\bnewspaper\b/.test(normalized) ||
    /\bfront[ -]?page\b/.test(normalized) ||
    /\bnewspaper cover\b/.test(normalized) ||
    /\bheadline edition\b/.test(normalized) ||
    /\bbreaking edition\b/.test(normalized) ||
    /\bextra edition\b/.test(normalized) ||
    /\barchive edition\b/.test(normalized) ||
    /\bcover story\b/.test(normalized) ||
    /\bnewsprint\b/.test(normalized) ||
    /\btabloid\b/.test(normalized);

  if (!hasNewspaperIntent) return null;

  const visualStyle = (() => {
      if (
        normalized.includes("historic") ||
        normalized.includes("vintage") ||
        normalized.includes("archival") ||
        normalized.includes("old-print") ||
        normalized.includes("moon landing")
      ) {
        return "historic-edition" as const;
      }
      if (
        normalized.includes("finance") ||
        normalized.includes("financial") ||
        normalized.includes("market") ||
        normalized.includes("economy") ||
        normalized.includes("earnings") ||
        normalized.includes("business")
      ) {
        return "financial-journal" as const;
      }
      if (
        normalized.includes("sports") ||
        normalized.includes("champions") ||
        normalized.includes("underdogs") ||
        normalized.includes("upset") ||
        normalized.includes("final") ||
        normalized.includes("match") ||
        normalized.includes("league")
      ) {
        return "sports-daily" as const;
      }
      if (
        normalized.includes("tabloid") ||
        normalized.includes("celebrity") ||
        normalized.includes("scandal") ||
        normalized.includes("exclusive") ||
        normalized.includes("sensational")
      ) {
        return "tabloid-shock" as const;
      }
      if (
        normalized.includes("breaking-news") ||
        normalized.includes("breaking news") ||
        normalized.includes("market crash") ||
        normalized.includes("crash") ||
      normalized.includes("urgent") ||
      normalized.includes("dramatic")
    ) {
      return "modern-breaking-news" as const;
    }
    return "classic-front-page" as const;
  })();

  const titleCase = (value: string) =>
    value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();

  const extractProductOrSubject = () =>
    prompt.match(/called\s+([^,.!?\n]+)/i)?.[1]?.trim() ||
    prompt.match(/covering\s+([^,.!?\n]+)/i)?.[1]?.trim() ||
    prompt.match(/about\s+([^,.!?\n]+)/i)?.[1]?.trim() ||
    prompt.match(/:\s*([^.!?\n]+)/)?.[1]?.trim() ||
    "";

  const subject = extractProductOrSubject();

  const deriveHeadline = (): string => {
    if (normalized.includes("moon landing")) return "Men Walk On Moon";
    if (normalized.includes("market crash")) return "Global Market Crash";
    if (normalized.includes("100 million users")) return "100 Million Users In 60 Days";
    if (normalized.includes("product launch") && subject) {
      return `${titleCase(subject)} Arrives`;
    }
    if (subject) {
      return titleCase(subject);
    }
    return "Extra! Historic News!";
  };

  const deriveSubheadline = (): string => {
    if (normalized.includes("moon landing")) {
      return "Astronauts land on plain; collect rocks, plant flag.";
    }
    if (normalized.includes("market crash")) {
      return "Investors react as markets swing and uncertainty spreads.";
    }
    if (normalized.includes("100 million users")) {
      return "AI startup shatters adoption records as growth accelerates worldwide.";
    }
    if (normalized.includes("product launch")) {
      return "A landmark launch story unfolds with momentum, speculation, and market attention.";
    }
    return "A major story unfolds as events draw widespread public attention.";
  };

  const buildColumns = () => {
    if (normalized.includes("moon landing")) {
      return [
        {
          title: "A Giant Leap",
          text:
            "Astronaut Neil Armstrong descends the ladder as millions watch. The mission marks a defining moment in space exploration and global history.",
        },
        {
          title: "Mission Details",
          text:
            "Early reports describe a successful landing, measured movement on the lunar surface, and careful collection of early samples.",
        },
        {
          title: "World Watches",
          text:
            "Newsrooms, families, and governments across the globe follow every step as the mission reshapes what feels possible.",
        },
      ];
    }

    if (normalized.includes("market crash")) {
      return [
        {
          title: "Impact On Globe",
          text:
            "Markets react sharply as confidence slips and volatility rises. Analysts warn of cascading consequences across sectors and regions.",
        },
        {
          title: "Investor Reactions",
          text:
            "Traders scramble to reposition portfolios while regulators monitor the pace of the downturn and calls for stability grow louder.",
        },
        {
          title: "What Comes Next",
          text:
            "Leaders debate emergency measures as businesses and households brace for aftershocks in the days ahead.",
        },
      ];
    }

    if (normalized.includes("100 million users")) {
      return [
        {
          title: "A Record Pace",
          text:
            "In an unprecedented surge, the platform attracts users at a historic rate and forces a reassessment of category demand.",
        },
        {
          title: "Why It Matters",
          text:
            "The speed of adoption signals a turning point for AI products and raises expectations for what consumer tools can achieve.",
        },
        {
          title: "Industry Response",
          text:
            "Competitors, investors, and analysts rush to interpret the milestone as one of the defining technology stories of the year.",
        },
      ];
    }

    return [
      {
        title: "Lead Story",
        text:
          "Editors frame the moment as a defining event, with public attention building quickly as new details continue to emerge.",
      },
      {
        title: "Inside Report",
        text:
          "Early reactions suggest broad interest, strong momentum, and significant implications for the category involved.",
      },
      {
        title: "Why It Matters",
        text:
          "The story lands with enough force to feel larger than a normal update, signaling a major shift rather than a routine announcement.",
      },
    ];
  };

    const masthead =
      visualStyle === "historic-edition"
        ? "Evening Chronicle"
        : visualStyle === "modern-breaking-news"
          ? "The Daily Times"
          : visualStyle === "financial-journal"
            ? "The Financial Ledger"
            : visualStyle === "sports-daily"
              ? "The Matchday Standard"
              : "The Global Chronicle";

    const kicker =
      visualStyle === "modern-breaking-news"
        ? "Breaking News"
        : visualStyle === "historic-edition"
          ? "Archive Edition"
          : visualStyle === "financial-journal"
            ? "Market Bulletin"
            : visualStyle === "sports-daily"
              ? "Match Report"
              : "Special Report";

    const footerNote =
      visualStyle === "historic-edition"
        ? "Reconstructed in archival print style for dramatic historical storytelling."
        : visualStyle === "modern-breaking-news"
          ? "Developing story: updates and reaction continue across markets and institutions."
          : visualStyle === "financial-journal"
            ? "A denser journal-style front page for consequential market and business coverage."
            : visualStyle === "sports-daily"
              ? "A sports-desk front page treatment designed for major matchday headlines."
              : "A clean front-page composition for modern product launches and major business moments.";

    const palette =
      visualStyle === "modern-breaking-news"
        ? {
            paperTone: "#F6F8FB",
            inkColor: "#0F172A",
            accentColor: "#C2410C",
            frameColor: "#CBD5E1",
            background: { type: "gradient" as const, from: "#F2F6FB", to: "#E3EAF3", direction: "to-bottom-right" as const },
          }
        : visualStyle === "historic-edition"
          ? {
              paperTone: "#EEE0C2",
              inkColor: "#1A1410",
              accentColor: "#7C2D12",
              frameColor: "#C5B38A",
              background: { type: "grain" as const, baseColor: "#EFE4CD", grainOpacity: 0.09 },
            }
          : visualStyle === "financial-journal"
            ? {
                paperTone: "#F7F7F4",
                inkColor: "#111827",
                accentColor: "#0F4C81",
                frameColor: "#D1D5DB",
                background: { type: "gradient" as const, from: "#F4F6F8", to: "#E5EBF2", direction: "to-bottom-right" as const },
              }
            : visualStyle === "sports-daily"
              ? {
                  paperTone: "#F6F3EA",
                  inkColor: "#151515",
                  accentColor: "#C2410C",
                  frameColor: "#D9D1C3",
                  background: { type: "gradient" as const, from: "#F9F5EB", to: "#EDE5D7", direction: "to-bottom-right" as const },
                }
              : visualStyle === "tabloid-shock"
                ? {
                    paperTone: "#F5E6D4",
                    inkColor: "#140E0A",
                    accentColor: "#B91C1C",
                    frameColor: "#D3B99E",
                    background: { type: "gradient" as const, from: "#FBECDE", to: "#E8D3C0", direction: "to-bottom-right" as const },
                  }
                : {
                    paperTone: "#FAF8F2",
                    inkColor: "#111827",
                    accentColor: "#2563EB",
                    frameColor: "#D6DDE7",
                    background: { type: "gradient" as const, from: "#F6F8FB", to: "#E7EEF7", direction: "to-bottom-right" as const },
                  };

    const paperTilt =
      visualStyle === "historic-edition"
        ? -3.5
        : visualStyle === "tabloid-shock"
          ? -2.5
        : visualStyle === "sports-daily"
            ? -1.8
            : visualStyle === "modern-breaking-news"
              ? -0.4
              : visualStyle === "financial-journal"
                ? -0.8
                : -0.6;

  return {
    templateId: "newspaper-front-page",
    confidence: "high",
    reasoning: "Heuristic: detected an explicit newspaper/front-page prompt with deterministic layout intent",
    aspect_ratio: "16:9",
    params: {
      masthead,
      editionLine: visualStyle === "historic-edition" ? "Vol. CMLXIX · Historic Edition" : "Vol. XLII · No. 184",
      dateLine:
        visualStyle === "historic-edition"
          ? "New York, Sunday, July 21, 1969"
          : visualStyle === "modern-breaking-news"
            ? "Global Desk, Breaking Edition"
            : "Special Morning Edition",
      priceLine: visualStyle === "historic-edition" ? "10 cents" : "Price 25 cents",
      kicker,
      headline: deriveHeadline(),
      subheadline: deriveSubheadline(),
      photoLabel: visualStyle === "historic-edition" ? "Archive Photo" : "Wire Photo",
      photoCaption:
        visualStyle === "historic-edition"
          ? "Mission image from the lunar surface."
          : visualStyle === "modern-breaking-news"
            ? "Wire photo"
            : "Front-page wire photo",
      columns: buildColumns(),
      footerLine: footerNote,
      visualStyle,
      paperTone: palette.paperTone,
      inkColor: palette.inkColor,
        accentColor: palette.accentColor,
        frameColor: palette.frameColor,
        background: palette.background,
        paperTilt,
        entranceAnimation: "fade-in",
        duration: 7,
      },
  };
}
