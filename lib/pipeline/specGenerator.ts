import OpenAI from "openai";

const EXAMPLES = `
EXAMPLE 1 — Simple fade-in (Level 1.0)

Prompt: "Circle Fade In. White background. Red circle (#E53935), 150px. Fades from invisible to fully visible over 1.2s, then holds for 2.8s. Total duration: 4s."

Output:
{
  "scene": "circle_fade_in",
  "duration": 4,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "circle_1",
      "shape": "circle",
      "diameter": 150,
      "color": "#E53935",
      "pos": [0, 0],
      "opacity": 0
    }
  ],
  "timeline": [
    { "target": "circle_1", "time": [0, 1.2], "easing": "ease-out", "opacity": [0, 1] }
  ]
}

---

EXAMPLE 2 — Breathing scale loop (Level 1.1)

Prompt: "Circle Breathing Loop. Light background (#F5F5F5). Blue circle (#42A5F5), 160px, centered. Scale breathes: 100% to 108% to 100%, repeat for 6s (2 cycles, 3s each). Easing: ease-in-out. Total duration: 6s."

Output:
{
  "scene": "circle_breathing_loop",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#F5F5F5",
  "objects": [
    {
      "id": "circle_1",
      "shape": "circle",
      "diameter": 160,
      "color": "#42A5F5",
      "pos": [0, 0]
    }
  ],
  "timeline": [
    { "target": "circle_1", "time": [0, 1.5], "easing": "ease-in-out", "scale": [1, 1.08] },
    { "target": "circle_1", "time": [1.5, 3], "easing": "ease-in-out", "scale": [1.08, 1] },
    { "target": "circle_1", "time": [3, 4.5], "easing": "ease-in-out", "scale": [1, 1.08] },
    { "target": "circle_1", "time": [4.5, 6], "easing": "ease-in-out", "scale": [1.08, 1] }
  ]
}

---

EXAMPLE 3 — Multi-object coordination (Level 1.2)

Prompt: "Three Shapes Center Bounce. White background. Circle (140px red #F44336), square (140px blue #2196F3), triangle (140px base green #4CAF50). Animation (6s): 0-2s: Circle slides from left, square from right, triangle drops from top. All arrive at center with bounce. 2-4s: All three rotate slowly in place (each 180deg). 4-5s: All scale together: 100% to 110% to 100%. 5-6s: Fade out together. Total duration: 6s."

Output:
{
  "scene": "three_shapes_center_bounce",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    { "id": "circle_1", "shape": "circle", "diameter": 140, "color": "#F44336", "pos": [-960, 0] },
    { "id": "square_1", "shape": "rectangle", "size": [140, 140], "color": "#2196F3", "pos": [960, 0] },
    { "id": "triangle_1", "shape": "triangle", "size": [140, 140], "color": "#4CAF50", "pos": [0, -540] }
  ],
  "timeline": [
    { "target": "circle_1", "time": [0, 2], "easing": "bounce", "x": [-960, 0] },
    { "target": "square_1", "time": [0, 2], "easing": "bounce", "x": [960, 0] },
    { "target": "triangle_1", "time": [0, 2], "easing": "bounce", "y": [-540, 0] },
    { "target": "circle_1", "time": [2, 4], "rotation": [0, 180] },
    { "target": "square_1", "time": [2, 4], "rotation": [0, 180] },
    { "target": "triangle_1", "time": [2, 4], "rotation": [0, 180] },
    { "target": "circle_1", "time": [4, 4.5], "easing": "ease-in-out", "scale": [1, 1.1] },
    { "target": "circle_1", "time": [4.5, 5], "easing": "ease-in-out", "scale": [1.1, 1] },
    { "target": "square_1", "time": [4, 4.5], "easing": "ease-in-out", "scale": [1, 1.1] },
    { "target": "square_1", "time": [4.5, 5], "easing": "ease-in-out", "scale": [1.1, 1] },
    { "target": "triangle_1", "time": [4, 4.5], "easing": "ease-in-out", "scale": [1, 1.1] },
    { "target": "triangle_1", "time": [4.5, 5], "easing": "ease-in-out", "scale": [1.1, 1] },
    { "target": "circle_1", "time": [5, 6], "opacity": [1, 0] },
    { "target": "square_1", "time": [5, 6], "opacity": [1, 0] },
    { "target": "triangle_1", "time": [5, 6], "opacity": [1, 0] }
  ]
}

---

EXAMPLE 4 — Parent-child group animation (Level 1.2)

Prompt: "Planet and Moon. Dark space background (#1A1A2E). A blue planet (120px circle, #2196F3) orbits the canvas center at radius 200px, one full clockwise loop over 4s. A small white moon (40px circle, #FFFFFF) is attached to the planet and rotates around the planet at 90px radius, completing 2 full loops in the same 4s. Total duration: 4s."

Output:
{
  "scene": "planet_moon_orbit",
  "duration": 4,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#1A1A2E",
  "objects": [
    { "id": "planet_1", "shape": "circle", "diameter": 120, "color": "#2196F3", "pos": [200, 0] },
    { "id": "moon_1", "shape": "circle", "diameter": 40, "color": "#FFFFFF", "parent": "planet_1", "offset": [90, 0] }
  ],
  "timeline": [
    { "target": "planet_1", "time": [0, 4], "orbit": { "center": [0, 0], "radius": 200, "degrees": 360 } },
    { "target": "moon_1", "time": [0, 4], "orbit": { "center": [0, 0], "radius": 90, "degrees": 720 } }
  ]
}

---

EXAMPLE 5 — Text typewriter animation (Level 1.1)

Prompt: "Title Card. Black background (#000000). White bold text 'MOTION GRAPHICS' centered, 96px Arial. Text types in character by character over 1.5s, then holds for 1s, then fades out over 0.5s. Total: 3s."

Output:
{
  "scene": "title_typewriter",
  "duration": 3,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#000000",
  "objects": [
    {
      "id": "title_1",
      "shape": "text",
      "text": "MOTION GRAPHICS",
      "fontSize": 96,
      "fontWeight": "bold",
      "fontFamily": "Arial",
      "color": "#FFFFFF",
      "textAlign": "center",
      "pos": [0, 0],
      "opacity": 1
    }
  ],
  "timeline": [
    { "target": "title_1", "time": [0, 1.5], "chars": [0, 15] },
    { "target": "title_1", "time": [2.5, 3], "opacity": [1, 0] }
  ]
}
`;

