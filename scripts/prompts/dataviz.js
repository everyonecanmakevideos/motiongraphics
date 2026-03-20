// ─────────────────────────────────────────────────────────────────────────────
// DATA VISUALIZATION RULES — Conditionally included when spec contains
// dataviz chart types (pie, donut, gauge, bar charts, line graphs, etc.).
// Each export is a separate rule block loaded only when needed.
// ─────────────────────────────────────────────────────────────────────────────

const PIE_CHART_RULES = "PIE CHART RENDERING & ANIMATION RULES\n" +
  "When the spec contains an object with \"shape\": \"pie\":\n\n" +
  "STRUCTURE:\n" +
  "  The pie object has \"segments\": [{ \"label\": \"...\", \"value\": number, \"color\": \"#hex\" }, ...]\n" +
  "  \"value\" represents the raw data value. Convert to degrees: angleDeg = (value / totalOfAllValues) * 360\n\n" +
  "RENDERING — single div with conic-gradient:\n" +
  "  position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
  "  width: diameter + \"px\", height: diameter + \"px\",\n" +
  "  borderRadius: \"50%\",\n" +
  "  transform: \"translate(-50%, -50%) translateX(\" + posX + \"px) translateY(\" + posY + \"px)\",\n" +
  "  background: conicGradientString\n\n" +
  "BUILDING THE CONIC-GRADIENT STRING (NO template literals — use concatenation):\n" +
  "  Pre-calculate cumulative angles for each segment.\n" +
  "  Example for 3 segments (seg1=120deg, seg2=90deg, seg3=150deg):\n\n" +
  "  const gradient = \"conic-gradient(from -90deg, \" +\n" +
  "    color1 + \" 0deg \" + seg1End + \"deg, \" +\n" +
  "    color2 + \" \" + seg1End + \"deg \" + seg2End + \"deg, \" +\n" +
  "    color3 + \" \" + seg2End + \"deg \" + seg3End + \"deg)\";\n\n" +
  "  \"from -90deg\" starts the first slice at the top (12 o'clock position).\n\n" +
  "SWEEP ANIMATION — timeline property \"sweep\": [fromDeg, toDeg]:\n" +
  "  Interpolate the total visible angle and clamp each segment boundary:\n\n" +
  "  const sweepAngle = interpolate(frame, [startFrame, endFrame], [fromDeg, toDeg],\n" +
  "    { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
  "  For each segment, clamp its visible end angle to the sweep:\n" +
  "  const seg1Visible = Math.min(sweepAngle, seg1End);\n" +
  "  const seg2Visible = Math.min(sweepAngle, seg2End);\n" +
  "  const seg3Visible = Math.min(sweepAngle, seg3End);\n\n" +
  "  Then build the gradient with visible angles:\n" +
  "  const gradient = \"conic-gradient(from -90deg, \" +\n" +
  "    color1 + \" 0deg \" + seg1Visible + \"deg, \" +\n" +
  "    color2 + \" \" + Math.min(sweepAngle, seg1End) + \"deg \" + seg2Visible + \"deg, \" +\n" +
  "    color3 + \" \" + Math.min(sweepAngle, seg2End) + \"deg \" + seg3Visible + \"deg, \" +\n" +
  "    \"transparent \" + seg3Visible + \"deg 360deg)\";\n\n" +
  "SEQUENTIAL SEGMENT SWEEP:\n" +
  "  If the spec animates segments one at a time (e.g., seg1 draws 0-2s, seg2 draws 2-4s),\n" +
  "  use separate timeline entries with different sweep ranges:\n" +
  "  Entry 1: target pie, time [0, 2], sweep [0, seg1End]\n" +
  "  Entry 2: target pie, time [2, 4], sweep [seg1End, seg2End]\n" +
  "  In this case, interpolate each segment's sweep independently.\n\n" +
  "EXPLODING SLICE:\n" +
  "  When the spec says a slice \"explodes\" or shifts outward:\n" +
  "  Use a SEPARATE div for each slice. Each slice div uses a conic-gradient showing ONLY its arc\n" +
  "  (transparent for other arcs). The exploding slice gets an animated translateX/translateY\n" +
  "  along its bisecting angle:\n" +
  "  const bisectDeg = (segStartDeg + segEndDeg) / 2 - 90;\n" +
  "  const bisectRad = bisectDeg * Math.PI / 180;\n" +
  "  const explodeX = distance * Math.cos(bisectRad);\n" +
  "  const explodeY = distance * Math.sin(bisectRad);\n\n" +
  "CRITICAL:\n" +
  "  - NEVER use template literals. Build gradient strings with + concatenation only.\n" +
  "  - Always use \"from -90deg\" in conic-gradient to start at top.\n" +
  "  - Use \"transparent\" for the unfilled portion of the gradient during sweep.";

