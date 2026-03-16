// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED RULES — Conditionally included based on spec content.
// Each export is a separate rule block loaded only when needed.
// ─────────────────────────────────────────────────────────────────────────────

const ORBIT_RULES = `ORBIT ANIMATION RULES
When the spec contains "orbit" in a timeline entry:
orbit: { center: [cx, cy], radius: radiusPx, degrees: totalDeg }

Use trigonometry to calculate the position at each frame:
const angle = interpolate(frame, [startFrame, endFrame], [startAngleDeg, startAngleDeg + totalDeg], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians = angle * Math.PI / 180;
const orbX = cx + radius * Math.cos(radians);
const orbY = cy + radius * Math.sin(radians);

For shared-orbit animations with multiple objects, use a parent wrapper div centered at the orbit center and apply rotation to the parent. Position child shapes relative to the center at their radius offset.`;

const GLOW_SHADOW_RULES = `GLOW & SHADOW ANIMATION RULES
To create a glow effect, use the "boxShadow" CSS property.
Build the string using strict concatenation:
boxShadow: "0px 0px " + blur + "px " + spread + "px " + color

When animating glow or shadow, interpolate the numeric values (blur, spread, offsets) and concatenate the result.

Shadow format: boxShadow: offsetX + "px " + offsetY + "px " + blur + "px " + spread + "px " + color`;

const COLOR_RULES = `COLOR ANIMATION RULES
You must not interpolate hex color strings directly.
To animate colors, parse the hex to RGB, interpolate each channel separately:
const r = interpolate(frame, [start, end], [fromR, toR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const g = interpolate(frame, [start, end], [fromG, toG], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const b = interpolate(frame, [start, end], [fromB, toB], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const animColor = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

If the spec specifies "blendMode", apply it as: mixBlendMode: "screen"`;

const LINE_DRAW_RULES = `LINE ANIMATION & STROKE DRAW RULES
When animating the "width" of a line (drawing effect):
NEVER use "translate(-50%, -50%)" because the percentage recalculates as width grows.
Use fixed pixel translations based on the FINAL max width:
- Calculate half = finalWidth / 2
- Set transform: "translateX(-" + half + "px) translateY(-50%)"
- Animate width from 0 to finalWidth

POLYGON STROKE DRAW (for clip-pathed shapes like triangles, pentagons, stars):
You CANNOT use CSS borders on clip-pathed shapes.
Use the "Conic Gradient Mask" technique with two stacked divs:
1. Outer div with the shape color and clip-path
2. Inner div slightly smaller, centered, with background color matching the scene background

DASHED LINES:
Use repeating-linear-gradient instead of border-style: dashed.
Build the gradient string using concatenation.`;

const BOUNCE_PHYSICS_RULES = `BOUNCE & PHYSICS ANIMATION RULES
When the spec contains "bounce" in a timeline entry:
bounce: { floor: yPx, heights: [h1, h2, ...] }

Implement as chained interpolations:
1. Drop from initial Y to floor with ease-in
2. Rise from floor to (floor - h1) with ease-out
3. Drop back to floor with ease-in
4. Rise to (floor - h2) with ease-out
... continue for each bounce height

Calculate frame ranges proportionally within the total animation time.
Each successive bounce should be shorter in duration.`;

const BAR_CHART_RULES = `BAR CHART & TRANSFORM ORIGIN RULES
When a shape needs to grow from a specific anchor (like a bar growing upward):
Do NOT use the standard centering transform.
Instead anchor to the specified edge:
left: "50%",
bottom: "20%",
transformOrigin: "bottom center",
transform: "translateX(-50%) scaleY(" + scaleY + ")"

TEXT COUNTERS:
If displaying an animated number (e.g., percentage counter), use:
{Math.round(interpolatedValue) + "%"}`;

