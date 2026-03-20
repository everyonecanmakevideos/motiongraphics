require("dotenv").config();
const fs = require("fs-extra");
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INPUT_FILE = "./scripts/simplePrompts.json";
const OUTPUT_FILE = "./prompts.json";

const DELAY_MS = 3000;
const BATCH_SIZE = 2;
const BATCH_DELAY = 40000;

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// AVAILABLE ASSETS — Full list of asset IDs in the registry
// ---------------------------------------------------------------------------
const AVAILABLE_ASSETS = [
  "rocket", "car", "airplane", "bicycle", "bus", "ship", "train", "truck",
  "smartphone", "tablet", "laptop", "monitor", "server", "cpu", "wifi", "database",
  "cloud", "sun", "moon", "tree", "fire", "mountain", "water", "flower",
  "heart", "user", "users", "brain", "eye", "hand",
  "briefcase", "target", "lightbulb", "trophy", "dollar", "chart-up",
  "lightning", "gear", "arrow-right", "checkmark",
  "home", "bell", "lock", "star-icon", "music", "camera", "microphone", "play"
];

// ---------------------------------------------------------------------------
// FEW-SHOT EXAMPLES — Input/output pairs for the expansion LLM
// ---------------------------------------------------------------------------
const EXAMPLES = `
EXAMPLE 1 — Simple shape animation

Input: "a red circle bounces across the screen"

Output:
{
  "id": 1,
  "category": "coordination",
  "prompt": "Bouncing Red Circle. White background (#FFFFFF). Canvas 1920x1080. A red circle (#E53935, diameter 120px) starts at middle-left. Animation (6s): 0-0.5s: Circle fades in from opacity 0 to 1 with ease-out. 0.5-5s: Circle moves horizontally from middle-left to middle-right with bounce easing, bouncing three times with decreasing arc heights (200px, 120px, 60px above the center line). 5-6s: Hold final position at middle-right. Total duration: 6s."
}

---

EXAMPLE 2 — Multi-object coordination

Input: "two circles merge and become a square"

Output:
{
  "id": 2,
  "category": "coordination",
  "prompt": "Two Circles Merge Into Square. White background (#FFFFFF). Canvas 1920x1080. Two circles (diameter 120px each): circle A red (#E53935) positioned at middle-left (200px left of center), circle B blue (#2196F3) positioned at middle-right (200px right of center). Animation (8s): 0-1s: Both circles fade in from opacity 0 to 1 with ease-out. 1-3s: Both circles move toward canvas center using ease-in-out, arriving at the same position and overlapping. 3-4s: Both circles scale down from 100% to 0% while a purple (#7B1FA2) square (size 140px) scales up from 0% to 100% at center, creating a merge-transform effect. 4-6s: Square holds at center. 6-7s: Square rotates 45 degrees with ease-in-out. 7-8s: Hold final state. Total duration: 8s."
}

---

EXAMPLE 3 — Data visualization

Input: "pie chart 60% vs 40%"

Output:
{
  "id": 3,
  "category": "dataviz",
  "prompt": "Two-Segment Pie Chart. White background (#FFFFFF). Canvas 1920x1080. A pie chart (300px diameter) centered on canvas. Two segments: blue (#2196F3) representing 60% (216 degrees), green (#4CAF50) representing 40% (144 degrees). Segments sum to 100%. Animation (6s): 0-3s: Pie sweeps radially from 0 degrees to 360 degrees with ease-out. Blue segment fills first from 0 to 216 degrees, then green segment fills from 216 to 360 degrees. 3-6s: Hold complete pie chart. Total duration: 6s."
}

---

EXAMPLE 4 — Asset animation

Input: "rocket launches into space"

Output:
{
  "id": 4,
  "category": "asset",
  "prompt": "Rocket Launch. Dark space background (#0F0F23). Canvas 1920x1080. A white rocket asset (120px) starts at bottom-center. An orange fire asset (60px, color #FF6B35) positioned directly below the rocket. Animation (6s): 0-0.5s: Both rocket and fire assets fade in from opacity 0 to 1 with ease-out. 0.5-4s: Rocket moves upward from bottom-center toward off-screen-top with ease-in acceleration. Fire asset trails below the rocket following the same upward path. 4-5s: Both assets fade out from opacity 1 to 0. 5-6s: Hold dark background. Total duration: 6s."
}

---

EXAMPLE 5 — Progress/UI element

Input: "loading progress bar fills up"

Output:
{
  "id": 5,
  "category": "progress",
  "prompt": "Loading Progress Bar. Light neutral background (#F5F5F5). Canvas 1920x1080. A horizontal rectangle strip (600px wide, 40px tall, rounded corners 20px) centered on canvas with light grey base color (#E0E0E0). A green (#4CAF50) fill rectangle inside the strip starts at 0px width. Text '0%' (24px bold Arial, dark grey #333333) centered 80px above the bar. Animation (8s): 0-1s: Base bar and text fade in from opacity 0 to 1 with ease-out. 1-6s: Green fill grows from 0px to 600px width from left to right with ease-in-out. Simultaneously the text counts from '0%' to '100%'. 6-7s: Text scales from 100% to 115% and back to 100% with ease-in-out as a completion pulse. 7-8s: Hold completed state. Total duration: 8s."
}

---

EXAMPLE 6 — Vertical/portrait (9:16)

Input: "vertical reel of a heart beating"

Output:
{
  "id": 6,
  "category": "coordination",
  "prompt": "Heart Beat Reel. White background (#FFFFFF). Canvas 1080x1920. A red heart asset (160px, color #E53935) centered on canvas. Text 'LOVE' (64px bold Arial, #E53935) positioned 200px below center. Animation (5s): 0-0.5s: Heart and text fade in from opacity 0 to 1 with ease-out. 0.5-1.5s: Heart scales from 100% to 130% with ease-out. 1.5-2s: Heart scales back from 130% to 100% with ease-in. 2-3s: Heart scales from 100% to 130% again with ease-out. 3-3.5s: Heart scales back from 130% to 100% with ease-in. 3.5-5s: Hold final state. Total duration: 5s."
}

---

EXAMPLE 7 — Kinetic typography with compound effects

Input: "announcement text pops in with a highlight and subtitle slides up"

Output:
{
  "id": 7,
  "category": "effects",
  "prompt": "Announcement Typography. Dark background (#1A1A2E). Canvas 1920x1080. A white bold text 'ANNOUNCEMENT' (72px Arial) centered 60px above canvas center. A yellow (#FDD835) highlight box expands behind the text from left to right. A subtitle text 'Details below' (36px Arial, light grey #E0E0E0) positioned 60px below canvas center. Animation (7s): 0-0.4s: Main text appears with scale pop effect (scale from 0% to 115% with ease-out). 0.4-0.6s: Main text scale settles from 115% to 100% with ease-in. 0.8-1.5s: Yellow highlight box expands from left to right behind the main text with ease-out. 1.5-2.2s: Subtitle slides up from 40px below its final position while fading in from opacity 0 to 1 with ease-out. 2.2-7s: Hold final state. Total duration: 7s."
}
`;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT — Expansion rules + examples
// ---------------------------------------------------------------------------
const EXPANSION_SYSTEM_PROMPT = `You are a Motion Graphics Prompt Expander. You convert short, vague animation descriptions into highly detailed, deterministic motion graphics prompts.

OUTPUT FORMAT: Return ONLY valid JSON with exactly these keys:
{ "id": <number>, "category": "<string>", "prompt": "<detailed string>" }

No markdown fences, no explanations, no extra keys. The JSON must be parseable.

---

DETERMINISTIC EXPANSION RULES

Follow these rules strictly to produce consistent, deterministic output.

CANVAS AND BACKGROUND:
- Default: 16:9 landscape (Canvas 1920x1080)
- If the user mentions "vertical", "portrait", "reel", "story", "stories", "9:16", "shorts", or "tiktok": use 9:16 portrait (Canvas 1080x1920)
- Always state the exact canvas dimensions in the prompt
- Background defaults by category:
  - Shapes/coordination: white (#FFFFFF)
  - UI/progress: light neutral (#F5F5F5)
  - Space/night/dark scenes: dark (#0F0F23 or #1A1A2E)
  - Data visualization: white (#FFFFFF)
- Always include the hex color code for the background

DURATION RULES:
- If user specifies a duration (e.g., "5 seconds", "10s", "in 3 seconds"), use EXACTLY that duration. Do not deviate.
- If user says "quick" or "fast": use 3-4s total
- If user says "slow" or "detailed": use 10-15s total
- Otherwise, calculate duration based on complexity:
  - 1 object, simple animation (1-2 actions): 4-5s
  - 1 object, complex animation (3+ actions): 5-7s
  - 2-3 objects, moderate coordination: 6-8s
  - 4+ objects or complex coordination: 8-12s
  - Data visualization with labels: 6-10s
- Minimum duration: 3s. Maximum duration: 15s.

DURATION ENFORCEMENT:
- Every animation phase start/end time MUST be within [0, total_duration]
- No timeline phase may extend beyond the stated total duration
- The sum of all phase durations must equal total_duration exactly
- The final hold phase should be 1-2s. Do not waste more than 2s on a hold.
- Animation phases must be contiguous — no gaps between phases
- Phase times must be stated in ascending order

SHAPE SIZE DEFAULTS (when user does not specify):
- Circle: diameter 120px
- Rectangle: size 200px wide, 120px tall
- Triangle: size 140px base, 140px tall
- Text: 48px Arial bold
- Asset: size 120px
- Pie/Donut chart: diameter 300px

COLOR MAP (use these exact hex codes):
- "red" = #E53935
- "blue" = #2196F3
- "green" = #4CAF50
- "yellow" = #FDD835
- "purple" = #7B1FA2
- "orange" = #FF9800
- "pink" = #E91E63
- "cyan" = #00ACC1
- "white" = #FFFFFF
- "black" = #000000
- "grey" or "gray" = #9E9E9E
- "dark grey" = #333333
- "light grey" = #E0E0E0
- If no color is specified for an object, assign colors in this order: #E53935, #2196F3, #4CAF50, #FDD835, #7B1FA2, #FF9800

SEMANTIC POSITIONS (use these terms, NOT pixel coordinates):
- center, top-center, bottom-center
- middle-left, middle-right
- top-left, top-right, bottom-left, bottom-right
- off-screen-left, off-screen-right, off-screen-top, off-screen-bottom
Layout rules for 16:9 (1920x1080):
- "side by side" = place objects 200px apart horizontally from center
- "spread out" = distribute evenly across usable canvas width
- "stacked" = same horizontal position, 150px vertical spacing
- "surrounding" = arranged in a circle around center at 200px radius
Layout rules for 9:16 (1080x1920):
- "side by side" = place objects 150px apart horizontally (narrower canvas)
- "spread out" = distribute evenly across usable canvas width
- "stacked" = same horizontal position, 200px vertical spacing (taller canvas)
- "surrounding" = arranged in a circle around center at 160px radius

SAFE MARGINS AND ALIGNMENT:
- No object's visible edge should be closer than 60px to any canvas edge
- For 16:9: safe area is roughly center +/- 900px horizontal, +/- 480px vertical
- For 9:16: safe area is roughly center +/- 480px horizontal, +/- 900px vertical
- Exception: objects intentionally entering/exiting the frame (off-screen starts)
- Minimum gap between any two objects: 40px between their edges
- TEXT PLACEMENT: Title text goes in the top 20% of canvas. Labels/captions go in the bottom 30%. Main content in the center 50%.
- TEXT SPACING: Multiple text items at similar y-positions must be at least 200px apart horizontally. No two text objects should overlap.
- When objects need to be spread across the canvas, keep them within the safe area

BACKGROUND EFFECTS:
- "gradient background" → describe as a background gradient with direction (linear/radial), two hex colors, and type
- "radial glow" / "brightness glow in center" / "soft glow" → describe as a radial gradient background with a bright center color fading to edges. Example: "Radial gradient background from deep purple (#7B1FA2) to blue (#2196F3) with a soft white (#FFFFFF) brightness glow in the center."
- "soft gradient" → subtle color transition between close hues as a background gradient
- Do NOT describe glows or gradient effects as separate circle objects or shapes. They are BACKGROUND properties, not foreground objects.
- State the gradient type (linear/radial), both colors with hex codes, and direction explicitly.

TYPEWRITER / TEXT REVEAL ANIMATIONS:
- "typewriter effect" / "typing effect" / "reveals letter by letter" / "character by character" → describe as typewriter character-by-character reveal, NOT as an opacity fade-in
- When typewriter is requested, the text should NOT "fade in" simultaneously. The character reveal IS the appearance animation.
- Describe as: "Text reveals character by character over Ns with typewriter effect"
- If the user wants a cursor, add "with blinking cursor" to the description
- The text starts visible (full opacity) but shows 0 characters initially — the typewriter animation gradually reveals characters

KINETIC TYPOGRAPHY EFFECTS:
- "pop" / "pop in" / "bounce in" / "scale pop" → describe as "appears with scale pop effect (scale from 0% to 115% then settles to 100%)"
- "blur reveal" / "focus in" / "appears with blur" → describe as "reveals with blur effect (starts blurred at 12px and sharpens to 0 while fading in from opacity 0 to 1)"
- "slide up" / "rise up" / "float up" → describe as "slides up from 40px below final position while fading in from opacity 0 to 1"
- "slide down" / "drop in" → describe as "slides down from 40px above final position while fading in"
- "underline" / "underline draws" / "underline appears" → describe as "an animated underline (4px tall rectangle) draws from left to right beneath the text"
- "highlight" / "highlight box" / "text highlight" → describe as "a colored highlight box expands behind the text from left to right"
- "stagger" / "one by one" / "sequential" / "cascading" / "one after another" → describe as "text elements appear with staggered timing, each delayed by 0.2-0.3 seconds after the previous"
- "text in box" / "boxed text" / "badge" / "pill" / "inside a box" / "inside a container" → describe as "text centered inside a rounded rectangle container"
- "counter" / "counting" / "number counts up" → describe as "number counts up from 0 to target value"
- For compound effects: combine descriptions in sequence. E.g., "pops in with highlight" → "appears with scale pop effect (0% to 115% to 100%), then a colored highlight box expands behind the text from left to right"
- IMPORTANT: When multiple text elements appear with the same effect, always describe the stagger delay between them

GRID / PATTERN BACKGROUNDS:
- "grid background" / "grid lines" / "grid pattern" → describe as a subtle grid line overlay with spacing and color
- "dot grid" → describe as small dots at regular intervals on the background
- Small grid lines should use 40-60px spacing with very low opacity (0.1-0.3)
- Grid is a BACKGROUND pattern — do NOT describe it as individual line objects
- Example: "Light grey (#F5F5F5) background with subtle grid lines (50px spacing, rgba(200,200,200,0.3))."

TIMELINE GENERATION:
- Every animation begins with a 0.5-1s fade-in phase (unless user says "instant" or "sudden")
- Every animation ends with a 1-2s hold on the final state
- Action phases are contiguous with no gaps between them
- Distribute remaining time equally among action phases
- Always state exact start and end seconds for each phase (e.g., "0-1s:", "1-3s:")

EASING DEFAULTS (by verb):
- "appears" / "fades in" = ease-out
- "moves" / "slides" / "travels" / "enters" = ease-in-out
- "bounces" / "lands" / "drops" = bounce
- "spins" / "rotates" = linear
- "grows" / "scales up" / "expands" = ease-out
- "shrinks" / "scales down" = ease-in
- "launches" / "accelerates" = ease-in

CATEGORY DETECTION:
- Contains "chart" / "graph" / "pie" / "donut" / "bar" / "gauge" / "data" / "percentage" = dataviz
- Contains a known asset name (rocket, car, airplane, sun, moon, tree, etc.) = asset
- Contains "progress" / "loading" / "status" / "timeline" / "steps" / "order" = progress
- Contains "glow" / "blur" / "shadow" / "3d" / "pulse" / "particle" / "gradient" = effects
- 2+ objects with interaction (merge, collide, chase, follow, orbit) = coordination
- Default = coordination

AVAILABLE ASSET IDS (use only these when the prompt describes real-world objects):
` + AVAILABLE_ASSETS.join(", ") + `

When the user mentions a real-world object that matches an available asset (e.g., "rocket", "car", "sun", "moon", "tree", "laptop"), use shape "asset" with the matching assetId in the description.

VAGUENESS RESOLUTION (when the user prompt is missing information):
- No objects mentioned: default to a single circle
- No motion mentioned: default to fade-in, hold 3s, fade-out
- No colors specified: apply the color cycle above
- "something" or "things": interpret as circles
- "moves around": interpret as moving in a clockwise path around center
- "appears": interpret as fade-in from opacity 0 to 1
- "disappears": interpret as fade-out from opacity 1 to 0
- Contradictory instructions: prioritize the last stated instruction

REQUIRED OUTPUT CHECKLIST — Before producing your JSON, verify:
1. Every object has an explicit hex color code
2. Every animation phase has exact start and end seconds (e.g., "0-1s:")
3. Total duration is stated at the end
4. Canvas dimensions (1920x1080 or 1080x1920) are mentioned
5. Background color with hex code is mentioned
6. No ambiguous words: "random", "approximately", "about", "maybe", "roughly", "vary", "sometimes", "perhaps"
7. All positions use semantic terms (center, middle-left, etc.) not pixel coordinates
8. Easing is specified for every motion (ease-in, ease-out, ease-in-out, bounce, linear)
9. The prompt field is a single continuous string, not multi-line
10. The last timeline phase ends exactly at the total duration (no gaps, no overflows)
11. All objects are described within the safe area (60px from edges) unless entering/exiting frame
12. Text objects do not overlap each other — proper spacing between titles, labels, and captions

PROMPT STRUCTURE:
Follow this structure in the "prompt" field:
[Scene Title]. [Background color + hex]. Canvas [WxH]. [Object descriptions with shapes, sizes, colors, positions]. Animation ([duration]s): [Phase 1 timing: description]. [Phase 2 timing: description]. ... Total duration: [N]s.

---

${EXAMPLES}

---

Now expand the user's simple prompt into a detailed motion graphics prompt JSON.`;