const DONUT_CHART_RULES = "DONUT CHART RENDERING & ANIMATION RULES\n" +
  "When the spec contains an object with \"shape\": \"donut\":\n\n" +
  "A donut is a pie chart with a hole in the center.\n\n" +
  "OBJECT FIELDS:\n" +
  "  \"diameter\": outer diameter in px\n" +
  "  \"innerDiameter\": hole diameter in px (or use \"thickness\" = (diameter - innerDiameter) / 2)\n" +
  "  \"segments\": same as pie chart segments\n\n" +
  "RENDERING — two stacked divs:\n\n" +
  "  Div 1 (outer ring): Identical to a pie chart div.\n" +
  "    borderRadius: \"50%\", width/height = diameter, background = conic-gradient.\n\n" +
  "  Div 2 (center mask): Layered on top, same center position.\n" +
  "    borderRadius: \"50%\",\n" +
  "    width: innerDiameter + \"px\", height: innerDiameter + \"px\",\n" +
  "    backgroundColor: sceneBgColor,\n" +
  "    position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
  "    transform: \"translate(-50%, -50%)\",\n" +
  "    zIndex: 1 (above the ring div)\n\n" +
  "  Both divs should be inside a wrapper div positioned at the donut's canvas location.\n\n" +
  "SINGLE-SEGMENT PROGRESS RING:\n" +
  "  For a progress ring (one colored arc on a grey track):\n" +
  "  Use TWO conic-gradients layered or a single gradient:\n" +
  "  \"conic-gradient(from -90deg, \" + progressColor + \" 0deg \" + sweepAngle + \"deg, \" +\n" +
  "    trackColor + \" \" + sweepAngle + \"deg 360deg)\"\n\n" +
  "SWEEP ANIMATION: Same as PIE_CHART_RULES — interpolate sweep angle.\n\n" +
  "CENTER TEXT:\n" +
  "  If the spec has a text object with parent set to the donut id,\n" +
  "  render it inside the center mask area using standard text rules.\n" +
  "  The text div should be positioned at the center of the donut.\n\n" +
  "CRITICAL:\n" +
  "  - The center mask backgroundColor MUST match the scene \"bg\" color exactly.\n" +
  "  - If the scene has a gradient background, use a solid color that blends.";

const GAUGE_RULES = "GAUGE / SPEEDOMETER RENDERING & ANIMATION RULES\n" +
  "When the spec contains an object with \"shape\": \"gauge\":\n\n" +
  "STRUCTURE:\n" +
  "  A gauge is a half-circle (top half) with colored segments and an optional needle.\n" +
  "  Object fields: \"diameter\", \"segments\" (colored arcs), \"needle\": { \"length\": px, \"color\": \"#hex\" }\n\n" +
  "RENDERING — conic-gradient circle clipped to top half:\n\n" +
  "  Step 1: Wrapper div positioned on canvas.\n" +
  "    position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
  "    width: diameter + \"px\", height: (diameter / 2) + \"px\",\n" +
  "    overflow: \"hidden\"\n\n" +
  "  Step 2: Inside wrapper, a full circle div:\n" +
  "    width: diameter + \"px\", height: diameter + \"px\",\n" +
  "    borderRadius: \"50%\",\n" +
  "    background: conic-gradient for gauge segments.\n" +
  "    position: \"absolute\", top: \"0px\", left: \"0px\"\n\n" +
  "  The wrapper clips the bottom half, showing only the top semicircle.\n\n" +
  "  Gauge segments map to the top half (180deg arc).\n" +
  "  \"from 180deg\" in conic-gradient maps 0° to left edge, 180° to right edge of the semicircle.\n\n" +
  "  For 3 equal segments (60deg each):\n" +
  "  \"conic-gradient(from 180deg, \" +\n" +
  "    color1 + \" 0deg 60deg, \" +\n" +
  "    color2 + \" 60deg 120deg, \" +\n" +
  "    color3 + \" 120deg 180deg, \" +\n" +
  "    \"transparent 180deg 360deg)\"\n\n" +
  "NEEDLE:\n" +
  "  A thin div (width: 4px, height: needleLength + \"px\") positioned at the gauge center bottom.\n" +
  "  transformOrigin: \"50% 100%\" (pivot at bottom center of needle)\n" +
  "  The needle base sits at the center-bottom of the gauge semicircle.\n\n" +
  "  Rotation mapping: 0° (pointing left) to 180° (pointing right).\n" +
  "  CSS rotation: transform: \"rotate(\" + (needleAngle - 90) + \"deg)\"\n" +
  "  So 0 needle degrees = -90 CSS deg (pointing left), 180 needle degrees = 90 CSS deg (pointing right).\n\n" +
  "NEEDLE ANIMATION — timeline property \"needleRotation\": [fromDeg, toDeg]:\n" +
  "  const needleDeg = interpolate(frame, [startFrame, endFrame], [fromDeg, toDeg],\n" +
  "    { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  transform: \"rotate(\" + (needleDeg - 90) + \"deg)\"\n\n" +
  "SWEEP ANIMATION for gauge segments:\n" +
  "  Same technique as pie chart sweep, but limited to 180deg range.\n\n" +
  "WOBBLE EFFECT:\n" +
  "  For needle settling, use multiple timeline entries:\n" +
  "  Entry 1: needleRotation [from, target+2]\n" +
  "  Entry 2: needleRotation [target+2, target-2]\n" +
  "  Entry 3: needleRotation [target-2, target]";

