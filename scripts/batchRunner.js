require("dotenv").config();
const fs = require("fs");
const { execSync } = require("child_process");
const OpenAI = require("openai");
const { createObjectCsvWriter } = require("csv-writer");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompts = JSON.parse(fs.readFileSync("./prompts.json"));

const csvWriter = createObjectCsvWriter({
  path: "results.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "category", title: "Category" },
    { id: "prompt", title: "Prompt" },
    { id: "videoLink", title: "Video" },
    { id: "codeLink", title: "Code" },
    { id: "visualClarity", title: "Visual Clarity (1-5)" },
    { id: "motionSmoothness", title: "Motion Smoothness (1-5)" },
    { id: "promptFaithfulness", title: "Prompt Faithfulness (1-5)" },
    { id: "codeCleanliness", title: "Code Cleanliness (1-5)" },
    { id: "reusability", title: "Reusability (1-5)" },
    { id: "notes", title: "Notes" },
  ],
  append: true,
});

// Parse duration from prompt (e.g. "Total duration: 6s" → 180 frames)
function parseDuration(promptText) {
  const match = promptText.match(/Total duration:\s*(\d+(?:\.\d+)?)\s*s/);
  if (match) {
    const seconds = parseFloat(match[1]);
    return Math.floor(seconds * 30); // FPS = 30
  }
  console.warn("No duration found, defaulting to 120 frames");
  return 120;
}

