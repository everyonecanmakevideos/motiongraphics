import fs from "fs-extra";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const INPUT_FILE = "./prompts.json";
const OUTPUT_FOLDER = "./machine_specs_v2";

// ---------------------------------------------------------------------------
// FEW-SHOT EXAMPLES — these replace the old 200-line dense SCHEMA constant.
// The LLM learns the sparse format from concrete examples, not a template.
// ---------------------------------------------------------------------------

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

Prompt: "Circle Breathing Loop. Light background (#F5F5F5). Blue circle (#42A5F5), 160px, centered. Scale breathes: 100% → 108% → 100%, repeat for 6s (2 cycles, 3s each). Easing: ease-in-out. Total duration: 6s."

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

Prompt: "Three Shapes Center Bounce. White background. Circle (140px red #F44336), square (140px blue #2196F3), triangle (140px base green #4CAF50). Animation (6s): 0-2s: Circle slides from left, square from right, triangle drops from top. All arrive at center with bounce. 2-4s: All three rotate slowly in place (each 180°). 4-5s: All scale together: 100% → 110% → 100%. 5-6s: Fade out together. Total duration: 6s."

Output:
{
  "scene": "three_shapes_center_bounce",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "circle_1",
      "shape": "circle",
      "diameter": 140,
      "color": "#F44336",
      "pos": [-960, 0]
    },
    {
      "id": "square_1",
      "shape": "rectangle",
      "size": [140, 140],
      "color": "#2196F3",
      "pos": [960, 0]
    },
    {
      "id": "triangle_1",
      "shape": "triangle",
      "size": [140, 140],
      "color": "#4CAF50",
      "pos": [0, -540]
    }
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
    {
      "id": "planet_1",
      "shape": "circle",
      "diameter": 120,
      "color": "#2196F3",
      "pos": [200, 0]
    },
    {
      "id": "moon_1",
      "shape": "circle",
      "diameter": 40,
      "color": "#FFFFFF",
      "parent": "planet_1",
      "offset": [90, 0]
    }
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

---

EXAMPLE 6 — Gradient background with radial glow + typewriter text

Prompt: "Gradient Title Card. Smooth radial gradient background from deep purple (#7B1FA2) to blue (#2196F3) with a soft white brightness glow in the center. Canvas 1920x1080. Large text '10 years ago' (120px bold Arial, white #FFFFFF) centered. Text reveals with typewriter effect character by character. Animation (6s): 0-4s: Text types in character by character with blinking cursor. 4-6s: Hold completed text. Total duration: 6s."

Output:
{
  "scene": "gradient_title_typewriter",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": { "type": "gradient", "from": "#7B1FA2", "to": "#2196F3", "direction": "radial", "glow": "#FFFFFF" },
  "objects": [
    {
      "id": "title_1",
      "shape": "text",
      "text": "10 years ago",
      "fontSize": 120,
      "fontWeight": "bold",
      "fontFamily": "Arial",
      "color": "#FFFFFF",
      "textAlign": "center",
      "pos": [0, 0],
      "cursor": true
    }
  ],
  "timeline": [
    { "target": "title_1", "time": [0, 4], "chars": [0, 12] }
  ]
}

Note: The gradient and glow are entirely in the "bg" field — no separate circle or glow objects needed. The text starts at full opacity (default 1) so the typewriter chars animation handles the reveal. No opacity animation overlaps with chars.

---

EXAMPLE 7 — Pie chart with sweep reveal (Level 2.1)

Prompt: "Basic Pie Chart. White background. Circle (300px diameter, centered). Two slices: Blue (#2196F3) for 70%, Green (#4CAF50) for 30%. Animation (6s): 0-3s: Entire pie sweeps in radially from 0° to 360° (blue fills first, then green). 3-6s: Hold complete. Total duration: 6s."

Data accuracy: 70% = 252deg, 30% = 108deg. Segments sum to 100. Sweep [0, 360] reveals full pie.

Output:
{
  "scene": "basic_pie_chart",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "pie_1",
      "shape": "pie",
      "diameter": 300,
      "pos": [0, 0],
      "segments": [
        { "label": "Blue", "value": 70, "color": "#2196F3" },
        { "label": "Green", "value": 30, "color": "#4CAF50" }
      ]
    }
  ],
  "timeline": [
    { "target": "pie_1", "time": [0, 3], "easing": "ease-out", "sweep": [0, 360] }
  ]
}

---

EXAMPLE 7 — Donut chart with counter (Level 2.1)

Prompt: "Donut Progress Ring. Light grey background (#F5F5F5). Donut (280px diameter, 40px ring thickness, centered). Track ring is light grey (#E0E0E0). Progress ring is purple (#9C27B0). Center text '0%' in 48px bold. Animation (7s): 0-1s: Track ring fades in. 1-4s: Progress ring sweeps from 0° to 270° (75%). Center text counts from 0% to 75%. 4-5s: Text pulses scale 100%->110%->100%. 5-7s: Hold. Total: 7s."

Data accuracy: 75% = 270deg. Sweep [0, 270]. Counter [0, 75] with "%" suffix. Thickness 40px.

Output:
{
  "scene": "donut_progress_ring",
  "duration": 7,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#F5F5F5",
  "objects": [
    {
      "id": "donut_1",
      "shape": "donut",
      "diameter": 280,
      "thickness": 40,
      "pos": [0, 0],
      "opacity": 0,
      "segments": [
        { "label": "Progress", "value": 75, "color": "#9C27B0" },
        { "label": "Track", "value": 25, "color": "#E0E0E0" }
      ]
    },
    {
      "id": "counter_text",
      "shape": "text",
      "text": "0%",
      "fontSize": 48,
      "fontWeight": "bold",
      "fontFamily": "Arial",
      "color": "#333333",
      "textAlign": "center",
      "pos": [0, 0],
      "opacity": 0
    }
  ],
  "timeline": [
    { "target": "donut_1", "time": [0, 1], "opacity": [0, 1] },
    { "target": "counter_text", "time": [0, 1], "opacity": [0, 1] },
    { "target": "donut_1", "time": [1, 4], "easing": "ease-out", "sweep": [0, 270] },
    { "target": "counter_text", "time": [1, 4], "counter": [0, 75] },
    { "target": "counter_text", "time": [4, 4.5], "easing": "ease-in-out", "scale": [1, 1.1] },
    { "target": "counter_text", "time": [4.5, 5], "easing": "ease-in-out", "scale": [1.1, 1] }
  ]
}

---

EXAMPLE 8 — Bar chart with growing bars (Level 2.1)