const BAR_CHART_DATAVIZ_RULES = "BAR CHART (DATA VISUALIZATION) RULES\n" +
  "When the spec describes vertical or horizontal bar charts:\n\n" +
  "DECOMPOSITION:\n" +
  "  A bar chart is NOT a single object. It decomposes into:\n" +
  "  - Individual rectangle objects for each bar\n" +
  "  - Line objects for axes (X-axis, Y-axis)\n" +
  "  - Text objects for labels and values\n" +
  "  - Optional text for title\n\n" +
  "VERTICAL BAR GROWING FROM BOTTOM:\n" +
  "  Each bar is a rectangle with:\n" +
  "    anchor: \"bottom-center\"\n" +
  "    pos: [barX, baselineY]\n" +
  "  Animation: scaleY: [0, 1] (grows upward from baseline)\n" +
  "  Style:\n" +
  "    position: \"absolute\", left: \"50%\", top: \"50%\",\n" +
  "    width: barWidth + \"px\", height: barHeight + \"px\",\n" +
  "    transformOrigin: \"50% 100%\",\n" +
  "    transform: \"translate(-50%, -50%) translateX(\" + posX + \"px) translateY(\" + posY + \"px) scaleY(\" + sy + \")\"\n\n" +
  "HORIZONTAL BAR GROWING FROM LEFT:\n" +
  "  Each bar is a rectangle with:\n" +
  "    anchor: \"left-center\"\n" +
  "  Animation: scaleX: [0, 1] (grows rightward)\n" +
  "  transformOrigin: \"0% 50%\"\n\n" +
  "STACKED BARS:\n" +
  "  Multiple segments stacked vertically at the same X position.\n" +
  "  Each segment is a separate rectangle. Position each segment's bottom\n" +
  "  at the top of the previous segment. Animate scaleY: [0, 1] sequentially.\n\n" +
  "STAGGERED ANIMATION:\n" +
  "  Bars grow one after another with overlapping timing:\n" +
  "  Bar 1: scaleY [0, 1] from time [1, 2]\n" +
  "  Bar 2: scaleY [0, 1] from time [1.3, 2.3]\n" +
  "  Bar 3: scaleY [0, 1] from time [1.6, 2.6]\n\n" +
  "ROUNDED TOP CORNERS:\n" +
  "  For bars with rounded tops: use borderRadius with only top corners:\n" +
  "  borderRadius: \"6px 6px 0px 0px\" (for vertical bars)\n\n" +
  "VALUE LABELS:\n" +
  "  Text objects positioned above (vertical) or to the right (horizontal) of each bar.\n" +
  "  Use \"counter\": [0, targetValue] in timeline to animate the number.\n\n" +
  "AXES:\n" +
  "  Y-axis: vertical line object at the left edge of the chart area.\n" +
  "  X-axis: horizontal line object at the baseline.\n\n" +
  "GRIDLINES:\n" +
  "  Horizontal line objects with low opacity spanning the chart width.\n\n" +
  "CRITICAL:\n" +
  "  - Each bar MUST be an explicit, separate rectangle object.\n" +
  "  - NEVER use loops to generate bars.\n" +
  "  - Each bar has its own timeline entry for animation.";

const LINE_GRAPH_RULES = "LINE GRAPH / CONNECTED DATA POINTS RULES\n" +
  "When the spec describes a line graph with connected data points:\n\n" +
  "DECOMPOSITION:\n" +
  "  - Line objects connecting adjacent data points\n" +
  "  - Small circle objects as dot markers at each data point\n" +
  "  - Line objects for axes\n" +
  "  - Optional text for labels\n\n" +
  "LINE SEGMENT BETWEEN TWO POINTS:\n" +
  "  For a line from point A (ax, ay) to point B (bx, by):\n\n" +
  "  Calculate length and angle:\n" +
  "  const dx = bx - ax;\n" +
  "  const dy = by - ay;\n" +
  "  const length = Math.sqrt(dx * dx + dy * dy);\n" +
  "  const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;\n\n" +
  "  Line div:\n" +
  "    width: length + \"px\", height: strokeWidth + \"px\",\n" +
  "    position: \"absolute\",\n" +
  "    left: \"50%\", top: \"50%\",\n" +
  "    transformOrigin: \"0% 50%\",\n" +
  "    transform: \"translate(-50%, -50%) translateX(\" + ax + \"px) translateY(\" + ay + \"px) rotate(\" + angleDeg + \"deg)\"\n\n" +
  "  IMPORTANT: transformOrigin \"0% 50%\" anchors rotation at the start point of the line.\n\n" +
  "LINE DRAW ANIMATION:\n" +
  "  To animate a line drawing from start to end, animate its width:\n" +
  "  width: [0, finalLength]\n" +
  "  The transformOrigin: \"0% 50%\" ensures it grows from point A toward point B.\n\n" +
  "DOT MARKERS:\n" +
  "  Small circles (12-20px diameter) at each data point.\n" +
  "  Animation: scale: [0, 1] with easing for a pop-in effect.\n\n" +
  "SEQUENTIAL DRAW:\n" +
  "  Line 1 draws in its time range, then line 2, then line 3.\n" +
  "  Dots pop in after all lines are drawn or after each segment.\n\n" +
  "TRENDLINE:\n" +
  "  A dashed line (using repeating-linear-gradient for dashes)\n" +
  "  connecting the first and last data points.";

