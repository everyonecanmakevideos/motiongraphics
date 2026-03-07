
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();

// Phase timing definitions
const phase1Start = 0;
const phase1End = 60; // 2s
const phase2Start = 60;
const phase2End = 180; // 6s
const phase3Start = 180;
const phase3End = 240; // 8s
const phase4Start = 240;
const phase4End = 300; // 10s
const phase5Start = 300;
const phase5End = 360; // 12s

// Center circle logic
let circleScale;
if (frame < phase1End) {
  circleScale = interpolate(frame, [phase1Start, phase1End], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  circleScale = 1;
}

// Triangle logic
let triangle1Opacity, triangle2Opacity, triangle3Opacity, triangle4Opacity, triangle5Opacity, triangle6Opacity, triangle7Opacity, triangle8Opacity;
if (frame < phase2End) {
  if (frame < 90) {
    triangle1Opacity = interpolate(frame, [phase2Start, phase2Start + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle1Opacity = 1;
  }
  
  if (frame < 105) {
    triangle2Opacity = interpolate(frame, [phase2Start + 15, phase2Start + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle2Opacity = 1;
  }
  
  if (frame < 120) {
    triangle3Opacity = interpolate(frame, [phase2Start + 30, phase2Start + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle3Opacity = 1;
  }
  
  if (frame < 135) {
    triangle4Opacity = interpolate(frame, [phase2Start + 45, phase2Start + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle4Opacity = 1;
  }
  
  if (frame < 150) {
    triangle5Opacity = interpolate(frame, [phase2Start + 60, phase2Start + 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle5Opacity = 1;
  }

  if (frame < 165) {
    triangle6Opacity = interpolate(frame, [phase2Start + 75, phase2Start + 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle6Opacity = 1;
  }

  if (frame < 180) {
    triangle7Opacity = interpolate(frame, [phase2Start + 90, phase2Start + 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle7Opacity = 1;
  }

  if (frame < 195) {
    triangle8Opacity = interpolate(frame, [phase2Start + 105, phase2Start + 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    triangle8Opacity = 1;
  }
} else {
  triangle1Opacity = triangle2Opacity = triangle3Opacity = triangle4Opacity = triangle5Opacity = triangle6Opacity = triangle7Opacity = triangle8Opacity = 1;
}

// Rotation logic
let rotation;
if (frame < phase3End) {
  rotation = interpolate(frame, [phase3Start, phase3End], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  rotation = 180;
}

// Orbit logic
let orbitX1, orbitX2, orbitX3, orbitX4, orbitX5, orbitX6, orbitX7, orbitX8;
if (frame < phase5Start) {
  const angleShift = (frame >= phase4Start && frame < phase4End) ? 90 : 0;
  const radius = 240;
  orbitX1 = radius * Math.cos((0 + angleShift) * Math.PI / 180);
  orbitX2 = radius * Math.cos((45 + angleShift) * Math.PI / 180);
  orbitX3 = radius * Math.cos((90 + angleShift) * Math.PI / 180);
  orbitX4 = radius * Math.cos((135 + angleShift) * Math.PI / 180);
  orbitX5 = radius * Math.cos((180 + angleShift) * Math.PI / 180);
  orbitX6 = radius * Math.cos((225 + angleShift) * Math.PI / 180);
  orbitX7 = radius * Math.cos((270 + angleShift) * Math.PI / 180);
  orbitX8 = radius * Math.cos((315 + angleShift) * Math.PI / 180);
} else {
  orbitX1 = 0;
  orbitX2 = 0;
  orbitX3 = 0;
  orbitX4 = 0;
  orbitX5 = 0;
  orbitX6 = 0;
  orbitX7 = 0;
  orbitX8 = 0;
}

// Fade out shapes
let fadeOut;
if (frame >= phase5Start) {
  fadeOut = interpolate(frame, [phase5Start, phase5End], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
} else {
  fadeOut = 1;
}

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "200px", height: "200px", border: "4px solid #FFD700",
      borderRadius: "50%", transform: "translate(-50%, -50%) scale(" + circleScale + ")"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle1Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "red", transform: "translate(-50%, -50%) translateX(" + orbitX1 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle2Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "orange", transform: "translate(-50%, -50%) translateX(" + orbitX2 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle3Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "yellow", transform: "translate(-50%, -50%) translateX(" + orbitX3 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle4Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "green", transform: "translate(-50%, -50%) translateX(" + orbitX4 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle5Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "cyan", transform: "translate(-50%, -50%) translateX(" + orbitX5 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle6Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "blue", transform: "translate(-50%, -50%) translateX(" + orbitX6 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle7Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "purple", transform: "translate(-50%, -50%) translateX(" + orbitX7 + "px) rotate(" + rotation + "deg)"
    }} />
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      width: "100px", height: "100px", opacity: triangle8Opacity * fadeOut,
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "pink", transform: "translate(-50%, -50%) translateX(" + orbitX8 + "px) rotate(" + rotation + "deg)"
    }} />
  </AbsoluteFill>
);
};