const PARENT_CHILD_RULES = "PARENT-CHILD TRANSFORM RULES\n" +
"When any object has a \"parent\" field, that object's position is in the parent's LOCAL coordinate space.\n\n" +
"SPEC FIELDS:\n" +
"  object.parent: \"parent_id\" — makes this object a child of the named parent\n" +
"  object.offset: [x, y] — position relative to parent's center (do NOT use object.pos for children)\n\n" +
"IMPLEMENTATION — wrapper div structure:\n\n" +
"Parent wrapper: positioned on the canvas, carries parent's animated transforms.\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  transform: \"translate(-50%, -50%) translateX(\" + parentX + \"px) translateY(\" + parentY + \"px) rotate(\" + parentRot + \"deg) scale(\" + parentScale + \")\"\n\n" +
"Child div: rendered INSIDE the parent wrapper div.\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  transform: \"translate(-50%, -50%) translateX(\" + offsetX + \"px) translateY(\" + offsetY + \"px)\"\n\n" +
"RULES:\n" +
"  - Parent's (0,0) is its own center. Children use offset, not canvas pos.\n" +
"  - If child has animated x/y in the timeline, ADD those to the offset translation.\n" +
"  - Child opacity, scale, rotation are independent and applied on the child div only.\n" +
"  - fixed objects are never nested inside a parent wrapper — see FIXED POSITION RULES.";

const ANCHOR_RULES = "ANCHOR & TRANSFORM ORIGIN RULES\n" +
"When any object or timeline entry has an \"anchor\" field, use it to set CSS transform-origin.\n\n" +
"ANCHOR VALUES -> CSS transform-origin:\n" +
"  \"top-left\"      -> \"0% 0%\"\n" +
"  \"top-center\"    -> \"50% 0%\"\n" +
"  \"top-right\"     -> \"100% 0%\"\n" +
"  \"left-center\"   -> \"0% 50%\"\n" +
"  \"center\"        -> \"50% 50%\"  (default — same as no anchor)\n" +
"  \"right-center\"  -> \"100% 50%\"\n" +
"  \"bottom-left\"   -> \"0% 100%\"\n" +
"  \"bottom-center\" -> \"50% 100%\"\n" +
"  \"bottom-right\"  -> \"100% 100%\"\n\n" +
"IMPLEMENTATION:\n" +
"Add transformOrigin to the shape div's style. Keep the centering trick unchanged:\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  transformOrigin: \"50% 100%\",\n" +
"  transform: \"translate(-50%, -50%) translateX(\" + posX + \"px) translateY(\" + posY + \"px) scaleY(\" + sy + \")\"\n\n" +
"A timeline entry anchor overrides the object-level anchor only within that entry's time range.\n\n" +
"CRITICAL: transformOrigin shifts the pivot WITHIN the element's own bounding box. translate(-50%, -50%) still positions the element correctly on canvas.";

const PIVOT_RULES = "PIVOT POINT ROTATION RULES\n" +
"When a timeline entry has \"pivot\": [canvasX, canvasY], rotation happens around that canvas point, NOT the object's center.\n\n" +
"TECHNIQUE — wrapper div at the pivot point:\n\n" +
"Step 1: wrapper div positioned at the pivot on the canvas.\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  width: \"0px\", height: \"0px\",\n" +
"  transform: \"translateX(\" + pivotX + \"px) translateY(\" + pivotY + \"px) rotate(\" + rot + \"deg)\"\n\n" +
"Step 2: child shape div inside the wrapper, offset from pivot to object's original position.\n" +
"  position: \"absolute\",\n" +
"  left: (objPosX - pivotX) + \"px\",\n" +
"  top: (objPosY - pivotY) + \"px\",\n" +
"  transform: \"translate(-50%, -50%)\"\n\n" +
"EXAMPLE — circle at pos [200, 0] orbiting canvas origin [0, 0]:\n" +
"  const rot = interpolate(frame, [0, 120], [0, 360], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  // wrapper: left:\"50%\", top:\"50%\", w:\"0px\", h:\"0px\", transform: \"translateX(0px) translateY(0px) rotate(\" + rot + \"deg)\"\n" +
"  // child: position:\"absolute\", left:\"200px\", top:\"0px\", transform:\"translate(-50%,-50%)\"\n\n" +
"CRITICAL: The wrapper div has zero width/height. Only the rotation transform is on the wrapper. The child carries all visual dimensions.";

