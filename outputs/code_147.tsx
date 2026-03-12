import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const s0 = 0;
const e0 = 45;
const s1 = 45;
const e1 = 90;
const s2 = 90;
const e2 = 135;
const s3 = 135;
const e3 = 180;
const s4 = 180;
const e4 = 225;
const s5 = 225;
const e5 = 270;
let r = 255;
let g = 255;
let b = 255;
// segment 0: #FFFFFF -> #FF0000
if (frame >= s0 && frame <= e0) {
  r = interpolate(frame, [s0, e0], [255, 255], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s0, e0], [255, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s0, e0], [255, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e0 && frame <= e1) {
  // segment 1: #FF0000 -> #FFA500
  r = interpolate(frame, [s1, e1], [255, 255], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s1, e1], [0, 165], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s1, e1], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e1 && frame <= e2) {
  // segment 2: #FFA500 -> #FFFF00
  r = interpolate(frame, [s2, e2], [255, 255], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s2, e2], [165, 255], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s2, e2], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e2 && frame <= e3) {
  // segment 3: #FFFF00 -> #008000
  r = interpolate(frame, [s3, e3], [255, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s3, e3], [255, 128], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s3, e3], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e3 && frame <= e4) {
  // segment 4: #008000 -> #0000FF
  r = interpolate(frame, [s4, e4], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s4, e4], [128, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s4, e4], [0, 255], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e4 && frame <= e5) {
  // segment 5: #0000FF -> #800080
  r = interpolate(frame, [s5, e5], [0, 128], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  g = interpolate(frame, [s5, e5], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  b = interpolate(frame, [s5, e5], [255, 128], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame > e5) {
  r = 128;
  g = 0;
  b = 128;
} else {
  // before start
  r = 255;
  g = 255;
  b = 255;
}
const animColor = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
const circlePosX = -180;
const circlePosY = 0;
const circleSize = 140;
const squarePosX = 0;
const squarePosY = 0;
const squareW = 140;
const squareH = 140;
const triPosX = 180;
const triPosY = 0;
const triW = 140;
const triH = 140;
return (
  <AbsoluteFill style={{ backgroundColor: "#D3D3D3", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + circlePosX + "px) translateY(" + circlePosY + "px)",
        width: circleSize,
        height: circleSize,
        borderRadius: "50%",
        backgroundColor: animColor
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + squarePosX + "px) translateY(" + squarePosY + "px)",
        width: squareW,
        height: squareH,
        backgroundColor: animColor
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + triPosX + "px) translateY(" + triPosY + "px)",
        width: triW,
        height: triH,
        backgroundColor: animColor,
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
      }}
    />
  </AbsoluteFill>
);
};
