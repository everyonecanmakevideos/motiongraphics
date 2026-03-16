// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT RULES — Always included. Covers safe zones, alignment, text spacing.
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_RULES = `LAYOUT AND SAFE ZONE RULES

CANVAS-AWARE DIMENSIONS:
Read the spec "canvas" field: { "w": W, "h": H }.
Compute: halfW = W / 2, halfH = H / 2.
For 1920x1080: halfW = 960, halfH = 540.
For 1080x1920: halfW = 540, halfH = 960.
NEVER hardcode 960 or 540 — always derive from the spec canvas.

SAFE ZONE ENFORCEMENT:
All on-screen objects must stay within 60px of every canvas edge.
safeMinX = -(halfW - 60), safeMaxX = +(halfW - 60)
safeMinY = -(halfH - 60), safeMaxY = +(halfH - 60)
For 1920x1080: safe x: [-900, 900], safe y: [-480, 480]
For 1080x1920: safe x: [-480, 480], safe y: [-900, 900]

If an object's pos places its EDGE outside the safe zone and it is NOT an off-screen
entry/exit animation start position, clamp it to the safe zone boundary.

Object edge = pos +/- half-dimension:
  Circle: edge = pos.x +/- (diameter / 2)
  Rectangle: edge = pos.x +/- (size[0] / 2), pos.y +/- (size[1] / 2)
  Text: estimated edge = pos.x +/- (fontSize * 0.6 * text.length / 2)

TEXT POSITIONING RULES:
- Text divs use the same centering/pos transform as shape objects.
- For text with textAlign "center": pos is the center of the text block.
- For wide text, set maxWidth to prevent overflow:
  If estimated text width > (halfW * 2 - 120), add: maxWidth: (halfW * 2 - 120) + "px"
- For multi-line text (has "maxWidth" in spec), use: whiteSpace: "pre-wrap", wordBreak: "break-word"
- Text must NEVER use backgroundColor for its fill — always use CSS "color" property.

TEXT OVERLAP PREVENTION:
- If the spec has multiple text objects at similar y-positions (within 80px),
  ensure they are spaced at least 200px apart horizontally or 80px apart vertically.
- Title text should be positioned above main content, labels below.

CENTERING CONSISTENCY:
When multiple objects are meant to be centered (all at x=0 or y=0),
use the EXACT same positioning pattern for all of them:
  position: "absolute", left: "50%", top: "50%",
  transform: "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px)"`;

module.exports = LAYOUT_RULES;