const AREA_GRAPH_RULES = "AREA GRAPH / FILLED REGION RULES\n" +
  "When the spec describes an area graph (filled region under a line):\n\n" +
  "RENDERING:\n" +
  "  A single div with the fill color (or gradient) and a clip-path polygon\n" +
  "  that defines the shape of the area.\n\n" +
  "  The polygon vertices trace: bottom-left corner, each data point (left to right),\n" +
  "  bottom-right corner.\n\n" +
  "  clip-path: \"polygon(0% 100%, x1% y1%, x2% y2%, ..., 100% 100%)\"\n\n" +
  "  Convert data point positions to percentages of the div dimensions.\n\n" +
  "TOP EDGE LINE:\n" +
  "  A separate div (or use border-top on the area div) for the top line.\n" +
  "  Can be an absolutely positioned thin div tracing the same path\n" +
  "  using the same clip-path.\n\n" +
  "REVEAL ANIMATION — timeline property \"clipExpand\": [0, 100]:\n" +
  "  Animate the area revealing from left to right using an overlay clip:\n\n" +
  "  const expandPct = interpolate(frame, [startFrame, endFrame], [0, 100],\n" +
  "    { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n" +
  "  const revealClip = \"inset(0 \" + (100 - expandPct) + \"% 0 0)\";\n\n" +
  "  Apply revealClip as an additional clipPath on the area div,\n" +
  "  or use a wrapper div with overflow: \"hidden\" and animate the wrapper width.\n\n" +
  "GRADIENT FILL:\n" +
  "  For gradient fills (e.g., solid at top, transparent at bottom):\n" +
  "  background: \"linear-gradient(to bottom, \" + topColor + \", transparent)\"";

const FUNNEL_CHART_RULES = "FUNNEL CHART / STACKED TRAPEZOID RULES\n" +
  "When the spec describes a funnel chart:\n\n" +
  "DECOMPOSITION:\n" +
  "  Each tier is a separate div with a trapezoid clip-path.\n" +
  "  Tiers stack vertically with small gaps.\n\n" +
  "TRAPEZOID CLIP-PATH:\n" +
  "  A trapezoid with wider top and narrower bottom:\n" +
  "  clipPath: \"polygon(\" + leftInset + \"% 0%, \" + (100 - leftInset) + \"% 0%, \" +\n" +
  "    (100 - bottomInset) + \"% 100%, \" + bottomInset + \"% 100%)\"\n\n" +
  "  Where leftInset and bottomInset control the narrowing.\n\n" +
  "  For a tier that is 300px wide at top and 200px wide at bottom,\n" +
  "  within a 300px wide div:\n" +
  "  topLeftInset = 0%, topRightInset = 100%\n" +
  "  bottomLeftInset = ((300-200)/2/300*100)% = 16.67%\n" +
  "  clipPath: \"polygon(0% 0%, 100% 0%, 83.33% 100%, 16.67% 100%)\"\n\n" +
  "POSITIONING:\n" +
  "  Center all tiers horizontally. Stack vertically with gaps:\n" +
  "  Tier 1: pos [0, topY]\n" +
  "  Tier 2: pos [0, topY + tier1Height + gap]\n" +
  "  Tier 3: pos [0, topY + tier1Height + tier2Height + 2*gap]\n\n" +
  "ANIMATION:\n" +
  "  Tiers slide in from above and fade in sequentially:\n" +
  "  Tier 1: y [above, targetY], opacity [0, 1] from time [0, 1.5]\n" +
  "  Tier 2: y [above, targetY], opacity [0, 1] from time [1.5, 3]\n" +
  "  Tier 3: y [above, targetY], opacity [0, 1] from time [3, 4.5]\n\n" +
  "LABELS:\n" +
  "  Text objects centered on each tier, fade in after tier appears.";

const SCATTER_PLOT_RULES = "SCATTER PLOT RULES\n" +
  "When the spec describes a scatter plot:\n\n" +
  "CRITICAL — NO LOOPS:\n" +
  "  Every dot is an individual circle object in the spec.\n" +
  "  Every dot has its own id, pos, color, diameter.\n" +
  "  Every dot has its own timeline entry.\n" +
  "  NEVER use loops, .map(), or Array.from() to generate dots.\n" +
  "  Limit to 15 dots maximum for practical spec size.\n\n" +
  "DECOMPOSITION:\n" +
  "  - 2 line objects for axes (X-axis, Y-axis)\n" +
  "  - N circle objects for data dots\n" +
  "  - Optional text objects for axis labels\n" +
  "  - Optional line object for trendline\n\n" +
  "AXES — L-SHAPED:\n" +
  "  Y-axis: vertical line from bottom-left to top-left of chart area.\n" +
  "  X-axis: horizontal line from bottom-left to bottom-right of chart area.\n" +
  "  Animate drawing: width [0, length] or height [0, length].\n\n" +
  "DOTS:\n" +
  "  Each dot: shape circle, diameter 12-16px, semi-transparent color.\n" +
  "  pos: [dataX, dataY] in canvas coordinates.\n" +
  "  opacity: 0 initially.\n\n" +
  "STAGGERED POP-IN:\n" +
  "  Each dot pops in sequentially:\n" +
  "  Dot 1: scale [0, 1] from time [2, 2.5]\n" +
  "  Dot 2: scale [0, 1] from time [2.5, 3]\n" +
  "  ... stagger 0.3-0.5s each.\n\n" +
  "TRENDLINE:\n" +
  "  A diagonal dashed line through the cluster.\n" +
  "  Use a line div with repeating-linear-gradient for dashes:\n" +
  "  background: \"repeating-linear-gradient(90deg, \" + color + \" 0px, \" +\n" +
  "    color + \" 8px, transparent 8px, transparent 16px)\"";

