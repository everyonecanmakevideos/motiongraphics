import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacity1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scale1 = interpolate(frame, [0, 30], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotation = interpolate(frame, [30, 90], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const width = interpolate(frame, [90, 150], [160, 320], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const height = interpolate(frame, [150, 180], [160, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity2 = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scale2 = interpolate(frame, [180, 210], [1, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

let finalWidth = width;
let halfWidth = finalWidth / 2;

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translateX(-" + halfWidth + "px) translateY(-50%) rotate(" + rotation + "deg) scale(" + (scale1 * scale2) + ")",
      width: finalWidth + "px",
      height: height + "px",
      backgroundColor: "#8E24AA",
      opacity: opacity1 * opacity2,
      boxSizing: "border-box",
      border: "5px solid #8E24AA"
    }} />
  </AbsoluteFill>
);
};