// ---------------------------------------------------------------------------
// BANNED WORDS — Output must not contain these ambiguous terms
// ---------------------------------------------------------------------------
const BANNED_WORDS = [
  "random", "randomly", "approximately", "about", "maybe",
  "roughly", "vary", "varies", "sometimes", "perhaps",
  "might", "could be", "around", "or so"
];

// ---------------------------------------------------------------------------
// VALIDATION — Check expansion quality
// ---------------------------------------------------------------------------
function validateExpansion(result) {
  var errors = [];

  if (typeof result.id !== "number") {
    errors.push("Missing or invalid 'id' (must be a number)");
  }

  var validCategories = ["coordination", "dataviz", "effects", "asset", "progress"];
  if (!validCategories.includes(result.category)) {
    errors.push("Invalid category '" + result.category + "'. Must be one of: " + validCategories.join(", "));
  }

  if (typeof result.prompt !== "string") {
    errors.push("Missing 'prompt' field");
    return errors;
  }

  if (result.prompt.length < 100) {
    errors.push("Prompt too short (" + result.prompt.length + " chars). Expected 100+ chars for a detailed expansion.");
  }

  // Must contain a hex color
  if (!/#[0-9A-Fa-f]{6}/.test(result.prompt)) {
    errors.push("No hex color code found in prompt");
  }

  // Must mention canvas dimensions (either 1920x1080 or 1080x1920)
  var hasLandscape = result.prompt.includes("1920x1080") || result.prompt.includes("1920 x 1080");
  var hasPortrait = result.prompt.includes("1080x1920") || result.prompt.includes("1080 x 1920");
  if (!hasLandscape && !hasPortrait) {
    // Fallback: at least both numbers must be present
    if (!result.prompt.includes("1920") || !result.prompt.includes("1080")) {
      errors.push("Canvas dimensions (1920x1080 or 1080x1920) not mentioned in prompt");
    }
  }

  // Must contain duration
  if (!/\d+s/.test(result.prompt) && !result.prompt.includes("Total duration")) {
    errors.push("No duration mention found in prompt");
  }

  // Must contain timing phases
  if (!/\d+[\-\u2013]\d+(\.\d+)?s/.test(result.prompt)) {
    errors.push("No timing phases (e.g., '0-1s:') found in prompt");
  }

  // Duration consistency: extract total duration and check phase times
  var totalDurationMatch = result.prompt.match(/Total duration:\s*(\d+(?:\.\d+)?)s/i);
  if (totalDurationMatch) {
    var totalDuration = parseFloat(totalDurationMatch[1]);
    // Find all phase end times (patterns like "5-8s:" or "5-8s.")
    var phaseMatches = result.prompt.match(/(\d+(?:\.\d+)?)\s*[\-\u2013]\s*(\d+(?:\.\d+)?)s/g);
    if (phaseMatches) {
      var maxEndTime = 0;
      for (var p = 0; p < phaseMatches.length; p++) {
        var parts = phaseMatches[p].match(/(\d+(?:\.\d+)?)\s*[\-\u2013]\s*(\d+(?:\.\d+)?)s/);
        if (parts) {
          var endTime = parseFloat(parts[2]);
          if (endTime > maxEndTime) maxEndTime = endTime;
        }
      }
      if (maxEndTime > totalDuration + 0.5) {
        errors.push("Timeline phase ends at " + maxEndTime + "s but total duration is " + totalDuration + "s — phases exceed duration");
      }
    }
  }

  // Must NOT contain banned words
  var promptLower = result.prompt.toLowerCase();
  for (var i = 0; i < BANNED_WORDS.length; i++) {
    if (promptLower.includes(BANNED_WORDS[i])) {
      errors.push("Banned ambiguous word found: '" + BANNED_WORDS[i] + "'");
    }
  }

  // If category is asset, check for valid asset names
  if (result.category === "asset") {
    var hasKnownAsset = AVAILABLE_ASSETS.some(function (assetId) {
      return result.prompt.toLowerCase().includes(assetId);
    });
    if (!hasKnownAsset) {
      errors.push("Category is 'asset' but no known asset name found in prompt");
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// DETECT DURATION — Extract explicit duration from simple prompt
// ---------------------------------------------------------------------------
function detectDuration(simplePrompt) {
  var lower = simplePrompt.toLowerCase();
  // Match patterns like "5 seconds", "10s", "in 3 seconds", "3 second video"
  var match = lower.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|s\b)/);
  if (match) {
    return parseFloat(match[1]);
  }
  if (lower.includes("quick") || lower.includes("fast")) {
    return "fast";
  }
  if (lower.includes("slow") || lower.includes("detailed")) {
    return "slow";
  }
  return null;
}

// ---------------------------------------------------------------------------
// DETECT ASPECT RATIO — Check for vertical/portrait keywords
// ---------------------------------------------------------------------------
var PORTRAIT_KEYWORDS = ["vertical", "portrait", "reel", "story", "stories", "9:16", "9x16", "shorts", "tiktok"];

function detectAspectRatio(simplePrompt) {
  var lower = simplePrompt.toLowerCase();
  for (var i = 0; i < PORTRAIT_KEYWORDS.length; i++) {
    if (lower.includes(PORTRAIT_KEYWORDS[i])) {
      return "9:16";
    }
  }
  return "16:9";
}

// ---------------------------------------------------------------------------
// EXPAND SINGLE PROMPT — Call LLM to expand
// ---------------------------------------------------------------------------
async function expandSinglePrompt(simplePrompt, id, category) {
  var userMessage = "Simple prompt: " + simplePrompt;
  if (category) {
    userMessage += "\nCategory hint: " + category;
  }
  userMessage += "\nAssign id: " + id;

  // Pass duration constraint if detected
  var duration = detectDuration(simplePrompt);
  if (typeof duration === "number") {
    userMessage += "\nIMPORTANT: The user specified a duration of exactly " + duration + " seconds. Use this exact duration.";
  } else if (duration === "fast") {
    userMessage += "\nIMPORTANT: The user wants a quick/fast animation. Use 3-4 seconds total.";
  } else if (duration === "slow") {
    userMessage += "\nIMPORTANT: The user wants a slow/detailed animation. Use 10-15 seconds total.";
  }

  // Pass aspect ratio constraint
  var aspectRatio = detectAspectRatio(simplePrompt);
  if (aspectRatio === "9:16") {
    userMessage += "\nIMPORTANT: This is a vertical/portrait video. Use Canvas 1080x1920 (9:16 aspect ratio).";
  }

  var response = await client.responses.create({
    model: "gpt-5-mini",
    
    input: [
      {
        role: "system",
        content: EXPANSION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return response.output_text;
}

// ---------------------------------------------------------------------------
// MAIN — Process all simple prompts
// ---------------------------------------------------------------------------
async function main() {
  var simplePrompts = await fs.readJson(INPUT_FILE);
  console.log("Expanding " + simplePrompts.length + " simple prompts...\n");

  // Load existing expanded prompts if output file exists
  var expandedPrompts = [];
  if (await fs.pathExists(OUTPUT_FILE)) {
    try {
      expandedPrompts = await fs.readJson(OUTPUT_FILE);
      console.log("Loaded " + expandedPrompts.length + " existing prompts from " + OUTPUT_FILE);
    } catch (_) {
      expandedPrompts = [];
    }
  }

  // Track existing IDs to skip already-expanded prompts
  var existingIds = new Set(expandedPrompts.map(function (p) { return p.id; }));

  for (var i = 0; i < simplePrompts.length; i++) {
    var item = simplePrompts[i];
    var id = item.id;
    var simplePrompt = item.simplePrompt;
    var categoryHint = item.category || null;

    if (existingIds.has(id)) {
      console.log("Skipping " + id + " (already expanded)");
      continue;
    }

    console.log("Expanding " + id + ": " + simplePrompt.slice(0, 60) + "...");

    var retries = 0;
    var MAX_RETRIES = 2;
    var success = false;

    while (retries <= MAX_RETRIES) {
      try {
        var rawOutput = await expandSinglePrompt(simplePrompt, id, categoryHint);

        // Clean markdown fences if present
        var cleaned = rawOutput
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // Parse JSON
        var parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error("  Invalid JSON from LLM for prompt " + id + ": " + parseErr.message);
          retries++;
          if (retries <= MAX_RETRIES) {
            await sleep(5000);
            continue;
          }
          break;
        }

        // Force correct ID and add aspect ratio
        parsed.id = id;
        var detectedAspect = detectAspectRatio(simplePrompt);
        parsed.aspectRatio = detectedAspect;

        // Validate
        var validationErrors = validateExpansion(parsed);
        if (validationErrors.length > 0) {
          console.warn("  Validation issues for prompt " + id + ":");
          validationErrors.forEach(function (e) { console.warn("    - " + e); });

          // Critical errors trigger retry
          var criticalErrors = validationErrors.filter(function (e) {
            return e.includes("Missing") || e.includes("too short") || e.includes("No hex") || e.includes("Invalid category");
          });

          if (criticalErrors.length > 0) {
            retries++;
            if (retries <= MAX_RETRIES) {
              console.log("  Retrying due to critical validation errors...");
              await sleep(5000);
              continue;
            }
          }
          // Non-critical errors: warn but accept
        }

        // Add to output and write immediately
        expandedPrompts.push(parsed);
        existingIds.add(id);
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(expandedPrompts, null, 2));
        console.log("  Expanded successfully (" + parsed.prompt.length + " chars, category: " + parsed.category + ")");
        console.log("  Saved to " + OUTPUT_FILE + " (" + expandedPrompts.length + " total prompts)");
        success = true;
        break;

      } catch (error) {
        console.error("  Error on prompt " + id + ": " + error.message);
        retries++;
        if (retries <= MAX_RETRIES) {
          await sleep(10000);
        }
      }
    }

    if (!success) {
      console.error("  Failed to expand prompt " + id + " after " + (MAX_RETRIES + 1) + " attempts");
    }

    // Small delay between requests
    await sleep(DELAY_MS);

    // Batch pause
    if ((i + 1) % BATCH_SIZE === 0 && i < simplePrompts.length - 1) {
      console.log("Batch limit reached. Waiting " + (BATCH_DELAY / 1000) + " seconds...");
      await sleep(BATCH_DELAY);
    }
  }

  // Write all expanded prompts
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(expandedPrompts, null, 2));
  console.log("\nWrote " + expandedPrompts.length + " prompts to " + OUTPUT_FILE);
  console.log("Expansion complete.");
}

main();
