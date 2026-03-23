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
| Bar chart, bar graph, comparing values, rankings | "bar-chart" |
| Pie chart, donut chart, proportions, percentages, market share | "pie-chart" |
| Big number, statistic, counter, KPI, metric, achievement | "stat-counter" |
| Multi-line text, quote, lyrics, poetry, word-by-word reveal | "kinetic-typography" |
| Icon with text, feature highlight, callout, explainer | "icon-callout" |
| Side-by-side comparison, versus, pros/cons, A vs B | "comparison-layout" |
| Timeline, roadmap, milestones, history | "timeline-scene" |
| Card grid, feature list, services, pricing, info cards | "card-layout" |
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

BAR-CHART ANIMATION: "grow" (bars grow from zero), "fade-in", "slide-up", "none"
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
   - bar-chart: default "grow"
   - pie-chart: default "spin"
   - timeline-scene, process-steps: default "progressive"
   - All other templates: default "fade-in"
4. Array size constraints — ALWAYS respect these minimums:
   - bar-chart "bars": minimum 2, maximum 10
   - pie-chart "segments": minimum 2, maximum 8
   - timeline-scene "milestones": minimum 2, maximum 8
   - card-layout "cards": minimum 2, maximum 6
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
      steps: stepsAny.map((s: any, i: number) => {
        if (!s || typeof s !== "object") return s;
        if (typeof s.iconId === "string" && s.iconId.trim()) return s;
        const label = typeof s.label === "string" ? s.label : "";
        const inferred = normalizedToIcon(label);
        if (inferred) return { ...s, iconId: inferred };
        const fallback = [undefined, "checkmark", "gear", "truck", "home"][i + 1];
        return fallback ? { ...s, iconId: fallback } : s;
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
      steps: stepsAny.map((s: any, i: number) => {
        if (!s || typeof s !== "object") return s;
        if (typeof s.iconId === "string" && s.iconId.trim()) return s;
        const label = typeof s.label === "string" ? s.label : "";
        const inferred = normalizedToIcon(label);
        if (inferred) return { ...s, iconId: inferred };
        // Fallback by progression index for delivery-style step sets.
        const fallback = [undefined, "checkmark", "gear", "truck", "home"][i + 1];
        return fallback ? { ...s, iconId: fallback } : s;
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
      if (singleResult.templateId && singleResult.confidence !== "low") {
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
