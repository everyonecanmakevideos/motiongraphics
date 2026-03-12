import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const planetOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const satOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const panelTopOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const panelBottomOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const orbitAngle = interpolate(frame, [45, 225], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians = orbitAngle * Math.PI / 180;
const orbX = 0 + 140 * Math.cos(radians);
const orbY = 0 + 140 * Math.sin(radians);
const rotTopIn = interpolate(frame, [180, 225], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotTopOut = interpolate(frame, [225, 270], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotTop = rotTopIn + rotTopOut;
const rotBottomIn = interpolate(frame, [180, 225], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotBottomOut = interpolate(frame, [225, 270], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotBottom = rotBottomIn + rotBottomOut;
return (
<AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 0 + "px)" }}>
    <div style={{ width: "140px", height: "140px", borderRadius: "50%", backgroundColor: "#FB8C00", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: planetOpacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", width: "120px", height: "60px", backgroundColor: "#90A4AE", transform: "translate(-50%, -50%) translateX(" + orbX + "px) translateY(" + orbY + "px)", opacity: satOpacity }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: "80px", height: "20px", backgroundColor: "#1E88E5", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + -40 + "px) rotate(" + rotTop + "deg)", opacity: panelTopOpacity }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: "80px", height: "20px", backgroundColor: "#1E88E5", transform: "translate(-50%, -50%) translateX(" + 0 + "px) translateY(" + 40 + "px) rotate(" + rotBottom + "deg)", opacity: panelBottomOpacity }} />
    </div>
  </div>
</AbsoluteFill>
);
};
