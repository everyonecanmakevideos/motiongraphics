import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const bgColor = "#00BCD4";

// Circle sizes and positions
const d1 = 80;
const d2 = 80;
const d3 = 80;
const d4 = 80;
const d5 = 80;
const d6 = 80;
const d7 = 80;
const d8 = 80;
const d9 = 80;
const d10 = 80;

const pos1x = 0;
const pos1y = -405;
const pos2x = 0;
const pos2y = -315;
const pos3x = 0;
const pos3y = -225;
const pos4x = 0;
const pos4y = -135;
const pos5x = 0;
const pos5y = -45;
const pos6x = 0;
const pos6y = 45;
const pos7x = 0;
const pos7y = 135;
const pos8x = 0;
const pos8y = 225;
const pos9x = 0;
const pos9y = 315;
const pos10x = 0;
const pos10y = 405;

let c1Opacity = 1;
if (frame < 30) {
  c1Opacity = 1;
} else if (frame <= 90) {
  c1Opacity = interpolate(frame, [30, 90], [1, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c1Opacity = interpolate(frame, [90, 150], [0.9, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c1Opacity = interpolate(frame, [150, 210], [0.8, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c1Opacity = interpolate(frame, [210, 240], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c1Opacity = 1;
}

let c2Opacity = 0.9;
if (frame < 30) {
  c2Opacity = 0.9;
} else if (frame <= 90) {
  c2Opacity = interpolate(frame, [30, 90], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c2Opacity = interpolate(frame, [90, 150], [1, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c2Opacity = interpolate(frame, [150, 210], [0.9, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c2Opacity = interpolate(frame, [210, 240], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c2Opacity = 1;
}

let c3Opacity = 0.8;
if (frame < 30) {
  c3Opacity = 0.8;
} else if (frame <= 90) {
  c3Opacity = interpolate(frame, [30, 90], [0.8, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c3Opacity = interpolate(frame, [90, 150], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c3Opacity = interpolate(frame, [150, 210], [1, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c3Opacity = interpolate(frame, [210, 240], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c3Opacity = 1;
}

let c4Opacity = 0.7;
if (frame < 30) {
  c4Opacity = 0.7;
} else if (frame <= 90) {
  c4Opacity = interpolate(frame, [30, 90], [0.7, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c4Opacity = interpolate(frame, [90, 150], [0.8, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c4Opacity = interpolate(frame, [150, 210], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c4Opacity = interpolate(frame, [210, 240], [1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c4Opacity = 1;
}

let c5Opacity = 0.6;
if (frame < 30) {
  c5Opacity = 0.6;
} else if (frame <= 90) {
  c5Opacity = interpolate(frame, [30, 90], [0.6, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c5Opacity = interpolate(frame, [90, 150], [0.7, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c5Opacity = interpolate(frame, [150, 210], [0.8, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c5Opacity = interpolate(frame, [210, 240], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c5Opacity = 1;
}

let c6Opacity = 0.5;
if (frame < 30) {
  c6Opacity = 0.5;
} else if (frame <= 90) {
  c6Opacity = interpolate(frame, [30, 90], [0.5, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c6Opacity = interpolate(frame, [90, 150], [0.6, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c6Opacity = interpolate(frame, [150, 210], [0.7, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c6Opacity = interpolate(frame, [210, 240], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c6Opacity = 1;
}

let c7Opacity = 0.4;
if (frame < 30) {
  c7Opacity = 0.4;
} else if (frame <= 90) {
  c7Opacity = interpolate(frame, [30, 90], [0.4, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c7Opacity = interpolate(frame, [90, 150], [0.5, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c7Opacity = interpolate(frame, [150, 210], [0.6, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c7Opacity = interpolate(frame, [210, 240], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c7Opacity = 1;
}

let c8Opacity = 0.3;
if (frame < 30) {
  c8Opacity = 0.3;
} else if (frame <= 90) {
  c8Opacity = interpolate(frame, [30, 90], [0.3, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c8Opacity = interpolate(frame, [90, 150], [0.4, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c8Opacity = interpolate(frame, [150, 210], [0.5, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c8Opacity = interpolate(frame, [210, 240], [0.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c8Opacity = 1;
}

let c9Opacity = 0.2;
if (frame < 30) {
  c9Opacity = 0.2;
} else if (frame <= 90) {
  c9Opacity = interpolate(frame, [30, 90], [0.2, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c9Opacity = interpolate(frame, [90, 150], [0.3, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c9Opacity = interpolate(frame, [150, 210], [0.4, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c9Opacity = interpolate(frame, [210, 240], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c9Opacity = 1;
}

let c10Opacity = 0.1;
if (frame < 30) {
  c10Opacity = 0.1;
} else if (frame <= 90) {
  c10Opacity = interpolate(frame, [30, 90], [0.1, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 150) {
  c10Opacity = interpolate(frame, [90, 150], [0.2, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 210) {
  c10Opacity = interpolate(frame, [150, 210], [0.3, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else if (frame <= 240) {
  c10Opacity = interpolate(frame, [210, 240], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  c10Opacity = 1;
}

return (
  <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos1x + "px) translateY(" + pos1y + "px)",
      width: d1 + "px",
      height: d1 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c1Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos2x + "px) translateY(" + pos2y + "px)",
      width: d2 + "px",
      height: d2 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c2Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos3x + "px) translateY(" + pos3y + "px)",
      width: d3 + "px",
      height: d3 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c3Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos4x + "px) translateY(" + pos4y + "px)",
      width: d4 + "px",
      height: d4 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c4Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos5x + "px) translateY(" + pos5y + "px)",
      width: d5 + "px",
      height: d5 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c5Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos6x + "px) translateY(" + pos6y + "px)",
      width: d6 + "px",
      height: d6 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c6Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos7x + "px) translateY(" + pos7y + "px)",
      width: d7 + "px",
      height: d7 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c7Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos8x + "px) translateY(" + pos8y + "px)",
      width: d8 + "px",
      height: d8 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c8Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos9x + "px) translateY(" + pos9y + "px)",
      width: d9 + "px",
      height: d9 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c9Opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(" + pos10x + "px) translateY(" + pos10y + "px)",
      width: d10 + "px",
      height: d10 + "px",
      borderRadius: "50%",
      backgroundColor: "#00BCD4",
      opacity: c10Opacity
    }} />
  </AbsoluteFill>
);
};
