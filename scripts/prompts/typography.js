// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY RULES — Conditionally included when spec contains text objects.
// Teaches the code-generation LLM named kinetic typography patterns
// composed from existing spec primitives (scale, opacity, blur, width, etc.).
// ─────────────────────────────────────────────────────────────────────────────

const SCALE_POP_RULES = "SCALE POP EFFECT RULES\n" +
"When a text (or shape) has two consecutive scale timeline entries that overshoot then settle,\n" +
"this is a 'scale pop' or 'pop in' effect.\n\n" +
"SPEC PATTERN — two entries on the same target:\n" +
"  { target: id, time: [t0, t1], scale: [0, 1.15], easing: \"ease-out\" }\n" +
"  { target: id, time: [t1, t2], scale: [1.15, 1], easing: \"ease-in\" }\n\n" +
"CODE IMPLEMENTATION:\n" +
"  const scalePhase1 = interpolate(frame, [sf1, ef1], [0, 1.15], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const scalePhase2 = interpolate(frame, [sf2, ef2], [1.15, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const popScale = frame < ef1 ? scalePhase1 : scalePhase2;\n\n" +
"Apply popScale in the transform: \"translate(-50%, -50%) translateX(\" + posX + \"px) translateY(\" + posY + \"px) scale(\" + popScale + \")\"\n\n" +
"IMPORTANT:\n" +
"- The two scale phases MUST be sequential (phase 2 starts exactly when phase 1 ends).\n" +
"- The overshoot value is typically 1.1 to 1.2 (1.15 is a good default).\n" +
"- Use ease-out for the first phase (fast start) and ease-in for the settle phase.\n" +
"- If the object also has opacity: [0, 1], apply it during the FIRST phase only.";

const BLUR_REVEAL_RULES = "BLUR REVEAL EFFECT RULES\n" +
"When a text (or shape) has simultaneous blur, opacity, and optionally scale timeline entries\n" +
"in the same time range, with blur going from high to 0, this is a 'blur reveal' or 'focus in' effect.\n\n" +
"SPEC PATTERN — overlapping entries on the same target:\n" +
"  { target: id, time: [t0, t1], blur: [12, 0] }\n" +
"  { target: id, time: [t0, t1], opacity: [0, 1] }\n" +
"  { target: id, time: [t0, t1], scale: [0.8, 1] }   // optional\n\n" +
"CODE IMPLEMENTATION:\n" +
"  const blurVal = interpolate(frame, [sf, ef], [12, 0], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const opacityVal = interpolate(frame, [sf, ef], [0, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const scaleVal = interpolate(frame, [sf, ef], [0.8, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
"Apply on the SAME div:\n" +
"  style={{ ..., opacity: opacityVal, filter: \"blur(\" + blurVal + \"px)\", transform: \"... scale(\" + scaleVal + \")\" }}\n\n" +
"IMPORTANT:\n" +
"- All three properties must use the SAME time range for a cohesive reveal.\n" +
"- Default blur start value: 12px (range 8-20px depending on effect intensity).\n" +
"- Build the filter string with concatenation: \"blur(\" + blurVal + \"px)\"";

const SLIDE_UP_RULES = "SLIDE UP EFFECT RULES\n" +
"When a text (or shape) animates y from a positive offset toward 0 while fading in,\n" +
"this is a 'slide up' or 'rise up' effect.\n\n" +
"SPEC PATTERN — two overlapping entries:\n" +
"  { target: id, time: [t0, t1], y: [pos + 40, pos], easing: \"ease-out\" }\n" +
"  { target: id, time: [t0, t1], opacity: [0, 1], easing: \"ease-out\" }\n\n" +
"The y values are RELATIVE to the object's spec pos. If pos is [0, -60], the y animation\n" +
"goes from -20 (which is -60 + 40) to -60 (the final position).\n\n" +
"CODE IMPLEMENTATION:\n" +
"  const slideY = interpolate(frame, [sf, ef], [posY + 40, posY], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const slideOpacity = interpolate(frame, [sf, ef], [0, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
"Apply slideY in translateY and slideOpacity as opacity on the same div.\n\n" +
"VARIANTS:\n" +
"- Slide down: y goes from pos - 40 to pos (object drops into place)\n" +
"- Slide left: x goes from pos + 60 to pos (enters from right)\n" +
"- Slide right: x goes from pos - 60 to pos (enters from left)\n" +
"- The offset distance (40px) can vary; 30-60px is typical.";

