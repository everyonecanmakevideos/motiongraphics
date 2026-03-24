import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Title
const titlePosX = 0;
const titlePosY = -480;
const titleFontSize = 48;
const titleColor = "#000000";
const titleStart = 0;
const titleEnd = 30;
const titleOpacity = interpolate(frame, [titleStart, titleEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Subtitle
const subtitlePosX = 0;
const subtitlePosY = -420;
const subtitleFontSize = 36;
const subtitleColor = "#9E9E9E";
const subtitleStart = 0;
const subtitleEnd = 30;
const subtitleOpacity = interpolate(frame, [subtitleStart, subtitleEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Axes
const xAxisWidth = 800;
const xAxisHeight = 2;
const xAxisPosX = 0;
const xAxisPosY = 300;
const xAxisColor = "#333333";

const yAxisWidth = 2;
const yAxisHeight = 400;
const yAxisPosX = -400;
const yAxisPosY = 0;
const yAxisColor = "#333333";

// Polyline (line_graph)
const polyStartFrame = 30; // 1s
const polyEndFrame = 90; // 3s
const polyOpacity = interpolate(frame, [polyStartFrame, polyEndFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const polyExpand = interpolate(frame, [polyStartFrame, polyEndFrame], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Vertices (explicit)
const v1x = -400;
const v1y = 240;
const v2x = -267;
const v2y = 120;
const v3x = -133;
const v3y = 0;
const v4x = 0;
const v4y = 60;
const v5x = 133;
const v5y = -180;
const v6x = 267;
const v6y = -360;
const v7x = 400;
const v7y = -300;

// Bounding box
const minX = -400;
const maxX = 400;
const minY = -360;
const maxY = 240;

// Stroke
const strokeColor = "#2196F3";
const strokeWidth = 4;

// SVG dimensions and positioning (with stroke padding)
const svgW = (maxX - minX) + strokeWidth * 2; // 800 + 8 = 808
const svgH = (maxY - minY) + strokeWidth * 2; // 600 + 8 = 608
const wrapperLeft = halfW + minX - strokeWidth; // 960 -400 -4 = 556
const wrapperTop = halfH + minY - strokeWidth;  // 540 -360 -4 = 176

// SVG-local coordinates (explicit)
const svgX1 = v1x - minX + strokeWidth; // -400 -(-400) +4 = 4
const svgY1 = v1y - minY + strokeWidth; // 240 -(-360) +4 = 604

const svgX2 = v2x - minX + strokeWidth; // -267 -(-400) +4 = 137
const svgY2 = v2y - minY + strokeWidth; // 120 -(-360) +4 = 484

const svgX3 = v3x - minX + strokeWidth; // -133 -(-400) +4 = 271
const svgY3 = v3y - minY + strokeWidth; // 0 -(-360) +4 = 364

const svgX4 = v4x - minX + strokeWidth; // 0 -(-400) +4 = 404
const svgY4 = v4y - minY + strokeWidth; // 60 -(-360) +4 = 424

const svgX5 = v5x - minX + strokeWidth; // 133 -(-400) +4 = 537
const svgY5 = v5y - minY + strokeWidth; // -180 -(-360) +4 = 184

const svgX6 = v6x - minX + strokeWidth; // 267 -(-400) +4 = 671
const svgY6 = v6y - minY + strokeWidth; // -360 -(-360) +4 = 4

const svgX7 = v7x - minX + strokeWidth; // 400 -(-400) +4 = 804
const svgY7 = v7y - minY + strokeWidth; // -300 -(-360) +4 = 64

const pointsString = svgX1 + "," + svgY1 + " " + svgX2 + "," + svgY2 + " " + svgX3 + "," + svgY3 + " " + svgX4 + "," + svgY4 + " " + svgX5 + "," + svgY5 + " " + svgX6 + "," + svgY6 + " " + svgX7 + "," + svgY7;

// Wrapper width for reveal (clipExpand) — animate from 0 to full svgW
const wrapperWidth = svgW * (polyExpand / 100);

// Highlight point
const hpPosX = 267;
const hpPosY = -360;
const hpDiameter = 16;
const hpColor = "#FF9800";
const hpScaleA = interpolate(frame, [30, 90], [0, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const hpScaleB = interpolate(frame, [90, 180], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let highlightScale = hpScaleA;
if (frame > 90) {
  highlightScale = hpScaleB;
}

// Labels (days)
const labelFontSize = 14;
const labelColor = "#666666";

const labelDay1PosX = -400;
const labelDay1PosY = 320;

const labelDay2PosX = -267;
const labelDay2PosY = 320;

const labelDay3PosX = -133;
const labelDay3PosY = 320;

const labelDay4PosX = 0;
const labelDay4PosY = 320;

const labelDay5PosX = 133;
const labelDay5PosY = 320;

const labelDay6PosX = 267;
const labelDay6PosY = 320;

const labelDay7PosX = 400;
const labelDay7PosY = 320;

const labelUsersPosX = -440;
const labelUsersPosY = -200;

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + titlePosX + "px) translateY(" + titlePosY + "px)", color: titleColor, fontSize: titleFontSize + "px", fontWeight: "bold", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: titleOpacity, zIndex: 6 }}>
      Daily Active Users
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + subtitlePosX + "px) translateY(" + subtitlePosY + "px)", color: subtitleColor, fontSize: subtitleFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: subtitleOpacity, zIndex: 6 }}>
      Week-over-week trend
    </div>

    {/* X Axis */}
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + xAxisPosX + "px) translateY(" + xAxisPosY + "px)", width: xAxisWidth + "px", height: xAxisHeight + "px", backgroundColor: xAxisColor, zIndex: 2 }} />

    {/* Y Axis */}
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + yAxisPosX + "px) translateY(" + yAxisPosY + "px)", width: yAxisWidth + "px", height: yAxisHeight + "px", backgroundColor: yAxisColor, zIndex: 2 }} />

    {/* Polyline wrapper for reveal */}
    <div style={{ position: "absolute", left: wrapperLeft + "px", top: wrapperTop + "px", width: wrapperWidth + "px", height: svgH + "px", overflow: "hidden", zIndex: 3 }}>
      <svg width={svgW + "px"} height={svgH + "px"} style={{ position: "absolute", left: "0px", top: "0px", opacity: polyOpacity, overflow: "visible" }}>
        <polyline points={pointsString} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>

    {/* Highlight point */}
    <div style={{ position: "absolute", left: "50%", top: "50%", width: hpDiameter + "px", height: hpDiameter + "px", backgroundColor: hpColor, borderRadius: "50%", transform: "translate(-50%, -50%) translateX(" + hpPosX + "px) translateY(" + hpPosY + "px) scale(" + highlightScale + ")", transformOrigin: "50% 50%", zIndex: 5 }} />

    {/* Day labels */}
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay1PosX + "px) translateY(" + labelDay1PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 1
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay2PosX + "px) translateY(" + labelDay2PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 2
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay3PosX + "px) translateY(" + labelDay3PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 3
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay4PosX + "px) translateY(" + labelDay4PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 4
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay5PosX + "px) translateY(" + labelDay5PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 5
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay6PosX + "px) translateY(" + labelDay6PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 6
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelDay7PosX + "px) translateY(" + labelDay7PosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Day 7
    </div>

    {/* Users label */}
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + labelUsersPosX + "px) translateY(" + labelUsersPosY + "px)", color: labelColor, fontSize: labelFontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", zIndex: 6 }}>
      Users
    </div>
  </AbsoluteFill>
);
};
