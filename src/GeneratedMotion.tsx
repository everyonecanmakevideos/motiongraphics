import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
// Text object base properties
const textColor = "#FFFFFF";
const fontSize = 48;
const fontWeight = "bold";
const fontFamily = "Arial";
const posY = 0;
// X animation: 0s (0f) -> 1s (30f): -1080 -> 0
const x = interpolate(frame, [0, 30], [-1080, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Glow animation: 1s (30f) -> 3s (90f): blur 0->10, spread 0->1, color stays #FFFFFF
const glowBlur = interpolate(frame, [30, 90], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowSpread = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowColor = "#FFFFFF";
const boxShadow = "0px 0px " + glowBlur + "px " + glowSpread + "px " + glowColor;
// Scale animation: 3s (90f) -> 3.5s (105f): 1 -> 1.2 ; 3.5s (105f) -> 4s (120f): 1.2 -> 1
const scaleUp = interpolate(frame, [90, 105], [1, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scaleDown = interpolate(frame, [105, 120], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let scale = 1;
if (frame <= 105) {
  scale = scaleUp;
} else {
  scale = scaleDown;
}
// Opacity animation: 4s (120f) -> 5s (150f): 1 -> 0
const opacity = interpolate(frame, [120, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
return (
  <AbsoluteFill style={{ backgroundColor: "#0F0F23", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + x + "px) translateY(" + posY + "px) scale(" + scale + ")",
        color: textColor,
        fontSize: fontSize + "px",
        fontWeight: fontWeight,
        fontFamily: fontFamily,
        whiteSpace: "nowrap",
        lineHeight: 1,
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        boxShadow: boxShadow,
        opacity: opacity,
        zIndex: 1
      }}
    >
      FAST
    </div>
  </AbsoluteFill>
);
};