const UNDERLINE_DRAW_RULES = "UNDERLINE DRAW EFFECT RULES\n" +
"An animated underline beneath text is implemented as a SEPARATE child rectangle object\n" +
"with the text as its parent.\n\n" +
"SPEC PATTERN:\n" +
"  objects: [\n" +
"    { id: \"heading\", shape: \"text\", text: \"Hello World\", fontSize: 64, color: \"#FFFFFF\", pos: [0, 0] },\n" +
"    { id: \"heading_underline\", shape: \"rectangle\", size: [estimatedWidth, 4], color: \"#E53935\",\n" +
"      parent: \"heading\", offset: [0, 40], anchor: \"left-center\", opacity: 0 }\n" +
"  ]\n" +
"  timeline: [\n" +
"    { target: \"heading_underline\", time: [t0, t0 + 0.3], opacity: [0, 1] },\n" +
"    { target: \"heading_underline\", time: [t0, t1], width: [0, estimatedWidth], easing: \"ease-out\" }\n" +
"  ]\n\n" +
"TEXT WIDTH ESTIMATION: estimatedWidth = fontSize * 0.6 * text.length\n" +
"UNDERLINE OFFSET: offset y = Math.round(fontSize / 2) + 8 (positions below text baseline)\n\n" +
"CODE IMPLEMENTATION:\n" +
"  The underline rectangle is a child div inside the text's wrapper div (parent-child nesting).\n" +
"  Animate the width using interpolate:\n" +
"  const underlineW = interpolate(frame, [sf, ef], [0, targetWidth], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
"  The underline div style:\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  transform: \"translate(-50%, -50%) translateX(\" + offsetX + \"px) translateY(\" + offsetY + \"px)\",\n" +
"  width: underlineW + \"px\", height: \"4px\",\n" +
"  backgroundColor: underlineColor,\n" +
"  transformOrigin: \"0% 50%\"\n\n" +
"IMPORTANT:\n" +
"- Use anchor: \"left-center\" (transformOrigin: \"0% 50%\") so the underline grows from left to right.\n" +
"- The underline must be a separate object in the spec, NOT drawn with CSS border-bottom.\n" +
"- Calculate the offset to center the underline: offsetX = -(estimatedWidth / 2) positions it at the text's left edge.";

const HIGHLIGHT_REVEAL_RULES = "HIGHLIGHT REVEAL EFFECT RULES\n" +
"A colored highlight box expanding behind text is implemented as a SEPARATE child rectangle\n" +
"behind the text using zIndex layering.\n\n" +
"SPEC PATTERN:\n" +
"  objects: [\n" +
"    { id: \"heading\", shape: \"text\", text: \"FEATURED\", fontSize: 48, color: \"#FFFFFF\",\n" +
"      pos: [0, 0], zIndex: 2 },\n" +
"    { id: \"heading_highlight\", shape: \"rectangle\",\n" +
"      size: [estimatedWidth + 32, fontSize + 24], color: \"#FDD835\",\n" +
"      parent: \"heading\", offset: [0, 0], zIndex: 1, cornerRadius: 4, scale: 1, scaleX: 0 }\n" +
"  ]\n" +
"  timeline: [\n" +
"    { target: \"heading_highlight\", time: [t0, t1], scaleX: [0, 1], anchor: \"left-center\", easing: \"ease-out\" }\n" +
"  ]\n\n" +
"SIZE CALCULATION:\n" +
"  highlightWidth = fontSize * 0.6 * text.length + 32 (16px padding each side)\n" +
"  highlightHeight = fontSize + 24 (12px padding top and bottom)\n\n" +
"CODE IMPLEMENTATION:\n" +
"  The highlight rectangle is a child div inside the text's parent wrapper.\n" +
"  Animate scaleX from 0 to 1 with transformOrigin: \"0% 50%\" (left-center anchor).\n\n" +
"  const highlightScaleX = interpolate(frame, [sf, ef], [0, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
"  Highlight div style:\n" +
"  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"  transform: \"translate(-50%, -50%) scaleX(\" + highlightScaleX + \")\",\n" +
"  transformOrigin: \"0% 50%\",\n" +
"  width: highlightWidth + \"px\", height: highlightHeight + \"px\",\n" +
"  backgroundColor: highlightColor, borderRadius: \"4px\",\n" +
"  zIndex: 1\n\n" +
"IMPORTANT:\n" +
"- The highlight MUST have a LOWER zIndex than the text so text appears on top.\n" +
"- Use scaleX for the expansion animation, NOT width animation (scaleX is smoother).\n" +
"- The highlight is a child of the same parent as the text (or text is its parent).\n" +
"- Default highlight colors: yellow (#FDD835), light blue (#81D4FA), light green (#A5D6A7).";

