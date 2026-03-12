import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const baseOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const armOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gripperOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const armRotation = interpolate(frame, [45, 120], [0, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gripperRotation = interpolate(frame, [120, 180], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const armRotationBack = interpolate(frame, [180, 240], [70, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#D3D3D3", overflow: "hidden" }}>
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%) translateX(0px) translateY(500px)", 
      opacity: baseOpacity, 
      width: "200px", 
      height: "80px", 
      backgroundColor: "#424242" 
    }} />
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transformOrigin: "50% 100%", 
      transform: "translate(-50%, -50%) translateX(0px) translateY(460px) rotate(" + armRotation + "deg)", 
      opacity: armOpacity, 
      width: "300px", 
      height: "40px", 
      backgroundColor: "#9E9E9E" 
    }} />
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%) translateX(150px) translateY(-20px) rotate(" + gripperRotation + "deg)", 
      opacity: gripperOpacity, 
      borderRadius: "50%", 
      width: "50px", 
      height: "50px", 
      backgroundColor: "#E53935" 
    }} />
  </AbsoluteFill>
);
};
