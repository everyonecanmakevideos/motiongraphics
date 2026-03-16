import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Timeline frames (rounded to integers)
const startOpacityStart = Math.round(0 * 30);
const startOpacityEnd = Math.round(0.5 * 30);

const scalePhase1Start = Math.round(0.5 * 30);
const scalePhase1End = Math.round(1.75 * 30);
const scalePhase2Start = Math.round(1.75 * 30);
const scalePhase2End = Math.round(3 * 30);

const highlightScaleXStart = Math.round(3 * 30);
const highlightScaleXEnd = Math.round(4.25 * 30);

const underlineOpacityStart = Math.round(0 * 30);
const underlineOpacityEnd = Math.round(0.5 * 30);
const underlineWidthStart = Math.round(4.25 * 30);
const underlineWidthEnd = Math.round(5.5 * 30);

// Interpolations
const startOpacity = interpolate(frame, [startOpacityStart, startOpacityEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const scalePhase1 = interpolate(frame, [scalePhase1Start, scalePhase1End], [0, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scalePhase2 = interpolate(frame, [scalePhase2Start, scalePhase2End], [1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let startScale = scalePhase2;
if (frame < scalePhase1End) {
  startScale = scalePhase1;
}

const highlightOpacity = interpolate(frame, [startOpacityStart, startOpacityEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const highlightScaleX = interpolate(frame, [highlightScaleXStart, highlightScaleXEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const underlineOpacity = interpolate(frame, [underlineOpacityStart, underlineOpacityEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const underlineW = interpolate(frame, [underlineWidthStart, underlineWidthEnd], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Object specs
const startPosX = 0;
const startPosY = 0;

// Parent container (uses highlight size to define container)
const containerWidth = 520;
const containerHeight = 120;

// Highlight child offsets
const highlightOffsetX = 0;
const highlightOffsetY = 0;

// Underline child offsets (will use pixel-based translation for width animation)
const underlineOffsetX = 0;
const underlineOffsetY = 58;
const underlineFinalWidth = 360;
const underlineHalf = underlineFinalWidth / 2;

return (
  <AbsoluteFill style={{ backgroundColor: "#1A1A2E", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + startPosX + "px) translateY(" + startPosY + "px) scale(" + startScale + ")", width: containerWidth + "px", height: containerHeight + "px", display: "block", opacity: startOpacity, zIndex: 3 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + highlightOffsetX + "px) translateY(" + highlightOffsetY + "px) scaleX(" + highlightScaleX + ")", transformOrigin: "0% 50%", width: "520px", height: "120px", backgroundColor: "#2196F3", borderRadius: "18px", opacity: highlightOpacity, zIndex: 1 }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 3, pointerEvents: "none", userSelect: "none" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: "#E53935", fontSize: "72px", fontWeight: "bold", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none" }}>
          START
        </div>
      </div>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: underlineW + "px", height: "4px", backgroundColor: "#4CAF50", borderRadius: "2px", transform: "translateX(-" + underlineHalf + "px) translateY(-50%) translateX(" + underlineOffsetX + "px) translateY(" + underlineOffsetY + "px)", transformOrigin: "0% 50%", opacity: underlineOpacity, zIndex: 2 }} />
    </div>
  </AbsoluteFill>
);
};