const STAGGER_TEXT_RULES = "STAGGER TEXT ANIMATION RULES\n" +
"When multiple text elements appear sequentially (one after another), each gets its own\n" +
"complete set of timeline entries with offset start times.\n\n" +
"SPEC PATTERN — 3 staggered texts with slide-up effect:\n" +
"  objects: [\n" +
"    { id: \"line_1\", shape: \"text\", text: \"Design\", fontSize: 64, color: \"#FFFFFF\", pos: [0, -80], opacity: 0 },\n" +
"    { id: \"line_2\", shape: \"text\", text: \"Create\", fontSize: 64, color: \"#00ACC1\", pos: [0, 0], opacity: 0 },\n" +
"    { id: \"line_3\", shape: \"text\", text: \"Inspire\", fontSize: 64, color: \"#E91E63\", pos: [0, 80], opacity: 0 }\n" +
"  ]\n" +
"  timeline: [\n" +
"    { target: \"line_1\", time: [0.0, 0.5], opacity: [0, 1] },\n" +
"    { target: \"line_1\", time: [0.0, 0.5], y: [-40, -80], easing: \"ease-out\" },\n" +
"    { target: \"line_2\", time: [0.25, 0.75], opacity: [0, 1] },\n" +
"    { target: \"line_2\", time: [0.25, 0.75], y: [40, 0], easing: \"ease-out\" },\n" +
"    { target: \"line_3\", time: [0.5, 1.0], opacity: [0, 1] },\n" +
"    { target: \"line_3\", time: [0.5, 1.0], y: [120, 80], easing: \"ease-out\" }\n" +
"  ]\n\n" +
"CODE IMPLEMENTATION:\n" +
"  Each text object gets its OWN interpolation variables with its own frame ranges.\n" +
"  Do NOT use loops or arrays — declare each variable explicitly:\n\n" +
"  const line1Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const line1Y = interpolate(frame, [0, 15], [-40, -80], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const line2Opacity = interpolate(frame, [7, 22], [0, 1], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  const line2Y = interpolate(frame, [7, 22], [40, 0], { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
"  // ... and so on for each line\n\n" +
"STAGGER TIMING GUIDELINES:\n" +
"- Default stagger delay: 0.2-0.3 seconds between each element.\n" +
"- Each element's animation duration is typically 0.4-0.6 seconds.\n" +
"- The stagger delay ADDS to the start time: line N starts at baseTime + (N-1) * staggerDelay.\n" +
"- All elements use the SAME animation style (all slide-up, all scale-pop, etc.).\n" +
"- NEVER use loops or .map() — write out each element's interpolation explicitly.";