Prompt: "Simple Bar Chart. White background. Three vertical bars (60px wide, 20px gaps) centered. Bar A (blue #2196F3, 200px tall), Bar B (green #4CAF50, 280px tall), Bar C (orange #FF9800, 160px tall). Bars grow from a common baseline upward. Animation (6s): 0-1s: Horizontal baseline fades in. 1-2s: Bar A grows. 2-3s: Bar B grows. 3-4s: Bar C grows. 4-6s: Hold. Total: 6s."

Data accuracy: Bar A height=200px, Bar B height=280px, Bar C height=160px. Each bar size[1] matches exactly. Width=60px each, gaps=20px.

Output:
{
  "scene": "simple_bar_chart",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "baseline",
      "shape": "line",
      "size": [260, 2],
      "color": "#333333",
      "pos": [0, 150],
      "opacity": 0
    },
    {
      "id": "bar_a",
      "shape": "rectangle",
      "size": [60, 200],
      "color": "#2196F3",
      "pos": [-80, 50],
      "anchor": "bottom-center",
      "scale": 1
    },
    {
      "id": "bar_b",
      "shape": "rectangle",
      "size": [60, 280],
      "color": "#4CAF50",
      "pos": [0, 10],
      "anchor": "bottom-center",
      "scale": 1
    },
    {
      "id": "bar_c",
      "shape": "rectangle",
      "size": [60, 160],
      "color": "#FF9800",
      "pos": [80, 70],
      "anchor": "bottom-center",
      "scale": 1
    }
  ],
  "timeline": [
    { "target": "baseline", "time": [0, 1], "opacity": [0, 1] },
    { "target": "bar_a", "time": [1, 2], "easing": "ease-out", "scaleY": [0, 1] },
    { "target": "bar_b", "time": [2, 3], "easing": "ease-out", "scaleY": [0, 1] },
    { "target": "bar_c", "time": [3, 4], "easing": "ease-out", "scaleY": [0, 1] }
  ]
}

---

EXAMPLE 9 — Shape with blur, stroke-dash, and perspective tilt

Prompt: "Glowing Focus Circle. Dark background. A circle (200px, white stroke, no fill) draws its outline from 0% to 100%. Starts blurry and focuses in. Then tilts in 3D. Animation (6s): 0-2s: Circle outline draws from 0% to 100%. Simultaneously blur goes from 10px to 0. 2-4s: Circle tilts 30 degrees on Y axis. 4-6s: Hold."

Output:
{
  "scene": "glowing_focus_circle",
  "duration": 6,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#212121",
  "objects": [
    {
      "id": "circle_1",
      "shape": "circle",
      "diameter": 200,
      "stroke": { "color": "#FFFFFF", "width": 3 },
      "fill": false,
      "pos": [0, 0],
      "perspective": 800
    }
  ],
  "timeline": [
    { "target": "circle_1", "time": [0, 2], "strokeDash": [0, 100] },
    { "target": "circle_1", "time": [0, 2], "blur": [10, 0] },
    { "target": "circle_1", "time": [2, 4], "rotateY": [0, 30] }
  ]
}

---

EXAMPLE 10 — Line graph with data point decomposition (Level 2.1)

Prompt: "Simple Line Graph. White background. 4 data points connected by lines. Point A at bottom-left, B at middle-high, C at middle-low, D at top-right. Blue line 4px. Dots at each point 16px. Animation (8s): 0-6s: Polyline draws left to right. 6-8s: Dots pop in with bounce. Total: 8s."

Structural decomposition: 4 data points = polyline (1 shape) + 4 marker circles. Each marker is a separate object.

Output:
{
  "scene": "simple_line_graph",
  "duration": 8,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "line_path",
      "shape": "polyline",
      "vertices": [[-300, 200], [-100, -150], [100, 100], [300, -200]],
      "stroke": { "color": "#1976D2", "width": 4 },
      "opacity": 0
    },
    {
      "id": "dot_a",
      "shape": "circle",
      "diameter": 16,
      "color": "#1976D2",
      "pos": [-300, 200],
      "scale": 0
    },
    {
      "id": "dot_b",
      "shape": "circle",
      "diameter": 16,
      "color": "#1976D2",
      "pos": [-100, -150],
      "scale": 0
    },
    {
      "id": "dot_c",
      "shape": "circle",
      "diameter": 16,
      "color": "#1976D2",
      "pos": [100, 100],
      "scale": 0
    },
    {
      "id": "dot_d",
      "shape": "circle",
      "diameter": 16,
      "color": "#1976D2",
      "pos": [300, -200],
      "scale": 0
    }
  ],
  "timeline": [
    { "target": "line_path", "time": [0, 6], "opacity": [0, 1], "clipExpand": [0, 100] },
    { "target": "dot_a", "time": [6, 6.5], "easing": "bounce", "scale": [0, 1] },
    { "target": "dot_b", "time": [6.5, 7], "easing": "bounce", "scale": [0, 1] },
    { "target": "dot_c", "time": [7, 7.5], "easing": "bounce", "scale": [0, 1] },
    { "target": "dot_d", "time": [7.5, 8], "easing": "bounce", "scale": [0, 1] }
  ]
}

---

EXAMPLE 11 — Area chart with polygon fill and decomposed elements (Level 2.1)

Prompt: "Revenue Area Chart. White background. 5 monthly data points (Jan:100, Feb:180, Mar:140, Apr:220, May:200). Green area fill. Green line on top. Markers at each point. Labels below. Animation (8s): 0-1s: Axes fade in. 1-5s: Area reveals left to right. 5-7s: Markers and labels appear. 7-8s: Hold."

Structural decomposition: 5 data points = 1 polygon (area fill) + 1 polyline (stroke) + 5 markers + 5 labels + 2 axes = 14 objects.

Data accuracy: Vertex Y positions derived from data values. Jan=100 maps to y=100, Feb=180 maps to y=20, etc. (higher value = higher position = lower Y). Baseline at y=200.