async function generateCode(promptText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
        You are generating animation code for Remotion (frame-based renderer).

CONTEXT:
- Target: Level 1.2 Multi-Shape Coordination (Multiple independent shapes animating together).
- Duration: Use the total duration from the prompt description.
- FPS: 30
- Total frames = durationInSeconds * 30
- Environment: Node rendering (NOT browser runtime).

ABSOLUTE RUNTIME & STRUCTURE RULES (CRITICAL)
- Output ONLY the component BODY (no imports, no exports, no wrapper component definition).
- Use ONLY: div, AbsoluteFill, useCurrentFrame, interpolate.
- Declare exactly: const frame = useCurrentFrame();
- Must explicitly use return.
- Must return a single <AbsoluteFill> root element.
- Use inline style only (style={{ ... }}).
- No external libraries. No framer-motion. No CSS keyframes.
- No className. No randomness (use fixed Math.sin/Math.cos or pseudo-random deterministic math if necessary, but prefer exact interpolation).
- No requestAnimationFrame.
- No React hooks other than useCurrentFrame.
- Do NOT wrap logic in IIFEs or anonymous functions.
- Do NOT create additional React components.
- Do NOT reference window, document, or browser-only APIs.

STRING & SYNTAX RULES (BUILD-SAFE)
- Do NOT use backticks (\`).
- Do NOT use template literals or interpolation syntax (\${}).
- Do NOT output the dollar symbol ($).
- Build dynamic strings using string concatenation only.

Correct:
const x = interpolate(frame, [0, 45], [1200, 0]);
const transformValue = "translate(-50%, -50%) translateX(" + x + "px)";

Wrong:
const transformValue = \`translate(-50%, -50%) translateX(\${x}px)\`;

IF/ELSE SYNTAX (CRITICAL):
- Every 'if' must have matching '{' and '}' braces.
- Every 'else' must be preceded by '}'.
- Use this EXACT pattern for multi-phase states:

let progress1;
if (frame < 45) {
  progress1 = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame < 90) {
  progress1 = interpolate(frame, [45, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  progress1 = 0;
}

INTERPOLATION RULES (STRICT, NO CRASHES)
1. Use ONLY 2-point interpolation: [startFrame, endFrame], [startValue, endValue].
2. inputRange[0] MUST BE < inputRange[1] (strictly increasing).
3. NEVER do [30, 30] -> CRASH. Use if/else instead for instant changes.
4. inputRange length MUST equal outputRange length (exactly 2).
5. Never use 3-point or multi-step arrays in a single interpolate() call.
6. Never pass non-numeric values to interpolate().
7. Never use frame arrays or index into arrays inside interpolate().
8. Always explicitly clamp interpolations: { extrapolateLeft: "clamp", extrapolateRight: "clamp" }.
STRICT MONOTONIC TIMING RULE (CRITICAL FOR INTERPOLATE)
9. The inputRange array MUST be strictly monotonically increasing: inputRange[0] MUST be less than inputRange[1].
10. NEVER create backward ranges like [135, 90]. This will instantly crash the renderer.
11. When calculating staggered delays or using variables (e.g., [startTime, startTime + 45]), double-check your math to ensure the first number is ALWAYS smaller than the second number.
12. If a phase has 0 duration (start and end frames are the same), do NOT use interpolate(). Use an if/else block to set the static value instead.
COLOR ANIMATION RULES
13. interpolate() can animate ONLY a single numeric channel.
14. Never interpolate color arrays or hex codes directly.
15. To animate color, interpolate R, G, B channels separately, then concatenate:
const r = Math.round(interpolate(frame, [0, 30], [255, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
const color = "rgb(" + r + ",0,0)";

BACKGROUND RULES (MANDATORY)
- Every animation MUST explicitly define background on the root AbsoluteFill.
- Example: backgroundColor: "#FFFFFF" or background: "linear-gradient(to bottom, #E3F2FD, #BBDEFB)".
- Do NOT use invalid gradient syntax; always use: "linear-gradient(to direction, color1, color2)".
- Never omit the background.

MULTI-SHAPE CENTERING & POSITIONING RULES (CRITICAL)
- Because multiple shapes must coordinate perfectly, DO NOT rely on flexbox for shape layout unless specifically building a 1D row.
- To perfectly center a shape, apply this exact style to the shape's div:
  position: "absolute",
  left: "50%",
  top: "50%",
  width: widthValue + "px",
  height: heightValue + "px",
  transform: "translate(-50%, -50%)"
- When applying animated transforms (scale, rotation, offset), ALWAYS append them AFTER the centering translation. 
- CRITICAL: Ensure you use the exact variables you declared for that specific shape.
  Correct Example: const transformString = "translate(-50%, -50%) translateX(" + shape1X + "px) translateY(" + shape1Y + "px) rotate(" + shape1Rot + "deg) scale(" + shape1Scale + ")";
  Never use a variable like "scale" unless you explicitly declared "let scale;".
- Grids: Calculate explicit top/left pixel offsets for each grid item (e.g., -100, 0, 100) and apply them via translateX/translateY from the center point.

SHAPE RENDERING RULES (ONLY DIVS ALLOWED)
- Circles: borderRadius: "50%"
- Squares/Rectangles: Standard width/height.
- Triangles, Pentagons, Stars: Since ONLY divs are allowed, you MUST use CSS 'clipPath' to carve the shape out of a standard rectangular div. 
  - Triangle (pointing up): clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
  - Triangle (pointing down): clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)"
  - Pentagon: clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
  - Star: clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
- Lines: A line is just a thin div (e.g., height: "4px", width: "400px"). Use transform-origin if sweeping/rotating.

STAGGERED TIMING & STRICT ANTI-LOOPING RULES
- ABSOLUTELY NO LOOPS OR MAPS. Do NOT use 'for' loops. Do NOT use '.map()'. 
- If a prompt asks for a grid of 9 shapes, you MUST physically write out 9 separate <div> elements and declare 9 separate sets of variables (e.g., shape1Opacity, shape2Opacity, etc.). Do NOT be lazy.
- For staggered animations, calculate exact start and end frames for EACH shape individually based on the total duration.
- Example for 3 staggered shapes: const start1 = 0; const start2 = 15; const start3 = 30;
- You must write out explicitly named variables for each shape (e.g., shape1X, shape2X, shape3X).
- If a variable value changes conditionally, declare it with let. Do NOT reassign variables declared with const.
EXTREME REPETITION & BRUTE-FORCE RULE (CRITICAL FOR GRIDS & ARRAYS)
- If a prompt asks for a high number of shapes (e.g., '16 circles', '12 lines', '4x4 grid'), you MUST BRUTE-FORCE the code.
- You MUST physically write out 16 separate variable blocks (e.g., let op1; let op2; ... let op16;).
- You MUST physically write out 16 separate <div /> elements in the return statement.
- ABSOLUTELY NO LOOPS ('for', 'while'). ABSOLUTELY NO ARRAYS ('.map', 'Array.from'). 
- Do NOT try to 'optimize' repetitive code. I want the raw, unrolled, repetitive code.
- Carefully check your JSX syntax when writing many elements. Ensure every <div /> is properly closed and every { has a matching }. Do not leave dangling or unexpected brackets.
COORDINATION, ORBITS & TRANSFORMATIONS
- ORBITS: If multiple shapes rotate around a common center or orbit as a formation, do NOT calculate complex Math.sin/Math.cos paths for every shape.
  - INSTEAD, group them inside a transparent parent wrapper div that is centered:
    <div style={{ position: "absolute", left: "50%", top: "50%", width: "0px", height: "0px", transform: "translate(-50%, -50%) rotate(" + groupRot + "deg)" }}>
      {/* Position children relative to this 0x0 center anchor with static translateX to push them to the orbit radius */}
    </div>
- Z-INDEX & OVERLAPS: When layers slide over each other, weave, or stack, apply explicit zIndex integers. If a shape must weave "over and under", dynamically update its zIndex based on the frame.
- BLEND MODES: When the prompt specifies overlapping areas changing color or blending, use CSS mixBlendMode (e.g., mixBlendMode: "screen", mixBlendMode: "multiply").

COMPONENT STRUCTURE (MUST FOLLOW EXACTLY)

const frame = useCurrentFrame();

// Phase timing definitions
const phase1Start = 0;
const phase1End = 60;
// ...

// Shape 1 logic
let shape1X;
if (frame < phase1End) {
  shape1X = interpolate(frame, [phase1Start, phase1End], [startVal, endVal], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  shape1X = endVal;
}

// Shape 2 logic...

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    {/* Explicit absolute divs for each shape so they share a unified center origin */}
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", backgroundColor: "red",
      transform: "translate(-50%, -50%) translateX(" + shape1X + "px)"
    }} />
    {/* Additional shapes... */}
  </AbsoluteFill>
);

OUTPUT FORMAT
- Output ONLY the valid component body code.
- Do NOT include comments, markdown, explanations, or backticks.
- Do NOT include the wrapping function component definition or import/export statements.
- Ensure pixel-perfect alignment, correct z-indexes, and strictly mathematical frame timings for all coordinated shape motions.`,
      },
      { role: "user", content: promptText },
    ],
  });
  return response.choices[0].message.content;
}

