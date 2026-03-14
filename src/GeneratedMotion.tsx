import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { Asset } from "./assets/Asset";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const lbPosX = 0;
const lbPosY = 0;
const lbSizeW = 120;
const lbSizeH = 120;
const lbStrokeColor = "#000000";
const lbStrokeWidth = 2;
const lbStroke1 = interpolate(frame, [0, 30], [0, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lbStroke2 = interpolate(frame, [30, 120], [50, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let lbStroke = lbStroke1;
if (frame > 30) {
  lbStroke = lbStroke2;
}
const lbDegrees = lbStroke * 3.6;
const glowPosX = 0;
const glowPosY = 0;
const glowDiameter = 100;
const glowOpacity = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowScaleA = interpolate(frame, [150, 180], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const glowScaleB = interpolate(frame, [180, 210], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let glowScale = 1;
if (frame <= 150) {
  glowScale = 1;
} else if (frame <= 180) {
  glowScale = glowScaleA;
} else {
  glowScale = glowScaleB;
}
return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <Asset id={"lightbulb"} width={lbSizeW} height={lbSizeH} color={"#FFFFFF"} stroke={lbStrokeColor} strokeWidth={lbStrokeWidth}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + lbPosX + "px) translateY(" + lbPosY + "px)"
      }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + lbPosX + "px) translateY(" + lbPosY + "px)",
      width: lbSizeW + "px",
      height: lbSizeH + "px",
      borderRadius: "50%",
      backgroundColor: "transparent",
      border: lbStrokeWidth + "px solid " + lbStrokeColor,
      boxSizing: "border-box",
      maskImage: "conic-gradient(from -90deg, black " + lbDegrees + "deg, transparent " + lbDegrees + "deg)",
      WebkitMaskImage: "conic-gradient(from -90deg, black " + lbDegrees + "deg, transparent " + lbDegrees + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + glowPosX + "px) translateY(" + glowPosY + "px) scale(" + glowScale + ")",
      width: glowDiameter + "px",
      height: glowDiameter + "px",
      borderRadius: "50%",
      backgroundColor: "#FDD835",
      opacity: glowOpacity,
      pointerEvents: "none"
    }} />
  </AbsoluteFill>
);
};