const SYSTEM_PROMPT = `You are an expert Motion Graphics Specification Generator.

Your sole objective is to convert natural language motion graphics prompts into a compact, deterministic JSON specification called the Sparse Motion Spec.

OUTPUT FORMAT: Return ONLY valid JSON. No conversational text, no explanations, no markdown formatting.

---

SPARSE MOTION SPEC SCHEMA

The spec has 7 top-level keys: scene, duration, fps, canvas, bg, objects, timeline.

1. SCENE METADATA
   - "scene": short snake_case name derived from the prompt
   - "duration": total duration in seconds (number)
   - "fps": always 30
   - "canvas": { "w": 1920, "h": 1080 }
   - "bg": background color as hex string. For gradients use: { "type": "gradient", "from": "#hex", "to": "#hex", "direction": "to bottom" }

2. OBJECTS ARRAY
   Each object has ONLY the properties it needs. Omit any property that uses its default value.

   Required fields:
   - "id": unique string identifier (e.g., "circle_1", "rect_2")
   - "shape": "circle" | "rectangle" | "triangle" | "pentagon" | "star" | "line" | "text"

   Optional fields (include ONLY if needed):
   - "diameter": number (for circles)
   - "size": [width, height] (for rectangles, triangles, etc.)
   - "color": hex string
   - "stroke": { "color": "#hex", "width": number }
   - "fill": false (default is true)
   - "pos": [x, y] (default: [0, 0] = canvas center)
   - "opacity": number 0-1 (default: 1; set to 0 if shape starts invisible)
   - "rotation": degrees (default: 0)
   - "scale": number (default: 1)
   - "cornerRadius": number
   - "facing": "up" | "down" | "left" | "right" (for triangles)
   - "zIndex": number
   - "parent": string
   - "offset": [x, y]
   - "anchor": "top-left"|"top-center"|"top-right"|"left-center"|"center"|"right-center"|"bottom-left"|"bottom-center"|"bottom-right"
   - "fixed": true

   TEXT OBJECT FIELDS (when shape is "text"):
   - "text": string
   - "fontSize": number
   - "fontWeight": "normal" | "bold" | "100" | "400" | "700" | "900"
   - "fontFamily": string
   - "textAlign": "left" | "center" | "right"
   - "letterSpacing": number
   - "lineHeight": number

   POSITIONING: Canvas origin is center (0, 0). Positive x = right, positive y = down.
   Off-screen left = x: -960, right = x: 960, top = y: -540, bottom = y: 540.

3. TIMELINE ARRAY
   Each entry animates ONE property of ONE object over ONE time range.

   Required fields:
   - "target": the object id string
   - "time": [startSec, endSec]

   Animated properties:
   - "x": [from, to], "y": [from, to], "opacity": [from, to], "scale": [from, to]
   - "rotation": [from, to], "scaleX": [from, to], "scaleY": [from, to]
   - "color": [fromHex, toHex], "width": [from, to], "height": [from, to]
   - "orbit": { "center": [x, y], "radius": px, "degrees": totalDeg }
   - "bounce": { "floor": yPx, "heights": [h1, h2, ...] }
   - "trail": { "follows": "target_id", "delay": seconds }
   - "chars": [fromCount, toCount], "words": [fromCount, toCount]
   - "textColor": [fromHex, toHex], "fontSize": [from, to]

   Optional per-entry:
   - "easing": "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring" | "bounce"

   CRITICAL RULES:
   - time[0] must be strictly less than time[1]
   - Each timeline entry animates ONLY ONE property
   - Simultaneous animations on the same object are separate entries with the same time range

---

${EXAMPLES}

---

Convert the following prompt into a Sparse Motion Spec JSON. Return ONLY the JSON.`;