Output:
{
  "scene": "revenue_area_chart",
  "duration": 8,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    {
      "id": "x_axis",
      "shape": "line",
      "size": [600, 2],
      "color": "#333333",
      "pos": [0, 200],
      "opacity": 0
    },
    {
      "id": "y_axis",
      "shape": "line",
      "size": [2, 400],
      "color": "#333333",
      "pos": [-300, 0],
      "opacity": 0
    },
    {
      "id": "area_fill",
      "shape": "polygon",
      "vertices": [[-300, 200], [-300, 100], [-150, 20], [0, 60], [150, -20], [300, 0], [300, 200]],
      "color": "#4CAF50",
      "opacity": 0.3
    },
    {
      "id": "line_stroke",
      "shape": "polyline",
      "vertices": [[-300, 100], [-150, 20], [0, 60], [150, -20], [300, 0]],
      "stroke": { "color": "#4CAF50", "width": 3 }
    },
    {
      "id": "marker_1",
      "shape": "circle",
      "diameter": 10,
      "color": "#FFFFFF",
      "stroke": { "color": "#4CAF50", "width": 2 },
      "pos": [-300, 100],
      "scale": 0
    },
    {
      "id": "marker_2",
      "shape": "circle",
      "diameter": 10,
      "color": "#FFFFFF",
      "stroke": { "color": "#4CAF50", "width": 2 },
      "pos": [-150, 20],
      "scale": 0
    },
    {
      "id": "marker_3",
      "shape": "circle",
      "diameter": 10,
      "color": "#FFFFFF",
      "stroke": { "color": "#4CAF50", "width": 2 },
      "pos": [0, 60],
      "scale": 0
    },
    {
      "id": "marker_4",
      "shape": "circle",
      "diameter": 10,
      "color": "#FFFFFF",
      "stroke": { "color": "#4CAF50", "width": 2 },
      "pos": [150, -20],
      "scale": 0
    },
    {
      "id": "marker_5",
      "shape": "circle",
      "diameter": 10,
      "color": "#FFFFFF",
      "stroke": { "color": "#4CAF50", "width": 2 },
      "pos": [300, 0],
      "scale": 0
    },
    {
      "id": "label_jan",
      "shape": "text",
      "text": "Jan",
      "fontSize": 14,
      "fontFamily": "Arial",
      "color": "#666666",
      "pos": [-300, 220],
      "opacity": 0
    },
    {
      "id": "label_feb",
      "shape": "text",
      "text": "Feb",
      "fontSize": 14,
      "fontFamily": "Arial",
      "color": "#666666",
      "pos": [-150, 220],
      "opacity": 0
    },
    {
      "id": "label_mar",
      "shape": "text",
      "text": "Mar",
      "fontSize": 14,
      "fontFamily": "Arial",
      "color": "#666666",
      "pos": [0, 220],
      "opacity": 0
    },
    {
      "id": "label_apr",
      "shape": "text",
      "text": "Apr",
      "fontSize": 14,
      "fontFamily": "Arial",
      "color": "#666666",
      "pos": [150, 220],
      "opacity": 0
    },
    {
      "id": "label_may",
      "shape": "text",
      "text": "May",
      "fontSize": 14,
      "fontFamily": "Arial",
      "color": "#666666",
      "pos": [300, 220],
      "opacity": 0
    }
  ],
  "timeline": [
    { "target": "x_axis", "time": [0, 1], "opacity": [0, 1] },
    { "target": "y_axis", "time": [0, 1], "opacity": [0, 1] },
    { "target": "area_fill", "time": [1, 5], "clipExpand": [0, 100] },
    { "target": "line_stroke", "time": [1, 5], "clipExpand": [0, 100] },
    { "target": "marker_1", "time": [5, 5.4], "scale": [0, 1] },
    { "target": "marker_2", "time": [5.4, 5.8], "scale": [0, 1] },
    { "target": "marker_3", "time": [5.8, 6.2], "scale": [0, 1] },
    { "target": "marker_4", "time": [6.2, 6.6], "scale": [0, 1] },
    { "target": "marker_5", "time": [6.6, 7], "scale": [0, 1] },
    { "target": "label_jan", "time": [5, 5.4], "opacity": [0, 1] },
    { "target": "label_feb", "time": [5.4, 5.8], "opacity": [0, 1] },
    { "target": "label_mar", "time": [5.8, 6.2], "opacity": [0, 1] },
    { "target": "label_apr", "time": [6.2, 6.6], "opacity": [0, 1] },
    { "target": "label_may", "time": [6.6, 7], "opacity": [0, 1] }
  ]
}

---

EXAMPLE 12 — Asset object animation (real-world object)

Prompt: "Rocket Launch. Dark space background (#0F0F23). A white rocket (120px) starts at the bottom center and launches upward to the top with ease-in over 3s. Flame effect: an orange fire asset (60px) trails below the rocket. Both fade in over 0.5s first. Total duration: 5s."

Output:
{
  "scene": "rocket_launch",
  "duration": 5,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#0F0F23",
  "objects": [
    {
      "id": "rocket_1",
      "shape": "asset",
      "assetId": "rocket",
      "size": [120, 120],
      "color": "#FFFFFF",
      "pos": [0, 400],
      "opacity": 0
    },
    {
      "id": "flame_1",
      "shape": "asset",
      "assetId": "fire",
      "size": [60, 60],
      "color": "#FF6B35",
      "pos": [0, 460],
      "opacity": 0
    }
  ],
  "timeline": [
    { "target": "rocket_1", "time": [0, 0.5], "opacity": [0, 1] },
    { "target": "flame_1", "time": [0, 0.5], "opacity": [0, 1] },
    { "target": "rocket_1", "time": [0.5, 3.5], "easing": "ease-in", "y": [400, -500] },
    { "target": "flame_1", "time": [0.5, 3.5], "easing": "ease-in", "y": [460, -440] },
    { "target": "rocket_1", "time": [3.5, 4], "opacity": [1, 0] },
    { "target": "flame_1", "time": [3.5, 4], "opacity": [1, 0] }
  ]
}

EXAMPLE 13 — Kinetic typography: ScalePop + Stagger + Underline

Prompt: "Kinetic Title Sequence. Dark background (#1A1A2E). Canvas 1920x1080. Three text lines staggered vertically: 'DESIGN' (72px bold Arial, white #FFFFFF) at 80px above center, 'CREATE' (72px bold Arial, cyan #00ACC1) at center, 'INSPIRE' (72px bold Arial, pink #E91E63) at 80px below center. Each appears with a scale pop effect (0% to 115% to 100%) with 0.3s stagger delay. After all appear, underlines draw beneath each word from left to right. Hold for 2s. Total duration: 8s."

