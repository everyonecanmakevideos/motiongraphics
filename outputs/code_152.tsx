import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const fadeStart = 0;
const fadeEnd = 45;
const orbit1Start = 45;
const orbit1End = 180;
const rotateStart = 180;
const rotateEnd = 225;
const centerX = 0;
const centerY = 0;
const radius = 200;

// Circle (circle_1)
const circleOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const circlePosX = 0;
const circlePosY = 0;

// Triangle 1 (triangle_1)
const t1_startX = 0;
const t1_startY = -200;
const t1_startAngleRad = Math.atan2(t1_startY - centerY, t1_startX - centerX);
const t1_startAngleDeg = t1_startAngleRad * 180 / Math.PI;
const t1_angle = interpolate(frame, [orbit1Start, orbit1End], [t1_startAngleDeg, t1_startAngleDeg + 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t1_rad = t1_angle * Math.PI / 180;
const t1_orbX = centerX + radius * Math.cos(t1_rad);
const t1_orbY = centerY + radius * Math.sin(t1_rad);
const t1_rot = interpolate(frame, [rotateStart, rotateEnd], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t1_opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Triangle 2 (triangle_2)
const t2_startX = 173.2;
const t2_startY = 100;
const t2_startAngleRad = Math.atan2(t2_startY - centerY, t2_startX - centerX);
const t2_startAngleDeg = t2_startAngleRad * 180 / Math.PI;
const t2_angle = interpolate(frame, [orbit1Start, orbit1End], [t2_startAngleDeg, t2_startAngleDeg + 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_rad = t2_angle * Math.PI / 180;
const t2_orbX = centerX + radius * Math.cos(t2_rad);
const t2_orbY = centerY + radius * Math.sin(t2_rad);
const t2_rot = interpolate(frame, [rotateStart, rotateEnd], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t2_opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Triangle 3 (triangle_3)
const t3_startX = -173.2;
const t3_startY = 100;
const t3_startAngleRad = Math.atan2(t3_startY - centerY, t3_startX - centerX);
const t3_startAngleDeg = t3_startAngleRad * 180 / Math.PI;
const t3_angle = interpolate(frame, [orbit1Start, orbit1End], [t3_startAngleDeg, t3_startAngleDeg + 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_rad = t3_angle * Math.PI / 180;
const t3_orbX = centerX + radius * Math.cos(t3_rad);
const t3_orbY = centerY + radius * Math.sin(t3_rad);
const t3_rot = interpolate(frame, [rotateStart, rotateEnd], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const t3_opacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
<AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) translateX(" + circlePosX + "px) translateY(" + circlePosY + "px)",
    width: 150,
    height: 150,
    borderRadius: "50%",
    backgroundColor: "#FDD835",
    opacity: circleOpacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) translateX(" + t1_orbX + "px) translateY(" + t1_orbY + "px) rotate(" + t1_rot + "deg)",
    width: 70,
    height: 70,
    backgroundColor: "#E53935",
    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
    opacity: t1_opacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) translateX(" + t2_orbX + "px) translateY(" + t2_orbY + "px) rotate(" + t2_rot + "deg)",
    width: 70,
    height: 70,
    backgroundColor: "#1E88E5",
    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
    opacity: t2_opacity
  }} />
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) translateX(" + t3_orbX + "px) translateY(" + t3_orbY + "px) rotate(" + t3_rot + "deg)",
    width: 70,
    height: 70,
    backgroundColor: "#43A047",
    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
    opacity: t3_opacity
  }} />
</AbsoluteFill>
);
};
