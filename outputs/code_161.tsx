import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const posX = 0;
const posY = 0;
const color = "#1E88E5";
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rot = interpolate(frame, [30, 90], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const widthA = interpolate(frame, [90, 135], [120, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const widthB = interpolate(frame, [135, 180], [180, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let width = 120;
if (frame <= 135) {
  width = widthA;
} else {
  width = widthB;
}
const heightA = interpolate(frame, [90, 135], [120, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightB = interpolate(frame, [135, 180], [180, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let height = 120;
if (frame <= 135) {
  height = heightA;
} else {
  height = heightB;
}
const blurUp = interpolate(frame, [180, 210], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const spreadUp = interpolate(frame, [180, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const blurDown = interpolate(frame, [210, 240], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const spreadDown = interpolate(frame, [210, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let blur = 0;
let spread = 0;
if (frame <= 210) {
  blur = blurUp;
  spread = spreadUp;
} else {
  blur = blurDown;
  spread = spreadDown;
}
const boxShadow = "0px 0px " + blur + "px " + spread + "px " + color;
return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) translateX(" + posX + "px) translateY(" + posY + "px) rotate(" + rot + "deg)", width: width + "px", height: height + "px", backgroundColor: color, opacity: opacity, boxShadow: boxShadow }} />
  </AbsoluteFill>
);
};