const RADAR_CHART_RULES = "RADAR / SPIDER CHART RULES\n" +
  "When the spec describes a radar or spider chart:\n\n" +
  "STRUCTURE:\n" +
  "  - Background web: concentric polygon outlines (faint)\n" +
  "  - Data polygon: filled, semi-transparent shape\n" +
  "  - Optional dots at vertices\n\n" +
  "POLYGON RENDERING:\n" +
  "  Use clip-path with polygon() for N-sided shapes.\n" +
  "  Calculate vertices using trigonometry:\n\n" +
  "  For a regular N-sided polygon (e.g., pentagon N=5):\n" +
  "  Each vertex i at angle: angleDeg = (360 / N) * i - 90 (start from top)\n" +
  "  x = 50 + (radius/maxRadius * 50) * Math.cos(angleDeg * Math.PI / 180)\n" +
  "  y = 50 + (radius/maxRadius * 50) * Math.sin(angleDeg * Math.PI / 180)\n\n" +
  "  clipPath: \"polygon(x1% y1%, x2% y2%, x3% y3%, x4% y4%, x5% y5%)\"\n\n" +
  "BACKGROUND WEB:\n" +
  "  Multiple concentric polygon outlines (e.g., at 25%, 50%, 75%, 100% radius).\n" +
  "  Each web ring: a div with the polygon clip-path, border only (no fill),\n" +
  "  or two stacked divs (outer with color, inner slightly smaller with bg color).\n\n" +
  "DATA POLYGON:\n" +
  "  A single div with clip-path polygon. Vertices at UNEQUAL distances\n" +
  "  from center (each vertex represents a different data value).\n" +
  "  backgroundColor with opacity (e.g., rgba or hex with opacity).\n\n" +
  "ANIMATION — EXPANSION:\n" +
  "  Animate scale: [0, 1] to expand from center.\n" +
  "  Or animate each vertex distance individually if the spec requires\n" +
  "  unequal expansion speeds (more complex — requires animating clip-path string).\n\n" +
  "VERTEX DOTS:\n" +
  "  Small circles positioned at each vertex of the data polygon.\n" +
  "  Pop in after the polygon expansion completes.";

const ACTIVITY_RINGS_RULES = "ACTIVITY RINGS / CONCENTRIC PROGRESS RINGS RULES\n" +
  "When the spec describes concentric progress rings (like Apple Activity Rings):\n\n" +
  "STRUCTURE:\n" +
  "  Multiple donut rings centered at the same point, each with different diameter.\n" +
  "  Each ring has a background track (dimmed color) and a progress arc (bright color).\n\n" +
  "RENDERING — for each ring:\n" +
  "  Two stacked circle divs:\n\n" +
  "  Track div (background):\n" +
  "    width/height: ringDiameter, borderRadius: \"50%\",\n" +
  "    background: dimmedColor (lower opacity or darker version)\n" +
  "    Use a conic-gradient showing the full 360deg track.\n" +
  "    Or use a simple backgroundColor with the track color.\n\n" +
  "  Progress div (foreground):\n" +
  "    Same size, layered on top.\n" +
  "    background: conic-gradient showing progress arc:\n" +
  "    \"conic-gradient(from -90deg, \" + progressColor + \" 0deg \" + sweepAngle + \"deg, \" +\n" +
  "      \"transparent \" + sweepAngle + \"deg 360deg)\"\n\n" +
  "  Center mask div:\n" +
  "    Smaller circle (ringDiameter - 2*thickness) with scene bg color\n" +
  "    to create the donut hole.\n\n" +
  "STAGGERED SWEEP:\n" +
  "  Each ring sweeps with slightly offset timing:\n" +
  "  Outer ring: sweep [0, 288] from time [1, 3]\n" +
  "  Middle ring: sweep [0, 216] from time [1.5, 3.5]\n" +
  "  Inner ring: sweep [0, 144] from time [2, 4]\n\n" +
  "TRACK FADE-IN:\n" +
  "  All tracks fade in together before progress arcs begin sweeping.";

