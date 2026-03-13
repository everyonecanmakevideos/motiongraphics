// ─────────────────────────────────────────────────────────────────────────────
// SHAPE RENDERING RULES — Always included. Covers how to render each shape.
// ─────────────────────────────────────────────────────────────────────────────

const SHAPE_RULES = `SHAPE RENDERING RULES
All shapes must be rendered as div elements.

Circle: Use borderRadius: "50%", set width and height to the diameter.

Rectangle/Square: Use width and height directly.

Triangle: Use clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" for upward-pointing.
  - facing "down": "polygon(0% 0%, 100% 0%, 50% 100%)"
  - facing "left": "polygon(100% 0%, 100% 100%, 0% 50%)"
  - facing "right": "polygon(0% 0%, 0% 100%, 100% 50%)"

Pentagon: Use clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"

Star: Use clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"

Line: Use a div with a very small height (e.g., 2-4px) and a width for horizontal lines, or vice versa.

POSITIONING
By default, center shapes using:
position: "absolute",
left: "50%",
top: "50%",
transform: "translate(-50%, -50%)"

The spec "pos" field is [x, y] relative to canvas center.
Add the pos values to the translate: "translate(calc(-50% + Xpx), calc(-50% + Ypx))" — but since you cannot use calc, use:
left: "50%", top: "50%", transform: "translateX(" + (posX - halfWidth) + "px) translateY(" + (posY - halfHeight) + "px)"

Or more simply for a centered shape:
left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px)"

OUTLINED SHAPES (stroke)
If object has "stroke" but "fill" is false:
- Set backgroundColor to "transparent"
- Use border: strokeWidth + "px solid " + strokeColor
- Use boxSizing: "border-box"

TEXT OBJECTS
When object has "shape": "text":
- Render as a <div> containing the text string from the object's "text" field.
- NEVER use backgroundColor for the text fill — use the CSS "color" property.
- Do NOT apply clipPath, borderRadius, or border to text divs.
- Use the same centering/pos transform as all other shapes.

Required style properties for text objects:
  color: textColor,
  fontSize: fontSize + "px",
  fontWeight: fontWeight,
  fontFamily: fontFamily,
  whiteSpace: "nowrap",
  lineHeight: lineHeight,
  letterSpacing: letterSpacing + "px",
  textAlign: textAlign,
  textTransform: textTransform,
  userSelect: "none",
  pointerEvents: "none"

For multi-line text (object has "maxWidth"):
  maxWidth: maxWidth + "px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word"

Opacity, scale, rotation, x/y animate identically to shape objects.

DATA VISUALIZATION SHAPES

Pie Chart (shape: "pie"):
A circle div (borderRadius: "50%") with a conic-gradient background.
The "segments" array defines color arcs by angular range.
Use "from -90deg" in conic-gradient to start slices at the 12 o'clock position.
Build the gradient string using + concatenation only — NEVER template literals.

Donut Chart (shape: "donut"):
Same as pie chart, but with a second smaller circle div layered on top.
The inner circle has backgroundColor matching the scene "bg" color, creating the hole.
"innerDiameter" defines the hole size. "thickness" = (diameter - innerDiameter) / 2.

Gauge (shape: "gauge"):
A half-circle using conic-gradient clipped with a wrapper div (overflow: "hidden", height = diameter/2).
Inside the wrapper, a full circle with conic-gradient for colored segments.
Needle: a thin div (4px wide) with transformOrigin: "50% 100%", rotated to indicate value.

Trapezoid:
A div with clip-path: "polygon(x1% 0%, x2% 0%, x3% 100%, x4% 100%)" forming a trapezoid shape.
Used in funnel charts and pyramid charts.

Polygon (shape: "polygon"):
A div with clip-path built from the "vertices" array.
Convert each vertex [x, y] from canvas-center coordinates to percentage coordinates within the bounding box.
Steps:
1. Find the bounding box of all vertices (minX, maxX, minY, maxY).
2. Set the div width = maxX - minX, height = maxY - minY.
3. Position the div so its bounding box aligns with the vertex coordinates on canvas.
   left: (960 + minX) + "px", top: (540 + minY) + "px"
4. Convert each vertex to a percentage within the bounding box:
   pctX = ((vx - minX) / (maxX - minX)) * 100
   pctY = ((vy - minY) / (maxY - minY)) * 100
5. Apply clipPath: "polygon(" + pctX1 + "% " + pctY1 + "%, " + pctX2 + "% " + pctY2 + "%, ...)"
6. Set backgroundColor to the object color.
Write out ALL vertex percentage computations explicitly — no loops.

Polyline (shape: "polyline"):
Render as an inline SVG element with a polyline inside it.
Convert each vertex [x, y] to SVG-local coordinates.
Steps:
1. Find the bounding box of all vertices. Add strokeWidth as padding on all sides.
2. Compute SVG dimensions: svgW = (maxX - minX) + strokeWidth * 2, svgH = (maxY - minY) + strokeWidth * 2.
3. Position the SVG on canvas:
   position: "absolute",
   left: (960 + minX - strokeWidth) + "px",
   top: (540 + minY - strokeWidth) + "px"
4. Convert each vertex to SVG-local coords:
   svgX = vx - minX + strokeWidth
   svgY = vy - minY + strokeWidth
5. Render:
   React.createElement("svg", { width: svgW, height: svgH, style: positionStyle },
     React.createElement("polyline", {
       points: svgX1 + "," + svgY1 + " " + svgX2 + "," + svgY2 + " ...",
       fill: "none",
       stroke: strokeColor,
       strokeWidth: strokeWidth,
       strokeLinecap: "round",
       strokeLinejoin: "round"
     })
   )
Write out ALL point coordinate computations explicitly — no loops.

PERSPECTIVE WRAPPER (for 3D transforms):
When any object has a "perspective" field, wrap it in a parent div with:
  perspective: perspectiveValue + "px",
  position: "absolute", left: "50%", top: "50%"
The 3D-rotating element (using rotateX/rotateY) goes inside this wrapper div.
Without the perspective wrapper, rotateX/rotateY produce flat skewing instead of 3D depth.`;

module.exports = SHAPE_RULES;