Output:
{
  "scene": "kinetic_title_stagger",
  "duration": 8,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#1A1A2E",
  "objects": [
    { "id": "line_1", "shape": "text", "text": "DESIGN", "fontSize": 72, "fontWeight": "bold", "fontFamily": "Arial", "color": "#FFFFFF", "pos": [0, -80], "scale": 0 },
    { "id": "line_2", "shape": "text", "text": "CREATE", "fontSize": 72, "fontWeight": "bold", "fontFamily": "Arial", "color": "#00ACC1", "pos": [0, 0], "scale": 0 },
    { "id": "line_3", "shape": "text", "text": "INSPIRE", "fontSize": 72, "fontWeight": "bold", "fontFamily": "Arial", "color": "#E91E63", "pos": [0, 80], "scale": 0 },
    { "id": "underline_1", "shape": "rectangle", "size": [260, 4], "color": "#FFFFFF", "parent": "line_1", "offset": [0, 44], "anchor": "left-center", "opacity": 0 },
    { "id": "underline_2", "shape": "rectangle", "size": [260, 4], "color": "#00ACC1", "parent": "line_2", "offset": [0, 44], "anchor": "left-center", "opacity": 0 },
    { "id": "underline_3", "shape": "rectangle", "size": [300, 4], "color": "#E91E63", "parent": "line_3", "offset": [0, 44], "anchor": "left-center", "opacity": 0 }
  ],
  "timeline": [
    { "target": "line_1", "time": [0, 0.35], "scale": [0, 1.15], "easing": "ease-out" },
    { "target": "line_1", "time": [0.35, 0.55], "scale": [1.15, 1], "easing": "ease-in" },
    { "target": "line_2", "time": [0.3, 0.65], "scale": [0, 1.15], "easing": "ease-out" },
    { "target": "line_2", "time": [0.65, 0.85], "scale": [1.15, 1], "easing": "ease-in" },
    { "target": "line_3", "time": [0.6, 0.95], "scale": [0, 1.15], "easing": "ease-out" },
    { "target": "line_3", "time": [0.95, 1.15], "scale": [1.15, 1], "easing": "ease-in" },
    { "target": "underline_1", "time": [1.5, 1.8], "opacity": [0, 1] },
    { "target": "underline_1", "time": [1.5, 2.5], "width": [0, 260], "easing": "ease-out" },
    { "target": "underline_2", "time": [1.8, 2.1], "opacity": [0, 1] },
    { "target": "underline_2", "time": [1.8, 2.8], "width": [0, 260], "easing": "ease-out" },
    { "target": "underline_3", "time": [2.1, 2.4], "opacity": [0, 1] },
    { "target": "underline_3", "time": [2.1, 3.1], "width": [0, 300], "easing": "ease-out" }
  ]
}

EXAMPLE 14 — Text in container with highlight + slideUp subtitle

Prompt: "Announcement Card. White background (#FFFFFF). Canvas 1920x1080. A rounded purple (#7B1FA2) container box (500x100px, cornerRadius 12) centered. Inside it, white bold text 'NEW FEATURE' (42px Arial). Box scales in with pop effect. After box appears, a yellow (#FDD835) highlight box expands behind the text from left to right. Then subtitle 'Coming Soon' (28px Arial, #757575) appears 80px below center with slide-up effect. Hold for 2s. Total duration: 7s."

Output:
{
  "scene": "announcement_card",
  "duration": 7,
  "fps": 30,
  "canvas": { "w": 1920, "h": 1080 },
  "bg": "#FFFFFF",
  "objects": [
    { "id": "box", "shape": "rectangle", "size": [500, 100], "color": "#7B1FA2", "cornerRadius": 12, "pos": [0, 0], "opacity": 0, "scale": 0, "zIndex": 1 },
    { "id": "box_text", "shape": "text", "text": "NEW FEATURE", "fontSize": 42, "fontWeight": "bold", "fontFamily": "Arial", "color": "#FFFFFF", "parent": "box", "offset": [0, 0], "zIndex": 3 },
    { "id": "text_highlight", "shape": "rectangle", "size": [330, 54], "color": "#FDD835", "parent": "box", "offset": [0, 0], "zIndex": 2, "cornerRadius": 4, "scaleX": 0 },
    { "id": "subtitle", "shape": "text", "text": "Coming Soon", "fontSize": 28, "fontFamily": "Arial", "color": "#757575", "pos": [0, 80], "opacity": 0 }
  ],
  "timeline": [
    { "target": "box", "time": [0, 0.3], "opacity": [0, 1] },
    { "target": "box", "time": [0, 0.4], "scale": [0, 1.15], "easing": "ease-out" },
    { "target": "box", "time": [0.4, 0.6], "scale": [1.15, 1], "easing": "ease-in" },
    { "target": "text_highlight", "time": [1.0, 1.8], "scaleX": [0, 1], "anchor": "left-center", "easing": "ease-out" },
    { "target": "subtitle", "time": [2.2, 2.8], "opacity": [0, 1], "easing": "ease-out" },
    { "target": "subtitle", "time": [2.2, 2.8], "y": [120, 80], "easing": "ease-out" }
  ]
}
`;

const SYSTEM_PROMPT = `You are an expert Motion Graphics Specification Generator.

Your sole objective is to convert natural language motion graphics prompts into a compact, deterministic JSON specification called the **Sparse Motion Spec**.

OUTPUT FORMAT: Return ONLY valid JSON. No conversational text, no explanations, no markdown formatting.

---

SPARSE MOTION SPEC SCHEMA

The spec has 5 top-level keys: scene, duration, fps, canvas, bg, objects, timeline.

1. SCENE METADATA
   - "scene": short snake_case name derived from the prompt
   - "duration": total duration in seconds (number). Must match the "Total duration" stated in the prompt exactly.
   - "fps": always 30
   - "canvas": { "w": W, "h": H } — read dimensions from the prompt:
     - If prompt says "Canvas 1920x1080": { "w": 1920, "h": 1080 } (16:9 landscape)
     - If prompt says "Canvas 1080x1920": { "w": 1080, "h": 1920 } (9:16 portrait)
     - Default to { "w": 1920, "h": 1080 } if not specified
   - "bg": background color or gradient. Formats:
     - Solid color: "#hex" (e.g., "#FFFFFF")
     - Linear gradient: { "type": "gradient", "from": "#hex", "to": "#hex", "direction": "to bottom" }
       Directions: "to bottom", "to right", "to top-right", "to bottom-left", etc.
     - Radial gradient: { "type": "gradient", "from": "#hex", "to": "#hex", "direction": "radial" }
     - Radial with glow: { "type": "gradient", "from": "#hex", "to": "#hex", "direction": "radial", "glow": "#bright_hex" }
       The glow color creates a bright center point that fades outward.
     - With grid overlay: { "color": "#hex", "grid": true, "gridSpacing": 50, "gridColor": "rgba(200,200,200,0.3)" }
       Or combine with gradient: { "type": "gradient", "from": "#hex", "to": "#hex", "direction": "radial", "grid": true, "gridSpacing": 50, "gridColor": "rgba(255,255,255,0.1)" }
     IMPORTANT: Do NOT create separate circle or rectangle objects to simulate background gradients or glows. Use the bg field.
     IMPORTANT: Do NOT create individual line objects for grid backgrounds. Use bg.grid instead.

