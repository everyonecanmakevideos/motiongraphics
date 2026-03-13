import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const fps = 30;
const startCurrentText = 0 * fps;
const endCurrentText = 1 * fps;
const startArcDraw = 1 * fps;
const endArcDraw = 4 * fps;
const startGlow = 4 * fps;
const endGlow = 6 * fps;
const canvasBg = "#1A237E";

// current_speed_text animation
const currentTextOpacity = interpolate(frame, [startCurrentText, endCurrentText], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// gauge_arc strokeDash animation (degrees)
const arcDegrees = interpolate(frame, [startArcDraw, endArcDraw], [0, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// show arc opacity while drawing
const arcOpacity = interpolate(frame, [startArcDraw, endArcDraw], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// glow animation for gauge_arc
const glowBlur = interpolate(frame, [startGlow, endGlow], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowSpread = interpolate(frame, [startGlow, endGlow], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowColor = "#00E5FF";
const arcBoxShadow = "0px 0px " + glowBlur + "px " + glowSpread + "px " + glowColor;

// speed_number counter
const counterVal = interpolate(frame, [startArcDraw, endArcDraw], [0, 85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const displayedCounter = Math.round(counterVal);

// Common positions
const gaugePosX = 0;
const gaugePosY = 0;

// gauge dimensions and stroke
const gaugeDiameter = 260;
const gaugeRadius = gaugeDiameter / 2;
const trackStrokeWidth = 3;
const arcStrokeWidth = 3;

// Styles for centering transform strings
const gaugeTransform = "translate(-50%, -50%) translateX(" + gaugePosX + "px) translateY(" + gaugePosY + "px)";

return (
  <AbsoluteFill style={{ backgroundColor: canvasBg, overflow: "hidden" }}>
    {/* Gauge Track (static circle) */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: gaugeDiameter + "px",
        height: gaugeDiameter + "px",
        borderRadius: "50%",
        border: trackStrokeWidth + "px solid " + "#B0BEC5",
        boxSizing: "border-box",
        transform: gaugeTransform,
        pointerEvents: "none",
        userSelect: "none"
      }}
    />

    {/* Gauge Arc (animated stroke using conic-gradient mask) */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: gaugeDiameter + "px",
        height: gaugeDiameter + "px",
        borderRadius: "50%",
        backgroundColor: "transparent",
        border: arcStrokeWidth + "px solid " + "#00E5FF",
        boxSizing: "border-box",
        transform: gaugeTransform,
        opacity: arcOpacity,
        maskImage: "conic-gradient(from -90deg, black " + arcDegrees + "deg, transparent " + arcDegrees + "deg)",
        WebkitMaskImage: "conic-gradient(from -90deg, black " + arcDegrees + "deg, transparent " + arcDegrees + "deg)",
        boxShadow: arcBoxShadow,
        pointerEvents: "none",
        userSelect: "none"
      }}
    />

    {/* Current Speed Text */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + -150 + "px)",
        color: "#FFFFFF",
        fontSize: 24 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: currentTextOpacity
      }}
    >
      {"Current Speed"}
    </div>

    {/* Speed Number (animated counter) */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 0 + "px)",
        color: "#FFFFFF",
        fontSize: 48 + "px",
        fontWeight: "normal",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none"
      }}
    >
      {displayedCounter}
    </div>
  </AbsoluteFill>
);
};