const TEXT_CONTAINER_RULES = "TEXT IN CONTAINER RULES\n" +
"When text appears inside a styled box/container, use the parent-child system.\n" +
"The container is a rectangle, and the text is its child.\n\n" +
"SPEC PATTERN — text inside a gradient-colored rounded box:\n" +
"  objects: [\n" +
"    { id: \"box\", shape: \"rectangle\", size: [400, 100], color: \"#7B1FA2\",\n" +
"      cornerRadius: 12, pos: [0, 0], opacity: 0, scale: 0 },\n" +
"    { id: \"box_text\", shape: \"text\", text: \"NEW FEATURE\", fontSize: 36,\n" +
"      fontWeight: \"bold\", color: \"#FFFFFF\",\n" +
"      parent: \"box\", offset: [0, 0] },\n" +
"    { id: \"subtitle\", shape: \"text\", text: \"Coming Soon\", fontSize: 24,\n" +
"      color: \"#B0BEC5\", pos: [-180, 60], opacity: 0 }\n" +
"  ]\n" +
"  timeline: [\n" +
"    { target: \"box\", time: [0, 0.3], opacity: [0, 1] },\n" +
"    { target: \"box\", time: [0, 0.4], scale: [0, 1.15], easing: \"ease-out\" },\n" +
"    { target: \"box\", time: [0.4, 0.6], scale: [1.15, 1], easing: \"ease-in\" },\n" +
"    { target: \"subtitle\", time: [0.8, 1.3], opacity: [0, 1] },\n" +
"    { target: \"subtitle\", time: [0.8, 1.3], y: [100, 60], easing: \"ease-out\" }\n" +
"  ]\n\n" +
"CODE IMPLEMENTATION:\n" +
"  The container is a parent wrapper div. The text child is nested inside it.\n\n" +
"  // Parent container div\n" +
"  <div style={{ position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"    transform: \"translate(-50%, -50%) translateX(\" + boxX + \"px) translateY(\" + boxY + \"px) scale(\" + boxScale + \")\",\n" +
"    width: \"400px\", height: \"100px\", backgroundColor: \"#7B1FA2\",\n" +
"    borderRadius: \"12px\", opacity: boxOpacity, zIndex: 1 }}>\n" +
"    // Child text div — positioned relative to parent center\n" +
"    <div style={{ position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
"      transform: \"translate(-50%, -50%)\",\n" +
"      fontSize: \"36px\", fontWeight: \"bold\", color: \"#FFFFFF\",\n" +
"      whiteSpace: \"nowrap\" }}>\n" +
"      NEW FEATURE\n" +
"    </div>\n" +
"  </div>\n\n" +
"CONTAINER SIZING GUIDELINES:\n" +
"- Container width: fontSize * 0.6 * text.length + 64 (32px padding each side)\n" +
"- Container height: fontSize + 48 (24px padding top and bottom)\n" +
"- cornerRadius: 8-16px for rounded look\n" +
"- Child text uses offset: [0, 0] to center inside the container.\n\n" +
"MULTIPLE CHILDREN:\n" +
"- A container can have multiple text children at different offsets.\n" +
"- Example: heading at offset [0, -20] and subtitle at offset [0, 20].\n" +
"- Each child animates independently within the container's local coordinate space.\n\n" +
"IMPORTANT:\n" +
"- When the container scales or moves, ALL children move and scale with it.\n" +
"- Children's own animations (opacity, chars, etc.) are applied on top of the parent transform.\n" +
"- The parent-child wrapper pattern is already defined in the PARENT-CHILD rules — follow that nesting structure exactly.";

// ─────────────────────────────────────────────────────────────────────────────
// Detection function — returns array of rule strings based on spec content
// ─────────────────────────────────────────────────────────────────────────────

function getTypographyRules(specData) {
  var rules = [];
  var specStr = JSON.stringify(specData);
  var hasText = specData.objects && specData.objects.some(function(o) { return o.shape === "text"; });

  if (!hasText) return rules;

  // Always load core typography patterns when text objects exist
  rules.push(SCALE_POP_RULES);
  rules.push(SLIDE_UP_RULES);
  rules.push(BLUR_REVEAL_RULES);
  rules.push(STAGGER_TEXT_RULES);
  rules.push(TEXT_CONTAINER_RULES);

  // Load decoration rules when parent-child or decoration patterns detected
  if (specStr.includes('"parent"') || specStr.includes('"underline"') || specStr.includes('"highlight"') || specStr.includes('"width"')) {
    rules.push(UNDERLINE_DRAW_RULES);
    rules.push(HIGHLIGHT_REVEAL_RULES);
  }

  return rules;
}

module.exports = { getTypographyRules };