2. OBJECTS ARRAY
   Each object has ONLY the properties it needs. Omit any property that uses its default value.

   Required fields:
   - "id": unique string identifier (e.g., "circle_1", "rect_2")
   - "shape": "circle" | "rectangle" | "triangle" | "pentagon" | "star" | "line" | "text" | "pie" | "donut" | "gauge" | "polygon" | "polyline" | "asset"

   Optional fields (include ONLY if needed):
   - "diameter": number (for circles)
   - "size": [width, height] (for rectangles, triangles, etc.)
   - "color": hex string (default: none / transparent)
   - "stroke": { "color": "#hex", "width": number } (for outlined shapes)
   - "fill": false (default is true; only include if explicitly no fill)
   - "pos": [x, y] (default: [0, 0] = canvas center)
   - "opacity": number 0-1 (default: 1; set to 0 if shape starts invisible)
   - "rotation": degrees (default: 0)
   - "scale": number (default: 1)
   - "cornerRadius": number (for rounded rectangles)
   - "facing": "up" | "down" | "left" | "right" (for triangles; default: "up")
   - "zIndex": number (for layering)
   - "blendMode": "screen" | "multiply" etc.
   - "parent": string — id of the parent object; this object's transforms are relative to parent's center
   - "offset": [x, y] — position relative to parent's center (use instead of "pos" when "parent" is set)
   - "anchor": "top-left"|"top-center"|"top-right"|"left-center"|"center"|"right-center"|"bottom-left"|"bottom-center"|"bottom-right" — transform-origin pivot for all transforms on this object
   - "fixed": true — pins this object to absolute canvas coordinates, not affected by any parent transforms
   - "perspective": number — CSS perspective distance in px (required when rotateX/rotateY is used, e.g., 800)

   DATA VISUALIZATION OBJECT FIELDS (for pie, donut, gauge shapes):
   - "segments": [{ "label": "string", "value": number, "color": "#hex" }, ...] — data segments with values and colors
   - "innerDiameter": number — hole diameter for donut charts (in px)
   - "thickness": number — ring thickness for donut charts (in px, alternative to innerDiameter)
   - "needle": { "length": number, "color": "#hex" } — gauge needle configuration
   - "gridLines": true — show faint background grid lines behind the chart

   POLYGON / POLYLINE OBJECT FIELDS (for data-driven shapes):
   - "vertices": [[x1,y1], [x2,y2], ...] — vertex coordinates in px relative to canvas center. For polygon shapes, the area is filled. For polyline shapes, only the stroke is drawn.
   - "closed": true — for polyline, close the path back to the first point (default: false)

   ASSET OBJECT FIELDS (include only when shape is "asset"):
   - "assetId": string — the asset identifier. Available assets: rocket, car, airplane, bicycle, bus, ship, train, truck, smartphone, tablet, laptop, monitor, server, cpu, wifi, database, cloud, sun, moon, tree, fire, mountain, water, flower, heart, user, users, brain, eye, hand, briefcase, target, lightbulb, trophy, dollar, chart-up, lightning, gear, arrow-right, checkmark, home, bell, lock, star-icon, music, camera, microphone, play
   - "size": [width, height] — display size in pixels
   - Use "color" to set the SVG fill color override
   - Use "stroke" to set SVG stroke overrides
   - All standard positioning and animation properties (pos, opacity, rotation, scale, etc.) work the same as other shapes

   TEXT OBJECT FIELDS (include only when shape is "text"):
   - "text": string — the text content to display
   - "fontSize": number — font size in pixels (e.g., 64)
   - "fontWeight": "normal" | "bold" | "100" | "400" | "700" | "900"
   - "fontFamily": string — system-safe fonts only: "Arial", "Helvetica", "Georgia", "Times New Roman", "monospace", "sans-serif", "serif"
   - "fontStyle": "normal" | "italic"
   - "textAlign": "left" | "center" | "right" (default: "center")
   - "letterSpacing": number — spacing between characters in pixels (default: 0)
   - "lineHeight": number — line height multiplier (default: 1.2)
   - "textTransform": "none" | "uppercase" | "lowercase" | "capitalize"
   - "maxWidth": number — maximum width in pixels before text wraps
   - "cursor": true — show a blinking cursor after text (for typewriter animations)

   POSITIONING — CENTER-RELATIVE COORDINATE SYSTEM (CRITICAL)

   ALL coordinates use a CENTER-RELATIVE system where halfW = canvas.w / 2, halfH = canvas.h / 2:
   - Origin (0, 0) = the exact center of the canvas
   - x ranges from -halfW (left edge) to +halfW (right edge)
   - y ranges from -halfH (top edge) to +halfH (bottom edge)
   - Positive x = rightward, Positive y = downward

   For 1920x1080 (16:9): halfW=960, halfH=540. x: [-960, +960], y: [-540, +540]
   For 1080x1920 (9:16): halfW=540, halfH=960. x: [-540, +540], y: [-960, +960]

   This is NOT a top-left pixel coordinate system. Do NOT use absolute pixel positions.

   REFERENCE POSITIONS (for 1920x1080):
     Canvas center:       [0, 0]
     Top-left corner:     [-960, -540]
     Top-right corner:    [960, -540]
     Bottom-left corner:  [-960, 540]
     Bottom-right corner: [960, 540]
     Off-screen left:     [-1080, 0]   (beyond left edge)
     Off-screen right:    [1080, 0]    (beyond right edge)
     Off-screen top:      [0, -640]    (beyond top edge)
     Off-screen bottom:   [0, 640]     (beyond bottom edge)

   REFERENCE POSITIONS (for 1080x1920):
     Canvas center:       [0, 0]
     Top-left corner:     [-540, -960]
     Top-right corner:    [540, -960]
     Bottom-left corner:  [-540, 960]
     Bottom-right corner: [540, 960]
     Off-screen left:     [-660, 0]    (beyond left edge)
     Off-screen right:    [660, 0]     (beyond right edge)
     Off-screen top:      [0, -1080]   (beyond top edge)
     Off-screen bottom:   [0, 1080]    (beyond bottom edge)

   SAFE ZONE (mandatory for all on-screen objects):
   - Keep objects within: x: [-(halfW - 60), +(halfW - 60)], y: [-(halfH - 60), +(halfH - 60)]
   - For 1920x1080: safe x: [-900, 900], safe y: [-480, 480]
   - For 1080x1920: safe x: [-480, 480], safe y: [-900, 900]
   - Exception: objects intentionally off-screen for enter/exit animations
   - Object EDGES (center +/- half-dimension) must stay within the safe zone
   - For circles: center.x +/- radius must be within safe x range
   - For rectangles: center.x +/- width/2 and center.y +/- height/2 must be within safe range
   - For text: estimate width as fontSize * 0.6 * text.length. Center +/- estimated_width/2 must fit.
   - No two text objects should overlap. Keep at least 80px vertical gap between text items at similar positions.
   - Minimum gap between any two objects: 40px between their edges

   WRONG vs RIGHT examples:
     "Object at canvas center"        WRONG: [960, 540]    RIGHT: [0, 0]
     "Object at top-left"             WRONG: [0, 0]        RIGHT: [-960, -540]
     "Object off-screen right"        WRONG: [2040, 540]   RIGHT: [1080, 0]
     "Object slightly left of center" WRONG: [860, 540]    RIGHT: [-100, 0]

   FORBIDDEN VALUES: If you write pos: [960, 540] for "center", you are using absolute coordinates — STOP and convert. The value [960, 540] in this system means 960px RIGHT and 540px DOWN from center, which is the bottom-right CORNER of the canvas.

   Timeline x, y, and pos values use the same center-relative coordinate system.

