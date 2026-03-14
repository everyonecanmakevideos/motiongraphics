import OpenAI from "openai";

// ---------------------------------------------------------------------------
// AVAILABLE ASSETS
// ---------------------------------------------------------------------------
const AVAILABLE_ASSETS = [
  "rocket", "car", "airplane", "bicycle", "bus", "ship", "train", "truck",
  "smartphone", "tablet", "laptop", "monitor", "server", "cpu", "wifi", "database",
  "cloud", "sun", "moon", "tree", "fire", "mountain", "water", "flower",
  "heart", "user", "users", "brain", "eye", "hand",
  "briefcase", "target", "lightbulb", "trophy", "dollar", "chart-up",
  "lightning", "gear", "arrow-right", "checkmark",
  "home", "bell", "lock", "star-icon", "music", "camera", "microphone", "play",
];

// ---------------------------------------------------------------------------
// FEW-SHOT EXAMPLES
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
  "prompt": "Loading Progress Bar. Light neutral background (#F5F5F5). Canvas 1920x1080. A horizontal rectangle strip (600px wide, 40px tall, rounded corners 20px) centered on canvas with light grey base color (#E0E0E0). A green (#4CAF50) fill rectangle inside the strip starts at 0px width. Text '0%' (24px bold Arial, dark grey #333333) centered above the bar. Animation (8s): 0-1s: Base bar and text fade in from opacity 0 to 1 with ease-out. 1-6s: Green fill grows from 0px to 600px width from left to right with ease-in-out. Simultaneously the text counts from '0%' to '100%'. 6-7s: Text scales from 100% to 115% and back to 100% with ease-in-out as a completion pulse. 7-8s: Hold completed state. Total duration: 8s."
}
`;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------------
const EXPANSION_SYSTEM_PROMPT = `You are a Motion Graphics Prompt Expander. You convert short, vague animation descriptions into highly detailed, deterministic motion graphics prompts.

OUTPUT FORMAT: Return ONLY valid JSON with exactly these keys:
{ "id": <number>, "category": "<string>", "prompt": "<detailed string>" }

No markdown fences, no explanations, no extra keys. The JSON must be parseable.

---

DETERMINISTIC EXPANSION RULES

Follow these rules strictly to produce consistent, deterministic output.

CANVAS AND BACKGROUND:
- Canvas: always 1920x1080
- Background defaults by category:
  - Shapes/coordination: white (#FFFFFF)
  - UI/progress: light neutral (#F5F5F5)
  - Space/night/dark scenes: dark (#0F0F23 or #1A1A2E)
  - Data visualization: white (#FFFFFF)
- Always include the hex color code for the background

DURATION DEFAULTS:
- 1 object, simple animation: 4-6s
- 2-3 objects, moderate coordination: 6-8s
- 4+ objects or complex coordination: 8-12s
- Data visualization: 6-10s
- If user specifies a duration, use exactly that

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
Layout rules:
- "side by side" = place objects 200px apart horizontally from center
- "spread out" = distribute evenly across canvas width
- "stacked" = same horizontal position, 150px vertical spacing
- "surrounding" = arranged in a circle around center at 200px radius

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
${AVAILABLE_ASSETS.join(", ")}

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
4. Canvas dimensions (1920x1080) are mentioned
5. Background color with hex code is mentioned
6. No ambiguous words: "random", "approximately", "about", "maybe", "roughly", "vary", "sometimes", "perhaps"
7. All positions use semantic terms (center, middle-left, etc.) not pixel coordinates
8. Easing is specified for every motion (ease-in, ease-out, ease-in-out, bounce, linear)
9. The prompt field is a single continuous string, not multi-line

PROMPT STRUCTURE:
Follow this structure in the "prompt" field:
[Scene Title]. [Background color + hex]. Canvas 1920x1080. [Object descriptions with shapes, sizes, colors, positions]. Animation ([duration]s): [Phase 1 timing: description]. [Phase 2 timing: description]. ... Total duration: [N]s.

---

${EXAMPLES}

---

Now expand the user's simple prompt into a detailed motion graphics prompt JSON.`;

// ---------------------------------------------------------------------------
// BANNED WORDS
// ---------------------------------------------------------------------------
const BANNED_WORDS = [
  "random", "randomly", "approximately", "about", "maybe",
  "roughly", "vary", "varies", "sometimes", "perhaps",
  "might", "could be", "around", "or so",
];

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface ExpandedPrompt {
  id: number;
  category: string;
  prompt: string;
}

export interface ExpandOptions {
  id?: number;
  category?: string;
}

export interface ExpandResult {
  valid: boolean;
  errors: string[];
  result: ExpandedPrompt | null;
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------
function validateExpansion(result: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (typeof result.id !== "number") {
    errors.push("Missing or invalid 'id' (must be a number)");
  }

  const validCategories = ["coordination", "dataviz", "effects", "asset", "progress"];
  if (!validCategories.includes(result.category as string)) {
    errors.push(
      "Invalid category '" + result.category + "'. Must be one of: " + validCategories.join(", ")
    );
  }

  if (typeof result.prompt !== "string") {
    errors.push("Missing 'prompt' field");
    return errors;
  }

  const prompt = result.prompt as string;

  if (prompt.length < 100) {
    errors.push("Prompt too short (" + prompt.length + " chars). Expected 100+ chars.");
  }

  if (!/#[0-9A-Fa-f]{6}/.test(prompt)) {
    errors.push("No hex color code found in prompt");
  }

  if (!prompt.includes("1920") || !prompt.includes("1080")) {
    errors.push("Canvas dimensions (1920x1080) not mentioned");
  }

  if (!/\d+s/.test(prompt) && !prompt.includes("Total duration")) {
    errors.push("No duration mention found");
  }

  if (!/\d+[-\u2013]\d+(\.\d+)?s/.test(prompt)) {
    errors.push("No timing phases found");
  }

  const promptLower = prompt.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (promptLower.includes(word)) {
      errors.push("Banned ambiguous word found: '" + word + "'");
    }
  }

  if (result.category === "asset") {
    const hasKnownAsset = AVAILABLE_ASSETS.some((assetId) =>
      promptLower.includes(assetId)
    );
    if (!hasKnownAsset) {
      errors.push("Category is 'asset' but no known asset name found");
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// EXPAND PROMPT
// ---------------------------------------------------------------------------
export async function expandPrompt(
  simplePrompt: string,
  options?: ExpandOptions
): Promise<ExpandResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const id = options?.id ?? 1;

  let userMessage = "Simple prompt: " + simplePrompt;
  if (options?.category) {
    userMessage += "\nCategory hint: " + options.category;
  }
  userMessage += "\nAssign id: " + id;

  const MAX_RETRIES = 2;
  let lastError = "Unknown error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: EXPANSION_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const rawOutput = response.choices[0].message.content ?? "";
      const cleaned = rawOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = "JSON parse error: " + (parseErr as Error).message;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        break;
      }

      // Force correct ID
      parsed.id = id;

      const validationErrors = validateExpansion(parsed);
      const criticalErrors = validationErrors.filter(
        (e) =>
          e.includes("Missing") ||
          e.includes("too short") ||
          e.includes("No hex") ||
          e.includes("Invalid category")
      );

      if (criticalErrors.length > 0 && attempt < MAX_RETRIES) {
        lastError = criticalErrors.join("; ");
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      return {
        valid: validationErrors.length === 0,
        errors: validationErrors,
        result: parsed as unknown as ExpandedPrompt,
      };
    } catch (error) {
      lastError = (error as Error).message;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
    }
  }

  return { valid: false, errors: [lastError], result: null };
}