async function run() {
  for (const item of prompts) {
    const codePath = `outputs/code_${item.id}.tsx`;
    const videoPath = `outputs/video_${item.id}.mp4`;

    // Skip if video already exists
    if (fs.existsSync(videoPath)) {
      console.log(`Skipping ${item.id} (already rendered)`);
      continue;
    }

    console.log(`Processing ${item.id}: ${item.prompt}`);

    // Parse duration from prompt
    const durationInFrames = parseDuration(item.prompt);
    console.log(`Prompt ${item.id}: ${durationInFrames} frames (${durationInFrames / 30}s)`);

    let jsxContent = await generateCode(item.prompt);

    // Validation checks (same as before)
    for (let attempt = 0; attempt < 2; attempt++) {
      if (
        jsxContent.includes("${") ||
        jsxContent.includes("`") ||
        jsxContent.match(/interpolate\s*\([^)]*\[[^]]*,[^]]*,[^]]*/)
      ) {
        console.log("Retrying due to invalid generation...");
        jsxContent = await generateCode(item.prompt);
      } else {
        break;
      }
    }

    // Additional checks...
    if (jsxContent.match(/const\s+\w+\s*=\s*[^;]+;\s*[\s\S]*\1\s*=/)) {
      console.log(`❌ Possible const reassignment in prompt ${item.id}`);
      continue;
    }
    if (jsxContent.match(/interpolate\s*\([^)]*\[[^]]*,[^]]*\],\s*\[[^]]*,[^]]*,[^]]*\]/)) {
      console.log(`❌ RGB array interpolation detected in prompt ${item.id}`);
      continue;
    }
    if (jsxContent.includes("for (") || jsxContent.includes("for(")) {
      console.log(`❌ Loop detected in prompt ${item.id}`);
      continue;
    }

    // Generate dynamic root.tsx with correct duration
    const fullComponent = `
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
${jsxContent}
};
`;

    fs.writeFileSync("src/GeneratedMotion.tsx", fullComponent);
    fs.writeFileSync(codePath, fullComponent);

    // Generate dynamic root.tsx with correct duration
    // ✅ FIXED
const rootComponent = `
import { Composition } from "remotion";
import { GeneratedMotion } from "./GeneratedMotion";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GeneratedMotion"
        component={GeneratedMotion}
        durationInFrames={${durationInFrames}}
        fps={30}
        width={720}
        height={720}
      />
    </>
  );
};
`;

    fs.writeFileSync("src/root.tsx", rootComponent);

    console.log("Rendering...");

    execSync(
      `npx remotion render src/index.ts GeneratedMotion ${videoPath}`,
      { stdio: "inherit" }
    );

    await csvWriter.writeRecords([
      {
        id: item.id,
        category: item.category,
        prompt: item.prompt,
        videoLink: `=HYPERLINK("${videoPath}", "View Video")`,
        codeLink: `=HYPERLINK("${codePath}", "View Code")`,
        visualClarity: "",
        motionSmoothness: "",
        promptFaithfulness: "",
        codeCleanliness: "",
        reusability: "",
        notes: "",
      },
    ]);

    console.log(`✅ Finished ${item.id} (${durationInFrames} frames)`);
  }
}

run();