const FIXED_RULES = "FIXED POSITION RULES\n" +
"When an object has \"fixed\": true, it is pinned to absolute canvas coordinates and NOT affected by parent transforms.\n\n" +
"IMPLEMENTATION — absolute pixel positioning from canvas top-left:\n" +
"  Read canvas from spec: halfW = canvas.w / 2, halfH = canvas.h / 2.\n" +
"  position: \"absolute\",\n" +
"  left: (halfW + posX) + \"px\",\n" +
"  top: (halfH + posY) + \"px\",\n" +
"  transform: \"translate(-50%, -50%)\"\n\n" +
"For 1920x1080: halfW=960, halfH=540. For 1080x1920: halfW=540, halfH=960.\n" +
"This converts center-relative spec coords to top-left-relative pixel positions.\n\n" +
"RULES:\n" +
"  - Fixed objects must be direct children of the AbsoluteFill root, NEVER nested in a parent wrapper.\n" +
"  - If the spec also sets a parent on the fixed object, ignore the nesting for layout.\n" +
"  - If the fixed object has timeline x/y entries, add the interpolated delta: left: (halfW + posX + animDeltaX) + \"px\"";

const TRAIL_RULES = "TRAIL / FOLLOW DELAY RULES\n" +
"When a timeline entry has \"trail\": { \"follows\": \"target_id\", \"delay\": seconds }, this object replicates the followed object's motion but lags behind by the delay.\n\n" +
"IMPLEMENTATION — delayed frame calculation:\n\n" +
"Step 1: Convert delay to frames.\n" +
"  const trailDelayFrames = delay * 30;\n\n" +
"Step 2: Compute the trail frame, clamped to 0.\n" +
"  const trailFrame = Math.max(0, frame - trailDelayFrames);\n\n" +
"Step 3: For EACH position interpolation that drives the followed object, create an identical interpolation using trailFrame instead of frame.\n\n" +
"Leading object:\n" +
"  const leadX = interpolate(frame, [startFrame, endFrame], [fromX, toX], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"Trailing object (same math, trailFrame input):\n" +
"  const trailX = interpolate(trailFrame, [startFrame, endFrame], [fromX, toX], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
"MULTI-SEGMENT PATHS: Replicate ALL segment interpolations with trailFrame.\n\n" +
"CRITICAL: Only position properties are delayed. The trailing object's own opacity, scale, and color are still animated using the current frame unless the spec says otherwise.";

const TYPEWRITER_RULES = "TYPEWRITER TEXT ANIMATION RULES\n" +
"When a timeline entry has \"chars\": [fromCount, toCount]:\n\n" +
"Interpolate the visible character count and slice the text string:\n" +
"  const charsVisible = interpolate(frame, [startFrame, endFrame], [fromCount, toCount], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const visibleText = fullText.slice(0, Math.round(charsVisible));\n\n" +
"Render: <div ...>{visibleText}</div>\n\n" +
"BLINKING CURSOR:\n" +
"If the object has \"cursor\": true, toggle a \"|\" every 15 frames:\n" +
"  const showCursor = Math.floor(frame / 15) % 2 === 0;\n" +
"  const displayText = visibleText + (showCursor ? \"|\" : \"\");\n\n" +
"WORD-BY-WORD REVEAL — use when the spec uses \"words\" instead of \"chars\":\n" +
"  const words = fullText.split(\" \");\n" +
"  const wordsVisible = Math.round(interpolate(frame, [sf, ef], [0, words.length], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" }));\n" +
"  const visibleText = words.slice(0, wordsVisible).join(\" \");\n\n" +
"NEVER: animate text with per-character opacity or separate divs per character.\n" +
"ALWAYS: one div, one slice, one interpolated count.\n\n" +
"IMPORTANT TYPEWRITER SETUP:\n" +
"- The text object MUST have opacity: 1 (or no opacity field) from the start of the chars animation.\n" +
"  The chars animation itself creates the reveal effect — slice(0, 0) shows nothing, slice(0, N) shows all.\n" +
"- Do NOT fade in opacity (0 to 1) at the SAME TIME as the chars animation. This makes text invisible during typing.\n" +
"- If you need a fade-in before typewriting, complete the opacity animation FIRST, THEN start chars.\n" +
"  Example: opacity [0, 1] at time [0, 0.5], then chars [0, 15] at time [0.5, 3].\n" +
"- If the spec has no separate fade-in phase, just start chars immediately with the object at full opacity.\n\n" +
"CURSOR STYLING:\n" +
"- The cursor \"|\" is part of the text string, not a separate div or object.\n" +
"- Do NOT create a separate rectangle or div for the cursor.\n" +
"- The cursor naturally appears at the end of the visible text as characters are revealed.\n\n" +
"CRITICAL ANTI-PATTERN — opacity: 0 + chars animation:\n" +
"If the spec has a chars animation on a text object, that object MUST have opacity: 1\n" +
"from the start of the chars animation. Do NOT generate an opacity fade-in that overlaps\n" +
"with the chars time range. The typewriter effect (slice from 0 to N characters) IS the reveal.\n" +
"If the text object starts at opacity: 0, the opacity animation MUST complete BEFORE chars begins.\n" +
"CHECK: opacity end time <= chars start time. If they overlap, set opacity to 1 at the chars start frame.";

