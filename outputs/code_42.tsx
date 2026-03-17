import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Timeline frame ranges
const xAxisStart = 0;
const xAxisEnd = 30;
const yAxisStart = 0;
const yAxisEnd = 30;
const labelsStart = 0;
const labelsEnd = 30;

const markerJanStart = 30;
const markerJanEnd = 45;
const markerFebStart = 45;
const markerFebEnd = 60;
const markerMarStart = 60;
const markerMarEnd = 75;
const markerAprStart = 75;
const markerAprEnd = 90;

const lineStart = 90;
const lineEnd = 150;

const sparkle1InStart = 150;
const sparkle1InEnd = 165;
const sparkle1OutStart = 165;
const sparkle1OutEnd = 180;

const sparkle2InStart = 180;
const sparkle2InEnd = 195;
const sparkle2OutStart = 195;
const sparkle2OutEnd = 210;

const sparkle3InStart = 210;
const sparkle3InEnd = 225;
const sparkle3OutStart = 225;
const sparkle3OutEnd = 240;

// Interpolations
const xAxisOpacity = interpolate(frame, [xAxisStart, xAxisEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const yAxisOpacity = interpolate(frame, [yAxisStart, yAxisEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const labelJanOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const labelFebOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const labelMarOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const labelAprOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const label5kOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const label8kOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const label12kOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const label20kOpacity = interpolate(frame, [labelsStart, labelsEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const markerJanScale = interpolate(frame, [markerJanStart, markerJanEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerFebScale = interpolate(frame, [markerFebStart, markerFebEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerMarScale = interpolate(frame, [markerMarStart, markerMarEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerAprScale = interpolate(frame, [markerAprStart, markerAprEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const lineOpacity = interpolate(frame, [lineStart, lineEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineExpandPct = interpolate(frame, [lineStart, lineEnd], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineRevealClip = "inset(0 " + (100 - lineExpandPct) + "% 0 0)";

// Sparkle opacities (in then out, combine)
const sparkle1In = interpolate(frame, [sparkle1InStart, sparkle1InEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle1Out = interpolate(frame, [sparkle1OutStart, sparkle1OutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle1Opacity = Math.max(sparkle1In, sparkle1Out);

const sparkle2In = interpolate(frame, [sparkle2InStart, sparkle2InEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle2Out = interpolate(frame, [sparkle2OutStart, sparkle2OutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle2Opacity = Math.max(sparkle2In, sparkle2Out);

const sparkle3In = interpolate(frame, [sparkle3InStart, sparkle3InEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle3Out = interpolate(frame, [sparkle3OutStart, sparkle3OutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const sparkle3Opacity = Math.max(sparkle3In, sparkle3Out);

// Polyline bounding box and SVG calculations (explicit)
const pMinX = -300;
const pMaxX = 150;
const pMinY = 0;
const pMaxY = 180;
const pWidth = pMaxX - pMinX; // 450
const pHeight = pMaxY - pMinY; // 180
const strokeW = 3;
const svgW = pWidth + strokeW * 2; // 456
const svgH = pHeight + strokeW * 2; // 186
const svgLeft = halfW + pMinX - strokeW; // 960 -300 -3 = 657
const svgTop = halfH + pMinY - strokeW; // 540 + 0 -3 = 537

// SVG-local point computations (explicit)
const svgX1 = -300 - pMinX + strokeW; // 3
const svgY1 = 180 - pMinY + strokeW; // 183

const svgX2 = -150 - pMinX + strokeW; // 153
const svgY2 = 100 - pMinY + strokeW; // 103

const svgX3 = 0 - pMinX + strokeW; // 303
const svgY3 = 140 - pMinY + strokeW; // 143

const svgX4 = 150 - pMinX + strokeW; // 453
const svgY4 = 0 - pMinY + strokeW; // 3

const polylinePoints = svgX1 + "," + svgY1 + " " + svgX2 + "," + svgY2 + " " + svgX3 + "," + svgY3 + " " + svgX4 + "," + svgY4;

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    {/* X Axis */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 200 + "px)",
      width: 600 + "px",
      height: 2 + "px",
      backgroundColor: "#333333",
      opacity: xAxisOpacity,
      zIndex: 1
    }} />

    {/* Y Axis */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 0 + "px)",
      width: 2 + "px",
      height: 400 + "px",
      backgroundColor: "#333333",
      opacity: yAxisOpacity,
      zIndex: 1
    }} />

    {/* Labels - Months */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 220 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: labelJanOpacity,
      zIndex: 3
    }}>
      January
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -150 + "px) translateY(" + 220 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: labelFebOpacity,
      zIndex: 3
    }}>
      February
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 220 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: labelMarOpacity,
      zIndex: 3
    }}>
      March
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + 150 + "px) translateY(" + 220 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: labelAprOpacity,
      zIndex: 3
    }}>
      April
    </div>

    {/* Labels - Y axis values */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -320 + "px) translateY(" + 180 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: label5kOpacity,
      zIndex: 3
    }}>
      5k
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -320 + "px) translateY(" + 140 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: label8kOpacity,
      zIndex: 3
    }}>
      8k
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -320 + "px) translateY(" + 100 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: label12kOpacity,
      zIndex: 3
    }}>
      12k
    </div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + -320 + "px) translateY(" + 0 + "px)",
      color: "#666666",
      fontSize: 14 + "px",
      fontWeight: 400,
      fontFamily: "Arial",
      whiteSpace: "nowrap",
      lineHeight: "1",
      letterSpacing: 0 + "px",
      textAlign: "center",
      textTransform: "none",
      userSelect: "none",
      pointerEvents: "none",
      opacity: label20kOpacity,
      zIndex: 3
    }}>
      20k
    </div>

    {/* Polyline wrapper with reveal clip */}
    <div style={{
      position: "absolute",
      left: svgLeft + "px",
      top: svgTop + "px",
      width: svgW + "px",
      height: svgH + "px",
      overflow: "hidden",
      clipPath: lineRevealClip,
      zIndex: 2,
      opacity: lineOpacity
    }}>
      <svg width={svgW} height={svgH} style={{ position: "absolute", left: 0 + "px", top: 0 + "px", overflow: "visible" }}>
        <polyline points={polylinePoints} fill="none" stroke="#2196F3" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>

    {/* Markers */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 10 + "px",
      height: 10 + "px",
      backgroundColor: "#2196F3",
      borderRadius: "50%",
      transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 180 + "px) scale(" + markerJanScale + ")",
      transformOrigin: "50% 50%",
      zIndex: 3
    }} />

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 10 + "px",
      height: 10 + "px",
      backgroundColor: "#2196F3",
      borderRadius: "50%",
      transform: "translate(-50%, -50%) translateX(" + -150 + "px) translateY(" + 100 + "px) scale(" + markerFebScale + ")",
      transformOrigin: "50% 50%",
      zIndex: 3
    }} />

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 10 + "px",
      height: 10 + "px",
      backgroundColor: "#2196F3",
      borderRadius: "50%",
      transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 140 + "px) scale(" + markerMarScale + ")",
      transformOrigin: "50% 50%",
      zIndex: 3
    }} />

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 10 + "px",
      height: 10 + "px",
      backgroundColor: "#2196F3",
      borderRadius: "50%",
      transform: "translate(-50%, -50%) translateX(" + 150 + "px) translateY(" + 0 + "px) scale(" + markerAprScale + ")",
      transformOrigin: "50% 50%",
      zIndex: 3
    }} />

    {/* Sparkles (star clipPath) */}
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 20 + "px",
      height: 20 + "px",
      backgroundColor: "#FFFFFF",
      clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      transform: "translate(-50%, -50%) translateX(" + -225 + "px) translateY(" + 140 + "px)",
      opacity: sparkle1Opacity,
      zIndex: 4
    }} />

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 20 + "px",
      height: 20 + "px",
      backgroundColor: "#FFFFFF",
      clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      transform: "translate(-50%, -50%) translateX(" + -75 + "px) translateY(" + 120 + "px)",
      opacity: sparkle2Opacity,
      zIndex: 4
    }} />

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 20 + "px",
      height: 20 + "px",
      backgroundColor: "#FFFFFF",
      clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      transform: "translate(-50%, -50%) translateX(" + 75 + "px) translateY(" + 70 + "px)",
      opacity: sparkle3Opacity,
      zIndex: 4
    }} />
  </AbsoluteFill>
);
};
