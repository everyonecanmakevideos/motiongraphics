import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const fadeStart = 0;
const fadeEnd = 30;
const rotStart = 30;
const rotEnd = 180;
const circlePosX = 0;
const circlePosY = 0;
const circleDiameter = 160;
const circleBaseRot = 0;
const lineWidth = 160;
const lineHeight = 6;
const linePosX = 0;
const linePosY = 0;
const line1BaseRot = 0;
const line2BaseRot = 90;
const line3BaseRot = 45;
const line4BaseRot = -45;
const circleOpacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const line1Opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const line2Opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const line3Opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const line4Opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotationAnim = interpolate(frame, [rotStart, rotEnd], [0, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const circleRotation = circleBaseRot + rotationAnim;
const line1Rotation = line1BaseRot + rotationAnim;
const line2Rotation = line2BaseRot + rotationAnim;
const line3Rotation = line3BaseRot + rotationAnim;
const line4Rotation = line4BaseRot + rotationAnim;
return (
<AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: circleDiameter + "px",
    height: circleDiameter + "px",
    borderRadius: "50%",
    backgroundColor: "#212121",
    transform: "translate(-50%, -50%) translateX(" + circlePosX + "px) translateY(" + circlePosY + "px) rotate(" + circleRotation + "deg)",
    opacity: circleOpacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: lineWidth + "px",
    height: lineHeight + "px",
    backgroundColor: "#616161",
    transform: "translate(-50%, -50%) translateX(" + linePosX + "px) translateY(" + linePosY + "px) rotate(" + line1Rotation + "deg)",
    opacity: line1Opacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: lineWidth + "px",
    height: lineHeight + "px",
    backgroundColor: "#616161",
    transform: "translate(-50%, -50%) translateX(" + linePosX + "px) translateY(" + linePosY + "px) rotate(" + line2Rotation + "deg)",
    opacity: line2Opacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: lineWidth + "px",
    height: lineHeight + "px",
    backgroundColor: "#616161",
    transform: "translate(-50%, -50%) translateX(" + linePosX + "px) translateY(" + linePosY + "px) rotate(" + line3Rotation + "deg)",
    opacity: line3Opacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: lineWidth + "px",
    height: lineHeight + "px",
    backgroundColor: "#616161",
    transform: "translate(-50%, -50%) translateX(" + linePosX + "px) translateY(" + linePosY + "px) rotate(" + line4Rotation + "deg)",
    opacity: line4Opacity
  }} />
</AbsoluteFill>
);
};
