import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
// Circle (circle_1) properties
const circleDiameter = 200;
const circleBaseX = 0;
const circleBaseY = 0;
const circleAppearStart = 0;
const circleAppearEnd = 60; // 2s * 30
const circleFadeStart = 300; // 10s * 30
const circleFadeEnd = 360; // 12s * 30
const circleAppear = interpolate(frame, [circleAppearStart, circleAppearEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const circleFade = interpolate(frame, [circleFadeStart, circleFadeEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let circleOpacity = circleAppear * circleFade;
// Circle scale animation in two segments
const circleScaleA = interpolate(frame, [0, 30], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const circleScaleB = interpolate(frame, [30, 60], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let circleScale = circleScaleA;
if (frame >= 30) {
  circleScale = circleScaleB;
}

// Triangle base positions and initial rotations
const t1_baseX = 240;
const t1_baseY = 0;
const t1_initRot = 0;
const t2_baseX = 169.71;
const t2_baseY = 169.71;
const t2_initRot = 45;
const t3_baseX = 0;
const t3_baseY = 240;
const t3_initRot = 90;
const t4_baseX = -169.71;
const t4_baseY = 169.71;
const t4_initRot = 135;
const t5_baseX = -240;
const t5_baseY = 0;
const t5_initRot = 180;
const t6_baseX = -169.71;
const t6_baseY = -169.71;
const t6_initRot = 225;
const t7_baseX = 0;
const t7_baseY = -240;
const t7_initRot = 270;
const t8_baseX = 169.71;
const t8_baseY = -169.71;
const t8_initRot = 315;

// Appear timings (frames)
const t1_appear = interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_appear = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_appear = interpolate(frame, [90, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t4_appear = interpolate(frame, [105, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t5_appear = interpolate(frame, [120, 135], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t6_appear = interpolate(frame, [135, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t7_appear = interpolate(frame, [150, 165], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t8_appear = interpolate(frame, [165, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Fade out for all triangles 10-12s
const trianglesFade = interpolate(frame, [300, 360], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Combined opacities
const t1_opacity = t1_appear * trianglesFade;
const t2_opacity = t2_appear * trianglesFade;
const t3_opacity = t3_appear * trianglesFade;
const t4_opacity = t4_appear * trianglesFade;
const t5_opacity = t5_appear * trianglesFade;
const t6_opacity = t6_appear * trianglesFade;
const t7_opacity = t7_appear * trianglesFade;
const t8_opacity = t8_appear * trianglesFade;

// Rotation animations (6-8s => frames 180-240)
const rotStartFrame = 180;
const rotEndFrame = 240;
const t1_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t1_initRot, t1_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t2_initRot, t2_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t3_initRot, t3_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t4_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t4_initRot, t4_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t5_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t5_initRot, t5_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t6_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t6_initRot, t6_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t7_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t7_initRot, t7_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t8_rot = interpolate(frame, [rotStartFrame, rotEndFrame], [t8_initRot, t8_initRot + 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Orbit animations (8-10s => frames 240-300)
const orbitStart = 240;
const orbitEnd = 300;
const orbitCenterX = 0;
const orbitCenterY = 0;
const orbitRadius = 240;
const orbitDegrees = 90;
// Start angles based on base positions
const t1_startAngle = Math.atan2(t1_baseY, t1_baseX) * 180 / Math.PI;
const t2_startAngle = Math.atan2(t2_baseY, t2_baseX) * 180 / Math.PI;
const t3_startAngle = Math.atan2(t3_baseY, t3_baseX) * 180 / Math.PI;
const t4_startAngle = Math.atan2(t4_baseY, t4_baseX) * 180 / Math.PI;
const t5_startAngle = Math.atan2(t5_baseY, t5_baseX) * 180 / Math.PI;
const t6_startAngle = Math.atan2(t6_baseY, t6_baseX) * 180 / Math.PI;
const t7_startAngle = Math.atan2(t7_baseY, t7_baseX) * 180 / Math.PI;
const t8_startAngle = Math.atan2(t8_baseY, t8_baseX) * 180 / Math.PI;
const t1_angle = interpolate(frame, [orbitStart, orbitEnd], [t1_startAngle, t1_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_angle = interpolate(frame, [orbitStart, orbitEnd], [t2_startAngle, t2_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_angle = interpolate(frame, [orbitStart, orbitEnd], [t3_startAngle, t3_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t4_angle = interpolate(frame, [orbitStart, orbitEnd], [t4_startAngle, t4_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t5_angle = interpolate(frame, [orbitStart, orbitEnd], [t5_startAngle, t5_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t6_angle = interpolate(frame, [orbitStart, orbitEnd], [t6_startAngle, t6_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t7_angle = interpolate(frame, [orbitStart, orbitEnd], [t7_startAngle, t7_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t8_angle = interpolate(frame, [orbitStart, orbitEnd], [t8_startAngle, t8_startAngle + orbitDegrees], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Convert to radians and compute orbit positions
const t1_rad = t1_angle * Math.PI / 180;
const t2_rad = t2_angle * Math.PI / 180;
const t3_rad = t3_angle * Math.PI / 180;
const t4_rad = t4_angle * Math.PI / 180;
const t5_rad = t5_angle * Math.PI / 180;
const t6_rad = t6_angle * Math.PI / 180;
const t7_rad = t7_angle * Math.PI / 180;
const t8_rad = t8_angle * Math.PI / 180;
const t1_orbX = orbitCenterX + orbitRadius * Math.cos(t1_rad);
const t1_orbY = orbitCenterY + orbitRadius * Math.sin(t1_rad);
const t2_orbX = orbitCenterX + orbitRadius * Math.cos(t2_rad);
const t2_orbY = orbitCenterY + orbitRadius * Math.sin(t2_rad);
const t3_orbX = orbitCenterX + orbitRadius * Math.cos(t3_rad);
const t3_orbY = orbitCenterY + orbitRadius * Math.sin(t3_rad);
const t4_orbX = orbitCenterX + orbitRadius * Math.cos(t4_rad);
const t4_orbY = orbitCenterY + orbitRadius * Math.sin(t4_rad);
const t5_orbX = orbitCenterX + orbitRadius * Math.cos(t5_rad);
const t5_orbY = orbitCenterY + orbitRadius * Math.sin(t5_rad);
const t6_orbX = orbitCenterX + orbitRadius * Math.cos(t6_rad);
const t6_orbY = orbitCenterY + orbitRadius * Math.sin(t6_rad);
const t7_orbX = orbitCenterX + orbitRadius * Math.cos(t7_rad);
const t7_orbY = orbitCenterY + orbitRadius * Math.sin(t7_rad);
const t8_orbX = orbitCenterX + orbitRadius * Math.cos(t8_rad);
const t8_orbY = orbitCenterY + orbitRadius * Math.sin(t8_rad);

// Position animations 10-12s (frames 300-360) from base pos to center
const posAnimStart = 300;
const posAnimEnd = 360;
const t1_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t1_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t1_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t1_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t2_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t2_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t3_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t3_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t4_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t4_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t4_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t4_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t5_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t5_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t5_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t5_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t6_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t6_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t6_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t6_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t7_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t7_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t7_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t7_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t8_posXAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t8_baseX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t8_posYAnim = interpolate(frame, [posAnimStart, posAnimEnd], [t8_baseY, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Determine actual draw positions for triangles based on orbit or pos animation
let t1_drawX = t1_baseX;
let t1_drawY = t1_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t1_drawX = t1_orbX;
  t1_drawY = t1_orbY;
} else if (frame >= posAnimStart) {
  t1_drawX = t1_posXAnim;
  t1_drawY = t1_posYAnim;
}

let t2_drawX = t2_baseX;
let t2_drawY = t2_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t2_drawX = t2_orbX;
  t2_drawY = t2_orbY;
} else if (frame >= posAnimStart) {
  t2_drawX = t2_posXAnim;
  t2_drawY = t2_posYAnim;
}

let t3_drawX = t3_baseX;
let t3_drawY = t3_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t3_drawX = t3_orbX;
  t3_drawY = t3_orbY;
} else if (frame >= posAnimStart) {
  t3_drawX = t3_posXAnim;
  t3_drawY = t3_posYAnim;
}

let t4_drawX = t4_baseX;
let t4_drawY = t4_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t4_drawX = t4_orbX;
  t4_drawY = t4_orbY;
} else if (frame >= posAnimStart) {
  t4_drawX = t4_posXAnim;
  t4_drawY = t4_posYAnim;
}

let t5_drawX = t5_baseX;
let t5_drawY = t5_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t5_drawX = t5_orbX;
  t5_drawY = t5_orbY;
} else if (frame >= posAnimStart) {
  t5_drawX = t5_posXAnim;
  t5_drawY = t5_posYAnim;
}

let t6_drawX = t6_baseX;
let t6_drawY = t6_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t6_drawX = t6_orbX;
  t6_drawY = t6_orbY;
} else if (frame >= posAnimStart) {
  t6_drawX = t6_posXAnim;
  t6_drawY = t6_posYAnim;
}

let t7_drawX = t7_baseX;
let t7_drawY = t7_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t7_drawX = t7_orbX;
  t7_drawY = t7_orbY;
} else if (frame >= posAnimStart) {
  t7_drawX = t7_posXAnim;
  t7_drawY = t7_posYAnim;
}

let t8_drawX = t8_baseX;
let t8_drawY = t8_baseY;
if (frame >= orbitStart && frame <= orbitEnd) {
  t8_drawX = t8_orbX;
  t8_drawY = t8_orbY;
} else if (frame >= posAnimStart) {
  t8_drawX = t8_posXAnim;
  t8_drawY = t8_posYAnim;
}

// Triangle size
const triW = 100;
const triH = 100;

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: circleDiameter,
      height: circleDiameter,
      borderRadius: "50%",
      backgroundColor: "transparent",
      border: "4px solid #FFD700",
      boxSizing: "border-box",
      transform: "translate(-50%, -50%) translateX(" + circleBaseX + "px) translateY(" + circleBaseY + "px) scale(" + circleScale + ")",
      opacity: circleOpacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#FF0000",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t1_drawX + "px) translateY(" + t1_drawY + "px) rotate(" + t1_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t1_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#FF7F00",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t2_drawX + "px) translateY(" + t2_drawY + "px) rotate(" + t2_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t2_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#FFFF00",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t3_drawX + "px) translateY(" + t3_drawY + "px) rotate(" + t3_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t3_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#00FF00",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t4_drawX + "px) translateY(" + t4_drawY + "px) rotate(" + t4_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t4_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#0000FF",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t5_drawX + "px) translateY(" + t5_drawY + "px) rotate(" + t5_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t5_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#4B0082",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t6_drawX + "px) translateY(" + t6_drawY + "px) rotate(" + t6_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t6_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#8B00FF",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t7_drawX + "px) translateY(" + t7_drawY + "px) rotate(" + t7_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t7_opacity
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: triW,
      height: triH,
      backgroundColor: "#9400D3",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      transform: "translate(-50%, -50%) translateX(" + t8_drawX + "px) translateY(" + t8_drawY + "px) rotate(" + t8_rot + "deg)",
      transformOrigin: "50% 50%",
      opacity: t8_opacity
    }} />
  </AbsoluteFill>
);
};