3. TIMELINE ARRAY
   Each entry animates ONE property of ONE object over ONE time range.

   Required fields:
   - "target": the object id string
   - "time": [startSec, endSec]

   Animated properties (include ONLY the ones being animated):
   - "x": [from, to] — horizontal translation
   - "y": [from, to] — vertical translation
   - "pos": [[fromX, fromY], [toX, toY]] — combined position (use when both x and y change)
   - "opacity": [from, to]
   - "scale": [from, to]
   - "rotation": [from, to] — in degrees
   - "scaleX": [from, to] — independent width scaling
   - "scaleY": [from, to] — independent height scaling
   - "color": [fromHex, toHex] — color transition
   - "cornerRadius": [from, to]
   - "skewX": [from, to]
   - "skewY": [from, to]
   - "width": [from, to] — for line/bar growth animations
   - "height": [from, to] — for bar growth animations
   - "strokeWidth": [from, to]
   - "shadow": { "from": [ox, oy, blur, spread, color], "to": [ox, oy, blur, spread, color] }
   - "glow": { "from": [blur, intensity, color], "to": [blur, intensity, color] }

   Advanced animation properties:
   - "orbit": { "center": [x, y], "radius": px, "degrees": totalDeg }
   - "bounce": { "floor": yPx, "heights": [h1, h2, ...] }
   - "pivot": [canvasX, canvasY] — rotate or scale around this canvas-coordinate point instead of the object's own center
   - "anchor": same values as object anchor — overrides the object-level anchor for this animation entry only
   - "trail": { "follows": "target_id", "delay": seconds } — this object follows the target's position with a time lag
   - "chars": [fromCount, toCount] — typewriter reveal by character count (for text shape targets)
   - "words": [fromCount, toCount] — typewriter reveal by word count (for text shape targets)
   - "textColor": [fromHex, toHex] — animate the text fill color (for text shape targets)
   - "fontSize": [from, to] — animate font size in pixels (for text shape targets)
   - "letterSpacing": [from, to] — animate letter spacing in pixels (for text shape targets)
   - "morphTo": { "shape": "circle"|"rectangle"|..., "size": [w, h] }
   - "sweep": [fromDeg, toDeg] — conic-gradient sweep angle for pie/donut/gauge reveal animation
   - "needleRotation": [fromDeg, toDeg] — gauge needle rotation angle
   - "counter": [fromNum, toNum] — animated number display (for text objects showing counters)
   - "clipExpand": [from%, to%] — clip-path horizontal reveal percentage (for area graphs)
   - "blur": [fromPx, toPx] — animate CSS filter blur (e.g., [10, 0] for focus-in, [0, 8] for defocus)
   - "strokeDash": [from%, to%] — animate stroke/outline drawing from 0% to 100% visibility
   - "gradientAngle": [fromDeg, toDeg] — animate linear-gradient angle rotation
   - "rotateX": [fromDeg, toDeg] — 3D tilt around X axis (creates top/bottom perspective distortion)
   - "rotateY": [fromDeg, toDeg] — 3D tilt around Y axis (creates left/right perspective distortion)

   Optional per-entry:
   - "easing": "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring" | "bounce" (default: "linear")

   CRITICAL RULES:
   - time[0] must be strictly less than time[1]
   - Each timeline entry animates ONLY ONE property (or a small related group like orbit)
   - If a shape scales AND rotates in the same time range, create TWO separate timeline entries
   - Simultaneous animations on the same object are separate entries with the same time range
   - Sequential phases are separate entries with non-overlapping time ranges
   - For staggered sequences, create separate entries per object with offset times

---

DATA ACCURACY RULES FOR DATAVIZ PROMPTS:
When the prompt describes a data visualization, you MUST preserve the exact data values:

PIE / DONUT:
- Convert percentages to segment "value" fields: "value": 70 means 70% of the total = 252°
- The sum of all segment values must equal 100 (or proportionally correct)
- sweep timeline must end at the exact cumulative degree (e.g., 252° for 70%, 360° for full)

BAR CHARTS:
- Each bar's "size" height must match the prompt's stated pixel height exactly
- Bar positions must reflect the correct spacing and alignment from the prompt
- Value labels must show the exact numbers stated in the prompt

GAUGES / SPEEDOMETERS:
- "needleRotation" end value must map the data value to the gauge's degree range
- For a 180° gauge showing value 85 out of 100: needleRotation target = 85/100 * 180 = 153°
- Segment boundaries must match the prompt's described ranges exactly

COUNTERS:
- "counter" timeline must use [0, exactTargetValue] from the prompt
- If the prompt says "counts to 75%", counter must be [0, 75]
- Text suffix ("%", "k", "$") must match the prompt

FUNNEL / PYRAMID:
- Tier widths and heights must match the prompt's stated dimensions exactly
- Label values (10k, 5k, 1k) must match the prompt exactly

ACTIVITY RINGS:
- Each ring's sweep target must match the exact percentage from the prompt
- 80% = 288°, 60% = 216°, 40% = 144°

SCATTER PLOTS:
- Dot positions should be spread meaningfully across the chart area
- The number of dots must match the prompt exactly

GENERAL:
- Never approximate or round data values from the prompt
- Preserve exact hex colors, pixel sizes, and percentages as stated

---

DATAVIZ STRUCTURAL DECOMPOSITION RULES:
When the prompt describes a data visualization, you MUST decompose it into individual elements. NEVER collapse chart components into single objects.

MARKERS / DATA POINTS:
- Each data point marker is a SEPARATE circle object with its own id, pos, and style.
- A chart with 12 data points = 12 individual circle objects (marker_1, marker_2, ... marker_12).
- NEVER use a single circle object to represent multiple markers.

LABELS:
- Each axis label is a SEPARATE text object with its own id and pos.
- X-axis with "Jan Feb Mar ... Dec" = 12 individual text objects, NOT one text with spaces.
- Y-axis with "$0 $10K $20K $30K $40K $50K" = 6 individual text objects.
- Value labels above data points = individual text objects per data point.

GRIDLINES:
- Each horizontal gridline is a SEPARATE line object at a specific Y position.
- 5 gridlines = 5 line objects (gridline_1 through gridline_5), NOT one line object.

AREA CHARTS:
- The filled area shape MUST be a "polygon" object with "vertices" defining the actual data curve.
- Vertices are computed from the data points plus the baseline corners.
- Example: for data points at heights [100, 150, 120], the polygon vertices include the data points AND the bottom-left and bottom-right baseline corners to close the area.
- NEVER use a rectangle to represent an area chart fill.

