import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const cw = 1920;
const ch = 1080;
const halfW = cw / 2;
const halfH = ch / 2;

// Title animation (0s - 1s) frames 0 - 30
const titleStart = 0;
const titleEnd = 30;
const titleOpacity = interpolate(frame, [titleStart, titleEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Subtitle animation (0s - 1s) frames 0 - 30
const subtitleStart = 0;
const subtitleEnd = 30;
const subtitleOpacity = interpolate(frame, [subtitleStart, subtitleEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Axes animations (1s - 2s) frames 30 - 60
const axesStart = 30;
const axesEnd = 60;
const xAxisOpacity = interpolate(frame, [axesStart, axesEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const yAxisOpacity = interpolate(frame, [axesStart, axesEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Line graph animation (2s - 4s) frames 60 - 120
const lineStart = 60;
const lineEnd = 120;
const lineOpacity = interpolate(frame, [lineStart, lineEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const clipExpand = interpolate(frame, [lineStart, lineEnd], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineRevealClip = "inset(0 " + (100 - clipExpand) + "% 0 0)";

// Marker pop-in animations (1s - 2s) frames 30 - 60
const mStart = 30;
const mEnd = 60;
const markerScale1 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale2 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale3 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale4 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale5 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale6 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const markerScale7 = interpolate(frame, [mStart, mEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Marker 6 glow animation (2s - 4s) frames 60 - 120
const glowStart = 60;
const glowEnd = 120;
const m6_blur = interpolate(frame, [glowStart, glowEnd], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const m6_spread = interpolate(frame, [glowStart, glowEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const m6_glowColor = "#FDD835";
const m6_boxShadow = "0px 0px " + m6_blur + "px " + m6_spread + "px " + m6_glowColor;

// Polyline SVG calculations
const minX = -300;
const maxX = 300;
const minY = -200;
const maxY = 240;
const polyWidth = maxX - minX;
const polyHeight = maxY - minY;
const strokeWidth = 4;
const svgW = polyWidth + strokeWidth * 2;
const svgH = polyHeight + strokeWidth * 2;
const svgLeft = halfW + minX - strokeWidth;
const svgTop = halfH + minY - strokeWidth;

// Explicit vertex to SVG-local coordinate computations
const svgX1 = -300 - minX + strokeWidth;
const svgY1 = 240 - minY + strokeWidth;
const svgX2 = -200 - minX + strokeWidth;
const svgY2 = 140 - minY + strokeWidth;
const svgX3 = -100 - minX + strokeWidth;
const svgY3 = 60 - minY + strokeWidth;
const svgX4 = 0 - minX + strokeWidth;
const svgY4 = 100 - minY + strokeWidth;
const svgX5 = 100 - minX + strokeWidth;
const svgY5 = -100 - minY + strokeWidth;
const svgX6 = 200 - minX + strokeWidth;
const svgY6 = -200 - minY + strokeWidth;
const svgX7 = 300 - minX + strokeWidth;
const svgY7 = -160 - minY + strokeWidth;

const polyPoints = svgX1 + "," + svgY1 + " " + svgX2 + "," + svgY2 + " " + svgX3 + "," + svgY3 + " " + svgX4 + "," + svgY4 + " " + svgX5 + "," + svgY5 + " " + svgX6 + "," + svgY6 + " " + svgX7 + "," + svgY7;

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + -480 + "px)", color: "#000000", fontSize: 48 + "px", fontWeight: "bold", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: titleOpacity, zIndex: 5 }}>Daily Active Users</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + -420 + "px)", color: "#9E9E9E", fontSize: 36 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: subtitleOpacity, zIndex: 5 }}>Week-over-week trend</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 200 + "px)", width: 600 + "px", height: 2 + "px", backgroundColor: "#333333", opacity: xAxisOpacity, pointerEvents: "none", zIndex: 2 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 0 + "px)", width: 2 + "px", height: 400 + "px", backgroundColor: "#333333", opacity: yAxisOpacity, pointerEvents: "none", zIndex: 2 }} />

    <div style={{ position: "absolute", left: 0 + "px", top: 0 + "px", width: "100%", height: "100%", overflow: "hidden", clipPath: lineRevealClip, opacity: lineOpacity, zIndex: 3 }}>
      <svg width={svgW} height={svgH} style={{ position: "absolute", left: svgLeft + "px", top: svgTop + "px", overflow: "visible" }}>
        <polyline points={polyPoints} fill="none" stroke="#2196F3" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 240 + "px) scale(" + markerScale1 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -200 + "px) translateY(" + 140 + "px) scale(" + markerScale2 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -100 + "px) translateY(" + 60 + "px) scale(" + markerScale3 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 100 + "px) scale(" + markerScale4 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 100 + "px) translateY(" + -100 + "px) scale(" + markerScale5 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 200 + "px) translateY(" + -200 + "px) scale(" + markerScale6 + ")", width: 14 + "px", height: 14 + "px", backgroundColor: "#2196F3", borderRadius: "50%", boxShadow: m6_boxShadow, pointerEvents: "none", zIndex: 5 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 300 + "px) translateY(" + -160 + "px) scale(" + markerScale7 + ")", width: 10 + "px", height: 10 + "px", backgroundColor: "#2196F3", borderRadius: "50%", pointerEvents: "none", zIndex: 4 }} />

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -300 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 1</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -200 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 2</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + -100 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 3</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 4</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 100 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 5</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 200 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 6</div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 300 + "px) translateY(" + 220 + "px)", color: "#666666", fontSize: 14 + "px", fontWeight: "normal", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: xAxisOpacity, zIndex: 4 }}>Day 7</div>
  </AbsoluteFill>
);
};