const PYRAMID_CHART_RULES = "PYRAMID / HIERARCHY CHART RULES\n" +
  "When the spec describes a pyramid chart:\n\n" +
  "STRUCTURE:\n" +
  "  Stacked tiers, widest at bottom, narrowest at top.\n" +
  "  Each tier is a separate div (rectangle or trapezoid).\n\n" +
  "RENDERING:\n" +
  "  Each tier is a rectangle div with a trapezoid clip-path.\n" +
  "  Bottom tier: widest, clipPath forms a wide trapezoid.\n" +
  "  Top tier: narrowest, clipPath forms a narrow trapezoid or triangle.\n\n" +
  "  For a tier with topWidth and bottomWidth within a container of maxWidth:\n" +
  "  const topInset = ((maxWidth - topWidth) / 2 / maxWidth * 100);\n" +
  "  const botInset = ((maxWidth - bottomWidth) / 2 / maxWidth * 100);\n" +
  "  clipPath: \"polygon(\" + topInset + \"% 0%, \" + (100 - topInset) + \"% 0%, \" +\n" +
  "    (100 - botInset) + \"% 100%, \" + botInset + \"% 100%)\"\n\n" +
  "  Tip (triangle): clipPath: \"polygon(50% 0%, 100% 100%, 0% 100%)\"\n\n" +
  "STACKING:\n" +
  "  Position tiers from bottom to top.\n" +
  "  Each tier's pos Y = previous tier Y - current tier height - gap.\n\n" +
  "BUILD ANIMATION:\n" +
  "  Bottom-up: Bottom tier fades/slides in first, then next tier stacks on top.\n" +
  "  Each tier: opacity [0, 1] and y [startY + offset, targetY].\n\n" +
  "GLOW EFFECT:\n" +
  "  For glowing tip: Use boxShadow animation on the top tier.\n" +
  "  Pulsing: Multiple timeline entries alternating shadow blur values.";

const COUNTER_RULES = "ANIMATED NUMBER COUNTER RULES\n" +
  "When a timeline entry has \"counter\": [fromNum, toNum] targeting a text object:\n\n" +
  "IMPLEMENTATION:\n" +
  "  Interpolate the displayed number and round to integer:\n\n" +
  "  const counterVal = interpolate(frame, [startFrame, endFrame], [fromNum, toNum],\n" +
  "    { extrapolateLeft: \"clamp\", extrapolateRight: \"clamp\" });\n\n" +
  "  Display as text content:\n" +
  "  {Math.round(counterVal)}\n\n" +
  "  If the text includes a suffix (like \"%\" or \"k\"):\n" +
  "  {Math.round(counterVal) + \"%\"}\n" +
  "  {Math.round(counterVal) + \"k\"}\n\n" +
  "  The suffix is determined from the object's \"text\" field.\n" +
  "  If text is \"0%\", the suffix is \"%\".\n" +
  "  If text is \"0k\", the suffix is \"k\".\n\n" +
  "COUNTER WITH DECIMAL:\n" +
  "  For decimal display (e.g., \"$12.50\"):\n" +
  "  {(Math.round(counterVal * 100) / 100).toFixed(2)}\n\n" +
  "CRITICAL:\n" +
  "  - The counter replaces the text content dynamically.\n" +
  "  - The text object's \"text\" field serves as a template (initial value + suffix).\n" +
  "  - Use Math.round() to avoid floating point display issues.";

const GRID_BACKGROUND_RULES = "GRID BACKGROUND / GRIDLINES RULES\n" +
  "When the spec object has \"gridLines\": true or the scene describes a grid background:\n\n" +
  "RENDERING — using repeating-linear-gradient:\n" +
  "  Apply to the AbsoluteFill background or a dedicated background div:\n\n" +
  "  For a faint grid with spacing of 50px:\n" +
  "  background: sceneBgColor (as base),\n" +
  "  then overlay a div with:\n" +
  "  background: \"repeating-linear-gradient(0deg, transparent, transparent 49px, \" +\n" +
  "    gridColor + \" 49px, \" + gridColor + \" 50px), \" +\n" +
  "    \"repeating-linear-gradient(90deg, transparent, transparent 49px, \" +\n" +
  "    gridColor + \" 49px, \" + gridColor + \" 50px)\"\n\n" +
  "  gridColor should be a subtle grey like \"rgba(200, 200, 200, 0.3)\" or similar.\n\n" +
  "CHART-SPECIFIC GRIDLINES:\n" +
  "  For horizontal gridlines behind a bar chart:\n" +
  "  Use individual line divs (thin horizontal rectangles) with low opacity.\n" +
  "  These are explicit objects in the spec, not generated with loops.\n\n" +
  "AXIS TICK MARKS:\n" +
  "  Small line divs (10px long, 2px thick) along the axes.\n" +
  "  Each is an explicit object.";

