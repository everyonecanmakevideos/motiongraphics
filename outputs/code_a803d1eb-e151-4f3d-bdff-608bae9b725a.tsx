import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const squareOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const triangleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const squareRot = interpolate(frame, [30, 210], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const triangleRot = interpolate(frame, [30, 210], [-40, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const triangleRotEnd = interpolate(frame, [210, 240], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%) rotate(" + squareRot + "deg)", 
      width: "220px", 
      height: "220px", 
      backgroundColor: "#1E88E5", 
      opacity: squareOpacity 
    }}></div>
    
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(0px) translateY(-110px) rotate(" + (frame >= 210 ? triangleRotEnd : triangleRot) + "deg)",
      width: "0px",
      height: "0px",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "#FB8C00",
      opacity: triangleOpacity
    }}></div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(110px) translateY(0px) rotate(" + (frame >= 210 ? triangleRotEnd : triangleRot) + "deg)",
      width: "0px",
      height: "0px",
      clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
      backgroundColor: "#FB8C00",
      opacity: triangleOpacity
    }}></div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(0px) translateY(110px) rotate(" + (frame >= 210 ? triangleRotEnd : triangleRot) + "deg)",
      width: "0px",
      height: "0px",
      clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
      backgroundColor: "#FB8C00",
      opacity: triangleOpacity
    }}></div>

    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(-110px) translateY(0px) rotate(" + (frame >= 210 ? triangleRotEnd : triangleRot) + "deg)",
      width: "0px",
      height: "0px",
      clipPath: "polygon(100% 0%, 100% 100%, 0% 50%)",
      backgroundColor: "#FB8C00",
      opacity: triangleOpacity
    }}></div>
  </AbsoluteFill>
);
};