const TEXT_COLOR_ANIM_RULES = "TEXT COLOR ANIMATION RULES\n" +
"When a timeline entry has \"textColor\": [fromHex, toHex] for a text object:\n\n" +
"Use RGB channel decomposition — identical to COLOR_RULES but assign to CSS \"color\" not \"backgroundColor\":\n\n" +
"  const r = interpolate(frame, [start, end], [fromR, toR], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const g = interpolate(frame, [start, end], [fromG, toG], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const b = interpolate(frame, [start, end], [fromB, toB], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const animTextColor = \"rgb(\" + Math.round(r) + \",\" + Math.round(g) + \",\" + Math.round(b) + \")\";\n\n" +
"Apply as: color: animTextColor\n\n" +
"NEVER apply this to backgroundColor — text objects use \"color\" for their fill, not \"backgroundColor\".\n\n" +
"For animated fontSize and letterSpacing on text objects, use standard interpolation and apply as:\n" +
"  fontSize: animFontSize + \"px\"\n" +
"  letterSpacing: animLetterSpacing + \"px\"";

const BLUR_RULES = "BLUR ANIMATION RULES\n" +
  "When the spec contains \"blur\" in a timeline entry:\n" +
  "blur: [fromPx, toPx] — animates CSS filter blur.\n\n" +
  "IMPLEMENTATION:\n" +
  "  const blurVal = interpolate(frame, [startFrame, endFrame], [fromPx, toPx], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  Apply as: filter: \"blur(\" + blurVal + \"px)\"\n\n" +
  "COMBINING WITH OTHER FILTERS:\n" +
  "  If the element also has brightness or other filters, concatenate:\n" +
  "  filter: \"blur(\" + blurVal + \"px) brightness(\" + brightness + \")\"\n\n" +
  "COMMON PATTERNS:\n" +
  "  Focus-in: blur [10, 0] — shape starts blurry and sharpens.\n" +
  "  Defocus: blur [0, 8] — shape goes out of focus.\n" +
  "  Glow pulse: blur [0, 4] then [4, 0] — creates a soft glow effect.\n\n" +
  "CRITICAL: blur value must be non-negative. Use 0 for fully sharp.";

const STROKE_DASH_RULES = "STROKE DASH / PATH TRACING RULES\n" +
  "When the spec contains \"strokeDash\" in a timeline entry:\n" +
  "strokeDash: [from%, to%] — draws a shape's outline from invisible to fully visible.\n\n" +
  "IMPLEMENTATION — using conic-gradient mask:\n" +
  "For circle outlines, use a conic-gradient mask approach:\n" +
  "  const dashProgress = interpolate(frame, [startFrame, endFrame], [fromPct, toPct], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  const degrees = dashProgress * 3.6;\n\n" +
  "  Render as a div with:\n" +
  "  borderRadius: \"50%\",\n" +
  "  background: \"transparent\",\n" +
  "  border: strokeWidth + \"px solid \" + strokeColor,\n" +
  "  maskImage: \"conic-gradient(from -90deg, black \" + degrees + \"deg, transparent \" + degrees + \"deg)\",\n" +
  "  WebkitMaskImage: \"conic-gradient(from -90deg, black \" + degrees + \"deg, transparent \" + degrees + \"deg)\"\n\n" +
  "For line path tracing (non-circular):\n" +
  "  Animate the width of a thin line div from 0 to target width (use existing LINE_DRAW technique).\n\n" +
  "MARCHING DASHES:\n" +
  "  If the prompt describes \"marching\" or rotating dashes, rotate the mask:\n" +
  "  const marchAngle = interpolate(frame, [sf, ef], [0, 360], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  maskImage: \"conic-gradient(from \" + (marchAngle - 90) + \"deg, ...)\"\n\n" +
  "CRITICAL: Always include both maskImage and WebkitMaskImage for browser compatibility.";