const DATA_ACCURACY_RULES = "DATA ACCURACY VERIFICATION RULES\n" +
  "When rendering any data visualization, the visual output MUST accurately reflect the data:\n\n" +
  "PIE / DONUT SEGMENTS:\n" +
  "  Calculate cumulative angles from the segments array:\n" +
  "  const total = seg1.value + seg2.value + seg3.value (sum all segment values)\n" +
  "  seg1EndDeg = (seg1.value / total) * 360\n" +
  "  seg2EndDeg = seg1EndDeg + (seg2.value / total) * 360\n" +
  "  The conic-gradient boundaries MUST use these exact calculated degrees.\n" +
  "  Example: 70% = 252deg, 30% = 108deg (252+108=360).\n" +
  "  VERIFY: all segment angles sum to exactly 360 (pie) or 180 (gauge).\n\n" +
  "BAR HEIGHTS:\n" +
  "  Each bar div's height must exactly equal the object's size[1] from the spec.\n" +
  "  Never approximate heights. A bar specified as 240px must render at 240px.\n\n" +
  "COUNTER VALUES:\n" +
  "  The counter interpolation range must use the exact values from the timeline.\n" +
  "  If counter: [0, 75], the final displayed number must be exactly 75.\n" +
  "  If the text has a suffix (% or k), append it: Math.round(val) + \"%\"\n\n" +
  "GAUGE NEEDLE:\n" +
  "  The needle's final rotation must correspond to the exact data value.\n" +
  "  For needleRotation: [0, 150], the needle must stop at exactly 150 degrees.\n\n" +
  "SWEEP ANGLES:\n" +
  "  For sweep: [0, 270], the arc must stop at exactly 270 degrees.\n" +
  "  Never overshoot or undershoot the target sweep angle.\n\n" +
  "LABELS AND VALUES:\n" +
  "  Text labels showing data values must display the exact numbers from the spec.\n" +
  "  Percentage labels must match the data proportions.\n\n" +
  "CRITICAL: Data accuracy is more important than visual aesthetics.\n" +
  "  If a bar is 200px tall, it must be 200px — not 190px for \"better spacing\".\n" +
  "  If a pie slice is 70%, it must be exactly 252 degrees — not \"about 250\".";

const DASHED_LINE_RULES = "DASHED LINE RENDERING RULES\n" +
  "When the spec describes dashed or dotted lines:\n\n" +
  "RENDERING — using repeating-linear-gradient:\n" +
  "  Do NOT use border-style: dashed (inconsistent across browsers).\n\n" +
  "  For a horizontal dashed line:\n" +
  "  background: \"repeating-linear-gradient(90deg, \" +\n" +
  "    lineColor + \" 0px, \" + lineColor + \" 8px, \" +\n" +
  "    \"transparent 8px, transparent 16px)\"\n\n" +
  "  For a vertical dashed line:\n" +
  "  background: \"repeating-linear-gradient(0deg, \" +\n" +
  "    lineColor + \" 0px, \" + lineColor + \" 8px, \" +\n" +
  "    \"transparent 8px, transparent 16px)\"\n\n" +
  "  For a diagonal dashed line:\n" +
  "  First create the line div at the correct angle using transform: rotate().\n" +
  "  Then apply the horizontal repeating-linear-gradient to the rotated div.\n\n" +
  "  Dash parameters: dashLength and gapLength can be adjusted.\n" +
  "  Default: 8px dash, 8px gap.";

const POLYGON_RENDER_RULES = "POLYGON SHAPE RENDERING RULES\n" +
  "When the spec contains a \"polygon\" shape object:\n\n" +
  "The object has \"vertices\": [[x1,y1], [x2,y2], ...] in canvas-center coordinates.\n\n" +
  "RENDERING STEPS:\n" +
  "1. Calculate bounding box from all vertices:\n" +
  "   Find minX, maxX, minY, maxY across all vertex coordinates.\n" +
  "2. Create a div sized to the bounding box:\n" +
  "   width: (maxX - minX) + \"px\", height: (maxY - minY) + \"px\"\n" +
  "3. Position the div on canvas:\n" +
  "   position: \"absolute\",\n" +
  "   left: (960 + minX) + \"px\", top: (540 + minY) + \"px\"\n" +
  "4. Convert each vertex to a clip-path percentage:\n" +
  "   const pctX = ((vx - minX) / (maxX - minX)) * 100;\n" +
  "   const pctY = ((vy - minY) / (maxY - minY)) * 100;\n" +
  "5. Apply: clipPath: \"polygon(\" + pctX1 + \"% \" + pctY1 + \"%, \" + ... + \")\"\n" +
  "6. Set backgroundColor to the object color.\n\n" +
  "CRITICAL: Compute ALL vertex percentage values as explicit numbers.\n" +
  "Write out each vertex conversion individually — no loops.\n" +
  "Build the polygon string with + concatenation only.";