LINE GRAPHS:
- The line stroke MUST be a "polyline" object with "vertices" matching the data coordinates.
- NEVER use a single horizontal line to represent a multi-point line graph.

RADAR / SPIDER CHARTS:
- The data polygon MUST be a "polygon" object with vertices at the actual data distances from center.
- Each vertex position is calculated: x = distance * cos(angle), y = distance * sin(angle).
- NEVER use a uniform pentagon with scale animation for irregular data.
- Concentric web lines = multiple separate pentagon objects at different sizes.

GENERAL PRINCIPLE:
If a chart has N data points, expect roughly 2N-3N objects (markers + labels + the chart shape itself).
A chart with 12 data points typically needs 30-40 objects. This is correct and expected.

---

${EXAMPLES}

---

DURATION CONSISTENCY RULES:
- The "duration" field MUST match the "Total duration: Ns" stated in the prompt exactly
- Every timeline entry's time[1] MUST be <= duration
- No timeline entry may have time[0] >= duration (animation cannot start after the video ends)
- The last visible animation should end at or near the duration value
- Do not leave large gaps of idle time — fill the duration with purposeful animation

COORDINATE SYSTEM REMINDER: All pos, x, y values must use center-relative coordinates where (0,0) is canvas center. halfW = canvas.w / 2, halfH = canvas.h / 2. Values like [960, 540] or [1920, 1080] are ABSOLUTE coordinates and are WRONG. Canvas center = [0, 0]. Always.

ALIGNMENT REMINDER: All on-screen objects must have their edges within the safe zone (60px inset from canvas edges). Text objects must not overlap each other. Use proper spacing between labels, titles, and visual content.

KINETIC TYPOGRAPHY PATTERNS:
When the prompt describes text effects, compose them from existing timeline primitives:
- "scale pop" / "pop in" → two sequential scale entries: [0, 1.15] then [1.15, 1] with ease-out / ease-in
- "blur reveal" / "focus in" → simultaneous blur [12, 0] + opacity [0, 1] in the same time range
- "slide up" / "rise up" → y [finalPos + 40, finalPos] + opacity [0, 1] with ease-out
- "typewriter" → chars [0, N] with NO overlapping opacity animation (typewriter IS the reveal)
- "underline draw" → child rectangle with parent: "text_id", width [0, W], anchor "left-center", offset below text
- "highlight reveal" / "highlight box" → child rectangle behind text with scaleX [0, 1], lower zIndex, anchor "left-center"
- "stagger" / "one by one" → separate text objects with 0.2-0.3s offset start times, each with its own timeline entries
- "text in box" / "container" / "badge" → rectangle parent + text child with parent field and offset [0, 0]
- "counter" / "counting number" → counter [0, N] on text object
- "fade in" → simple opacity [0, 1]
- Compound effects: combine the above. E.g., "pop in with underline" = scalePop entries + underline child rectangle with width animation