const GRADIENT_SHIFT_RULES = "GRADIENT SHIFT ANIMATION RULES\n" +
  "When the spec contains \"gradientAngle\" in a timeline entry:\n" +
  "gradientAngle: [fromDeg, toDeg] — rotates a linear-gradient's direction.\n\n" +
  "IMPLEMENTATION:\n" +
  "  const angle = interpolate(frame, [startFrame, endFrame], [fromDeg, toDeg], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  background: \"linear-gradient(\" + angle + \"deg, \" + color1 + \", \" + color2 + \")\"\n\n" +
  "GRADIENT OBJECT FORMAT:\n" +
  "  If the object's \"color\" field is a gradient object:\n" +
  "  { \"type\": \"gradient\", \"from\": \"#hex1\", \"to\": \"#hex2\", \"angle\": 0 }\n" +
  "  Use the gradient colors for the animated background.\n\n" +
  "RADIAL GRADIENT SHIFT:\n" +
  "  If gradientAngle is used with a radial gradient, shift the center position instead:\n" +
  "  background: \"radial-gradient(circle at \" + x + \"% \" + y + \"%, \" + color1 + \", \" + color2 + \")\"\n\n" +
  "CRITICAL: Build all gradient strings with + concatenation. NEVER use template literals.";

const PERSPECTIVE_TILT_RULES = "PERSPECTIVE TILT RULES (3D TRANSFORMS)\n" +
  "When the spec contains \"rotateX\" or \"rotateY\" in a timeline entry:\n\n" +
  "OBJECT SETUP:\n" +
  "  The object MUST have \"perspective\": number (in px, typically 600-1200).\n" +
  "  Apply CSS perspective on the parent wrapper, NOT on the element itself:\n" +
  "  perspective: perspectiveValue + \"px\"\n\n" +
  "IMPLEMENTATION:\n" +
  "  const rx = interpolate(frame, [sf, ef], [fromRX, toRX], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  const ry = interpolate(frame, [sf, ef], [fromRY, toRY], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
  "  Parent wrapper style:\n" +
  "  perspective: \"800px\",\n" +
  "  position: \"absolute\", left: \"50%\", top: \"50%\"\n\n" +
  "  Element style (inside wrapper):\n" +
  "  transform: \"translate(-50%, -50%) translateX(\" + x + \"px) translateY(\" + y + " +
  "\"px) rotateX(\" + rx + \"deg) rotateY(\" + ry + \"deg)\"\n\n" +
  "COMMON PATTERNS:\n" +
  "  Card flip: rotateY [0, 180] — horizontal flip.\n" +
  "  Tilt forward: rotateX [0, 30] — leans toward viewer.\n" +
  "  Door swing: rotateY [0, 90] with anchor \"left-center\" — opens like a door.\n\n" +
  "COMBINING WITH OTHER TRANSFORMS:\n" +
  "  rotateX and rotateY go AFTER translate and BEFORE scale in the transform string.\n\n" +
  "CRITICAL: perspective must be on the PARENT div, not the rotating element itself. " +
  "Without perspective, rotateX/rotateY produce flat skewing instead of 3D depth.";