const POLYLINE_RENDER_RULES = "POLYLINE SHAPE RENDERING RULES\n" +
  "When the spec contains a \"polyline\" shape object:\n\n" +
  "The object has \"vertices\": [[x1,y1], [x2,y2], ...] in canvas-center coordinates.\n\n" +
  "RENDERING — using inline SVG:\n" +
  "1. Calculate bounding box from all vertices. Add strokeWidth as padding.\n" +
  "2. Compute SVG dimensions:\n" +
  "   svgW = (maxX - minX) + strokeWidth * 2\n" +
  "   svgH = (maxY - minY) + strokeWidth * 2\n" +
  "3. Position SVG on canvas:\n" +
  "   position: \"absolute\",\n" +
  "   left: (960 + minX - strokeWidth) + \"px\",\n" +
  "   top: (540 + minY - strokeWidth) + \"px\"\n" +
  "4. Convert each vertex to SVG-local coords:\n" +
  "   svgX = vx - minX + strokeWidth\n" +
  "   svgY = vy - minY + strokeWidth\n" +
  "5. Render:\n" +
  "   React.createElement(\"svg\", {\n" +
  "     width: svgW, height: svgH,\n" +
  "     style: { position: \"absolute\", left: leftPx + \"px\", top: topPx + \"px\", overflow: \"visible\" }\n" +
  "   },\n" +
  "     React.createElement(\"polyline\", {\n" +
  "       points: svgX1 + \",\" + svgY1 + \" \" + svgX2 + \",\" + svgY2 + \" ...\",\n" +
  "       fill: \"none\",\n" +
  "       stroke: strokeColor,\n" +
  "       strokeWidth: strokeWidth,\n" +
  "       strokeLinecap: \"round\",\n" +
  "       strokeLinejoin: \"round\"\n" +
  "     })\n" +
  "   )\n\n" +
  "CRITICAL: Write out ALL point coordinate computations explicitly — no loops.\n" +
  "Build the points string with + concatenation only.";

// ─────────────────────────────────────────────────────────────────────────────
// Detect which dataviz rules are needed based on spec content
// ─────────────────────────────────────────────────────────────────────────────
function getDatavizRules(specData) {
  const rules = [];
  const specStr = JSON.stringify(specData);

  // Pie chart detection
  if (specStr.includes('"pie"') || specStr.includes('"segments"')) {
    rules.push(PIE_CHART_RULES);
  }

  // Donut chart detection
  if (specStr.includes('"donut"') || specStr.includes('"innerDiameter"') || specStr.includes('"thickness"')) {
    rules.push(DONUT_CHART_RULES);
  }

  // Gauge / speedometer detection
  if (specStr.includes('"gauge"') || specStr.includes('"needleRotation"') || specStr.includes('"needle"')) {
    rules.push(GAUGE_RULES);
  }

  // Sweep animation (implies pie/donut/gauge — load pie rules as base)
  if (specStr.includes('"sweep"') && !rules.includes(PIE_CHART_RULES)) {
    rules.push(PIE_CHART_RULES);
  }

  // Bar chart dataviz detection
  if (specStr.includes('"anchor"') && (specStr.includes('"bottom-center"') || specStr.includes('"left-center"'))) {
    if (specStr.includes('"scaleY"') || specStr.includes('"scaleX"')) {
      rules.push(BAR_CHART_DATAVIZ_RULES);
    }
  }

  // Line graph detection
  if (specStr.includes('"line_graph"') || specStr.includes('"line-graph"') ||
      (specStr.includes('"line"') && specStr.includes('"dot"'))) {
    rules.push(LINE_GRAPH_RULES);
  }

  // Area graph detection
  if (specStr.includes('"clipExpand"') || specStr.includes('"area"') || specStr.includes('"area_graph"')) {
    rules.push(AREA_GRAPH_RULES);
  }

  // Funnel chart detection
  if (specStr.includes('"funnel"') || specStr.includes('"trapezoid"')) {
    rules.push(FUNNEL_CHART_RULES);
  }

  // Scatter plot detection
  if (specStr.includes('"scatter"')) {
    rules.push(SCATTER_PLOT_RULES);
  }

  // Radar / spider chart detection
  if (specStr.includes('"radar"') || specStr.includes('"spider"')) {
    rules.push(RADAR_CHART_RULES);
  }

  // Activity rings detection
  if (specStr.includes('"activity_ring"') || specStr.includes('"ring"')) {
    // Check for concentric ring pattern: multiple donut-like objects
    if (Array.isArray(specData.objects)) {
      const donutCount = specData.objects.filter(function(obj) {
        return obj.shape === "donut" || obj.innerDiameter || obj.thickness;
      }).length;
      if (donutCount >= 2) {
        rules.push(ACTIVITY_RINGS_RULES);
      }
    }
  }

  // Pyramid chart detection
  if (specStr.includes('"pyramid"')) {
    rules.push(PYRAMID_CHART_RULES);
  }

  // Counter animation detection
  if (specStr.includes('"counter"')) {
    rules.push(COUNTER_RULES);
  }

  // Grid background detection
  if (specStr.includes('"gridLines"') || specStr.includes('"grid"')) {
    rules.push(GRID_BACKGROUND_RULES);
  }

  // Dashed line detection
  if (specStr.includes('"dashed"') || specStr.includes('"dotted"') || specStr.includes('"trendline"')) {
    rules.push(DASHED_LINE_RULES);
  }

  // Polygon shape detection (area charts, radar data polygons)
  if (specStr.includes('"polygon"')) {
    rules.push(POLYGON_RENDER_RULES);
  }

  // Polyline shape detection (line graphs, connected data points)
  if (specStr.includes('"polyline"')) {
    rules.push(POLYLINE_RENDER_RULES);
  }

  // Always include data accuracy rules when any dataviz rule is loaded
  if (rules.length > 0) {
    rules.unshift(DATA_ACCURACY_RULES);
  }

  return rules;
}

module.exports = { getDatavizRules };