interface SpecValidationResult {
  valid: boolean;
  errors: string[];
  spec: object | null;
}

function validateSpec(spec: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (typeof spec.scene !== "string" || !spec.scene) errors.push("Missing or invalid 'scene'");
  if (typeof spec.duration !== "number" || (spec.duration as number) <= 0) errors.push("Missing or invalid 'duration'");
  if (typeof spec.fps !== "number") errors.push("Missing 'fps'");
  if (!spec.canvas || typeof (spec.canvas as Record<string, unknown>).w !== "number") errors.push("Missing or invalid 'canvas'");
  if (!spec.bg) errors.push("Missing 'bg'");
  if (!Array.isArray(spec.objects) || (spec.objects as unknown[]).length === 0) errors.push("Missing or empty 'objects'");
  if (!Array.isArray(spec.timeline) || (spec.timeline as unknown[]).length === 0) errors.push("Missing or empty 'timeline'");

  const objectIds = new Set<string>();
  if (Array.isArray(spec.objects)) {
    for (const obj of spec.objects as Record<string, unknown>[]) {
      if (!obj.id) errors.push("Object missing 'id'");
      if (!obj.shape) errors.push("Object '" + (obj.id || "unknown") + "' missing 'shape'");
      if (obj.id) objectIds.add(obj.id as string);
    }
  }

  if (Array.isArray(spec.timeline)) {
    for (let i = 0; i < (spec.timeline as Record<string, unknown>[]).length; i++) {
      const entry = (spec.timeline as Record<string, unknown>[])[i];
      if (!entry.target) errors.push("Timeline[" + i + "] missing 'target'");
      if (!Array.isArray(entry.time) || (entry.time as unknown[]).length !== 2) {
        errors.push("Timeline[" + i + "] missing or invalid 'time'");
      } else if ((entry.time as number[])[0] >= (entry.time as number[])[1]) {
        errors.push("Timeline[" + i + "] time[0] must be < time[1]");
      }
      if (entry.target && !objectIds.has(entry.target as string)) {
        errors.push("Timeline[" + i + "] references unknown target '" + entry.target + "'");
      }
    }
  }

  return errors;
}

export async function generateSpec(promptText: string): Promise<SpecValidationResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const MAX_RETRIES = 2;
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.responses.create({
        model: "gpt-4o",
        temperature: 0,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptText },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (response.output[0] as any).content[0].text as string;
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = "Invalid JSON from LLM: " + (parseErr as Error).message;
        if (attempt < MAX_RETRIES) continue;
        return { valid: false, errors: [lastError], spec: null };
      }

      const errors = validateSpec(parsed);
      const hasCritical = errors.some((e) => e.includes("Missing"));

      if (hasCritical && attempt < MAX_RETRIES) {
        lastError = "Validation failed: " + errors.join("; ");
        continue;
      }

      return { valid: errors.length === 0, errors, spec: parsed };
    } catch (err) {
      lastError = (err as Error).message;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
    }
  }

  return { valid: false, errors: [lastError], spec: null };
}