const MORPH_RULES = "SHAPE MORPH RULES\n" +
  "When the spec contains \"morphTo\" in a timeline entry:\n" +
  "morphTo: { \"shape\": \"circle\"|\"rectangle\"|..., \"size\": [w, h] }\n\n" +
  "IMPLEMENTATION — interpolate clip-path + dimensions:\n\n" +
  "RECTANGLE TO CIRCLE:\n" +
  "  Interpolate borderRadius from 0 to 50%:\n" +
  "  const morphRadius = interpolate(frame, [sf, ef], [0, 50], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  borderRadius: morphRadius + \"%\"\n" +
  "  Simultaneously interpolate width/height to target size.\n\n" +
  "POLYGON MORPHS (triangle, pentagon, star):\n" +
  "  Interpolate each clip-path vertex coordinate individually.\n" +
  "  Both source and target clip-paths MUST have the SAME number of vertices.\n" +
  "  If vertex counts differ, add intermediate points on the simpler shape.\n\n" +
  "  Pentagon (5 vertices) to Star (10 vertices):\n" +
  "  Double the pentagon's vertices by adding midpoints on each edge,\n" +
  "  then interpolate each of the 10 points to the star's 10 points.\n\n" +
  "  const x1 = interpolate(frame, [sf, ef], [fromX1, toX1], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  const y1 = interpolate(frame, [sf, ef], [fromY1, toY1], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  // ... repeat for each vertex\n" +
  "  clipPath: \"polygon(\" + x1 + \"% \" + y1 + \"%, \" + x2 + \"% \" + y2 + \"%, ...)\"\n\n" +
  "SIZE TRANSITION:\n" +
  "  If morphTo includes \"size\", interpolate width and height simultaneously:\n" +
  "  const morphW = interpolate(frame, [sf, ef], [origW, targetW], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  const morphH = interpolate(frame, [sf, ef], [origH, targetH], " +
  "{ extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
  "CRITICAL: Both source and target shapes must have equal vertex counts for smooth morphing. " +
  "Pre-compute all vertex positions as explicit numbers — never use loops.";

// ─────────────────────────────────────────────────────────────────────────────
// Detect which advanced rules are needed based on spec content
// ─────────────────────────────────────────────────────────────────────────────
function getAdvancedRules(specData) {
  const rules = [];
  const specStr = JSON.stringify(specData);

  // Check timeline for advanced animation types
  if (specStr.includes('"orbit"')) {
    rules.push(ORBIT_RULES);
  }

  if (specStr.includes('"glow"') || specStr.includes('"shadow"')) {
    rules.push(GLOW_SHADOW_RULES);
  }

  if (specStr.includes('"color"') && Array.isArray(specData.timeline)) {
    const hasColorAnim = specData.timeline.some(t => t.color && Array.isArray(t.color));
    if (hasColorAnim) {
      rules.push(COLOR_RULES);
    }
  }

  if (specStr.includes('"line"') || specStr.includes('"strokeWidth"') || specStr.includes('"width"')) {
    rules.push(LINE_DRAW_RULES);
  }

  if (specStr.includes('"bounce"')) {
    rules.push(BOUNCE_PHYSICS_RULES);
  }

  if (specStr.includes('"height"') || specStr.includes('"scaleY"')) {
    rules.push(BAR_CHART_RULES);
  }

  if (specStr.includes('"parent"')) {
    rules.push(PARENT_CHILD_RULES);
  }

  if (specStr.includes('"anchor"')) {
    rules.push(ANCHOR_RULES);
  }

  if (specStr.includes('"pivot"')) {
    rules.push(PIVOT_RULES);
  }

  if (specStr.includes('"fixed"')) {
    rules.push(FIXED_RULES);
  }

  if (specStr.includes('"trail"')) {
    rules.push(TRAIL_RULES);
  }

  if (specStr.includes('"chars"') || specStr.includes('"words"')) {
    rules.push(TYPEWRITER_RULES);
  }

  if (specStr.includes('"textColor"')) {
    rules.push(TEXT_COLOR_ANIM_RULES);
  }

  if (specStr.includes('"blur"')) {
    rules.push(BLUR_RULES);
  }

  if (specStr.includes('"strokeDash"')) {
    rules.push(STROKE_DASH_RULES);
  }

  if (specStr.includes('"gradientAngle"')) {
    rules.push(GRADIENT_SHIFT_RULES);
  }

  if (specStr.includes('"rotateX"') || specStr.includes('"rotateY"')) {
    rules.push(PERSPECTIVE_TILT_RULES);
  }

  if (specStr.includes('"morphTo"')) {
    rules.push(MORPH_RULES);
  }

  return rules;
}

module.exports = { getAdvancedRules };