Convert the following prompt into a Sparse Motion Spec JSON. Return ONLY the JSON.`;

const DELAY_MS = 3000;
const BATCH_SIZE = 2;
const BATCH_DELAY = 40000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Validate the sparse spec has all required top-level fields and structure
// ---------------------------------------------------------------------------
function validateSpec(spec) {
  const errors = [];

  if (typeof spec.scene !== "string" || !spec.scene) errors.push("Missing or invalid 'scene'");
  if (typeof spec.duration !== "number" || spec.duration <= 0) errors.push("Missing or invalid 'duration'");
  if (typeof spec.fps !== "number") errors.push("Missing 'fps'");
  if (!spec.canvas || typeof spec.canvas.w !== "number") errors.push("Missing or invalid 'canvas'");
  if (!spec.bg) errors.push("Missing 'bg'");
  if (!Array.isArray(spec.objects) || spec.objects.length === 0) errors.push("Missing or empty 'objects'");
  if (!Array.isArray(spec.timeline) || spec.timeline.length === 0) errors.push("Missing or empty 'timeline'");

  // Validate objects
  const objectIds = new Set();
  if (Array.isArray(spec.objects)) {
    for (const obj of spec.objects) {
      if (!obj.id) errors.push("Object missing 'id'");
      if (!obj.shape) errors.push("Object '" + (obj.id || "unknown") + "' missing 'shape'");
      if ((obj.shape === "polygon" || obj.shape === "polyline") && !Array.isArray(obj.vertices)) {
        errors.push("Object '" + (obj.id || "unknown") + "' with shape '" + obj.shape + "' missing 'vertices' array");
      }
      if (obj.shape === "asset" && !obj.assetId) {
        errors.push("Object '" + (obj.id || "unknown") + "' with shape 'asset' missing 'assetId'");
      }
      if (obj.id) objectIds.add(obj.id);
    }
  }

  // Dynamic canvas bounds
  const canvasW = (spec.canvas && spec.canvas.w) || 1920;
  const canvasH = (spec.canvas && spec.canvas.h) || 1080;
  const halfW = canvasW / 2;
  const halfH = canvasH / 2;
  const offScreenThresholdX = halfW + 140;
  const offScreenThresholdY = halfH + 160;

  // Validate timeline entries
  if (Array.isArray(spec.timeline)) {
    for (let i = 0; i < spec.timeline.length; i++) {
      const entry = spec.timeline[i];
      if (!entry.target) errors.push("Timeline[" + i + "] missing 'target'");
      if (!Array.isArray(entry.time) || entry.time.length !== 2) {
        errors.push("Timeline[" + i + "] missing or invalid 'time'");
      } else {
        if (entry.time[0] >= entry.time[1]) {
          errors.push("Timeline[" + i + "] time[0] must be < time[1]");
        }
        // Duration consistency: timeline must not exceed spec duration
        if (typeof spec.duration === "number") {
          if (entry.time[1] > spec.duration + 0.1) {
            errors.push("Timeline[" + i + "] time[1]=" + entry.time[1] + "s exceeds spec duration=" + spec.duration + "s");
          }
          if (entry.time[0] >= spec.duration) {
            errors.push("Timeline[" + i + "] starts at " + entry.time[0] + "s which is at or past duration=" + spec.duration + "s");
          }
        }
      }
      if (entry.target && !objectIds.has(entry.target)) {
        errors.push("Timeline[" + i + "] references unknown target '" + entry.target + "'");
      }
    }
  }

  // Detect probable absolute (top-left origin) coordinates instead of center-relative
  if (Array.isArray(spec.objects)) {
    for (const obj of spec.objects) {
      if (Array.isArray(obj.pos)) {
        const x = obj.pos[0];
        const y = obj.pos[1];
        if (x === 960 && y === 540) {
          errors.push("Object '" + (obj.id || "unknown") + "' pos [960,540] looks like absolute center — should be [0,0] in center-relative coords");
        }
        if (Math.abs(x) > offScreenThresholdX || Math.abs(y) > offScreenThresholdY) {
          errors.push("Object '" + (obj.id || "unknown") + "' pos [" + x + "," + y + "] is far off-screen — verify center-relative coordinates");
        }
      }
    }
  }

  // Check timeline pos values for absolute coordinates
  if (Array.isArray(spec.timeline)) {
    for (let i = 0; i < spec.timeline.length; i++) {
      const entry = spec.timeline[i];
      if (Array.isArray(entry.pos) && entry.pos.length === 2 && typeof entry.pos[0] === "number") {
        if (entry.pos[0] === 960 && entry.pos[1] === 540) {
          errors.push("Timeline[" + i + "] target '" + entry.target + "' pos [960,540] looks like absolute center — should be [0,0]");
        }
      }
    }
  }

  // Typewriter + opacity conflict check (warning)
  if (Array.isArray(spec.timeline)) {
    const charEntries = spec.timeline.filter(function(e) { return e.chars || e.words; });
    for (const ce of charEntries) {
      const overlappingOpacity = spec.timeline.find(function(e) {
        return e.target === ce.target && e.opacity &&
          Array.isArray(e.time) && Array.isArray(ce.time) &&
          e.time[0] < ce.time[1] && e.time[1] > ce.time[0];
      });
      if (overlappingOpacity) {
        console.warn("  WARNING: Target '" + ce.target + "' has chars/words animation overlapping with opacity animation at time [" + overlappingOpacity.time + "]. This makes text invisible during typewriter reveal. Fix: complete opacity fade-in BEFORE starting chars animation.");
      }
    }
  }

  // Layout validation (warnings only — logged but do not trigger retry)
  const layoutWarnings = validateLayout(spec, halfW, halfH);
  if (layoutWarnings.length > 0) {
    console.warn("  Layout warnings:");
    layoutWarnings.forEach(function(w) { console.warn("    - " + w); });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Layout validation — checks safe zones, text overlap, object spacing
// ---------------------------------------------------------------------------
function validateLayout(spec, halfW, halfH) {
  const warnings = [];
  const safeX = halfW - 60;
  const safeY = halfH - 60;

  if (!Array.isArray(spec.objects)) return warnings;

  // Collect bounding boxes for text objects
  const textBoxes = [];

  for (const obj of spec.objects) {
    if (!Array.isArray(obj.pos)) continue;
    const x = obj.pos[0];
    const y = obj.pos[1];

    // Skip off-screen objects (intentional enter/exit)
    if (Math.abs(x) > halfW || Math.abs(y) > halfH) continue;

    // Calculate half-dimensions
    let hw = 0;
    let hh = 0;
    if (obj.shape === "circle" && obj.diameter) {
      hw = obj.diameter / 2;
      hh = obj.diameter / 2;
    } else if (obj.size && Array.isArray(obj.size)) {
      hw = obj.size[0] / 2;
      hh = obj.size[1] / 2;
    } else if (obj.shape === "text") {
      var fontSize = obj.fontSize || 48;
      var textLen = (obj.text || "").length;
      hw = (fontSize * 0.6 * textLen) / 2;
      hh = (fontSize * 1.2) / 2;
    }

    // Check safe zone
    if (hw > 0 || hh > 0) {
      if (Math.abs(x) + hw > safeX + 10) {
        warnings.push("Object '" + obj.id + "' edge exceeds horizontal safe zone (x=" + x + ", half-width=" + hw + ", safe=" + safeX + ")");
      }
      if (Math.abs(y) + hh > safeY + 10) {
        warnings.push("Object '" + obj.id + "' edge exceeds vertical safe zone (y=" + y + ", half-height=" + hh + ", safe=" + safeY + ")");
      }
    }

    // Collect text bounding boxes for overlap detection
    if (obj.shape === "text" && hw > 0) {
      textBoxes.push({
        id: obj.id,
        left: x - hw,
        right: x + hw,
        top: y - hh,
        bottom: y + hh
      });
    }
  }

  // Check text-text overlap
  for (var i = 0; i < textBoxes.length; i++) {
    for (var j = i + 1; j < textBoxes.length; j++) {
      var a = textBoxes[i];
      var b = textBoxes[j];
      var overlapX = a.left < b.right && a.right > b.left;
      var overlapY = a.top < b.bottom && a.bottom > b.top;
      if (overlapX && overlapY) {
        warnings.push("Text '" + a.id + "' and '" + b.id + "' bounding boxes overlap — add more spacing");
      }
    }
  }

  return warnings;
}

async function convertPrompt(promptText) {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    
    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: promptText
      }
    ]
  });

  return response.output_text;
}

async function main() {
  await fs.ensureDir(OUTPUT_FOLDER);

  const prompts = await fs.readJson(INPUT_FILE);

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    const id = item.id;
    const prompt = item.prompt;

    const outputPath = OUTPUT_FOLDER + "/spec_" + id + ".json";

    if (await fs.pathExists(outputPath)) {
      console.log("Skipping " + id + " (already generated)");
      continue;
    }

    let retries = 0;
    const MAX_RETRIES = 2;

    while (retries <= MAX_RETRIES) {
      try {
        console.log("Processing prompt " + id + (retries > 0 ? " (retry " + retries + ")" : ""));

        const rawSpec = await convertPrompt(prompt);

        const cleaned = rawSpec
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // Parse and validate
        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error("Invalid JSON from LLM for prompt " + id + ": " + parseErr.message);
          retries++;
          if (retries <= MAX_RETRIES) {
            await sleep(5000);
            continue;
          }
          break;
        }

        const validationErrors = validateSpec(parsed);
        if (validationErrors.length > 0) {
          console.warn("Validation warnings for prompt " + id + ":");
          validationErrors.forEach(e => console.warn("  - " + e));
          if (validationErrors.some(e => e.includes("Missing"))) {
            retries++;
            if (retries <= MAX_RETRIES) {
              console.log("Retrying due to validation errors...");
              await sleep(5000);
              continue;
            }
          }
        }

        // Write the validated spec
        await fs.writeFile(outputPath, JSON.stringify(parsed, null, 2));
        console.log("Saved " + outputPath + " (" + JSON.stringify(parsed).length + " bytes)");
        break; // success — exit retry loop

      } catch (error) {
        console.error("Error on prompt " + id, error.message);
        retries++;
        if (retries <= MAX_RETRIES) {
          await sleep(10000);
        }
      }
    }

    // Small delay between each request
    await sleep(DELAY_MS);

    // Batch pause
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log("Batch limit reached. Waiting " + (BATCH_DELAY / 1000) + " seconds...");
      await sleep(BATCH_DELAY);
    }
  }
}

main();