import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacity1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity2 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity3 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity4 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const rotation1 = interpolate(frame, [30, 180], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation2 = interpolate(frame, [30, 180], [0, -360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation3 = interpolate(frame, [30, 180], [0, 540], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation4 = interpolate(frame, [30, 180], [0, -720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const rotation1End = interpolate(frame, [180, 240], [180, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation2End = interpolate(frame, [180, 240], [-360, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation3End = interpolate(frame, [180, 240], [540, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation4End = interpolate(frame, [180, 240], [-720, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 360 + "px",
      height: 360 + "px",
      backgroundColor: "#E53935",
      opacity: opacity1,
      transform: "translate(-50%, -50%) rotate(" + rotation1 + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 280 + "px",
      height: 280 + "px",
      backgroundColor: "#1E88E5",
      opacity: opacity2,
      transform: "translate(-50%, -50%) rotate(" + rotation2 + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 200 + "px",
      height: 200 + "px",
      backgroundColor: "#43A047",
      opacity: opacity3,
      transform: "translate(-50%, -50%) rotate(" + rotation3 + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 120 + "px",
      height: 120 + "px",
      backgroundColor: "#FDD835",
      opacity: opacity4,
      transform: "translate(-50%, -50%) rotate(" + rotation4 + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 360 + "px",
      height: 360 + "px",
      backgroundColor: "#E53935",
      opacity: interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: "translate(-50%, -50%) rotate(" + rotation1End + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 280 + "px",
      height: 280 + "px",
      backgroundColor: "#1E88E5",
      opacity: interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: "translate(-50%, -50%) rotate(" + rotation2End + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 200 + "px",
      height: 200 + "px",
      backgroundColor: "#43A047",
      opacity: interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: "translate(-50%, -50%) rotate(" + rotation3End + "deg)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 120 + "px",
      height: 120 + "px",
      backgroundColor: "#FDD835",
      opacity: interpolate(frame, [180, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: "translate(-50%, -50%) rotate(" + rotation4End + "deg)"
    }} />
  </AbsoluteFill>
);
};
