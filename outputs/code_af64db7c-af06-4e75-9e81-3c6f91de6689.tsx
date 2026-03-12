import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacitySquare1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityRoundedSquare1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityCircle1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotationSquare1 = interpolate(frame, [30, 120], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightSquare1First = interpolate(frame, [30, 75], [160, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightSquare1Second = interpolate(frame, [75, 120], [200, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scaleRoundedSquare1First = interpolate(frame, [30, 75], [1, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scaleRoundedSquare1Second = interpolate(frame, [75, 120], [0.7, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const scaleRoundedSquare1Third = interpolate(frame, [120, 150], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1 = interpolate(frame, [30, 180], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1Second = interpolate(frame, [180, 300], [150, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1Third = interpolate(frame, [300, 360], [0, -150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1Fourth = interpolate(frame, [360, 480], [-150, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1Fifth = interpolate(frame, [480, 540], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bounceCircle1Sixth = interpolate(frame, [540, 600], [150, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%) translateX(-320px)", 
      opacity: opacitySquare1, 
      width: "160px", 
      height: heightSquare1First ? heightSquare1First + "px" : "160px", 
      backgroundColor: "#8E24AA", 
      transform: "rotate(" + rotationSquare1 + "deg)"
    }} />
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%)", 
      opacity: opacityRoundedSquare1, 
      width: "200px", 
      height: "200px", 
      borderRadius: "20px", 
      backgroundColor: "#1E88E5", 
      transform: "scale(" + (scaleRoundedSquare1Third ? scaleRoundedSquare1Third : 1) + ")"
    }}>
      <div style={{
        position: "absolute", 
        left: "50%", 
        top: "50%", 
        transform: "translate(-50%, -50%)", 
        color: "#FFFFFF", 
        fontSize: "48px", 
        fontWeight: "normal", 
        fontFamily: "Arial", 
        textAlign: "center", 
        userSelect: "none", 
        pointerEvents: "none"
      }}>
        HELLO
      </div>
    </div>
    <div style={{ 
      position: "absolute", 
      left: "50%", 
      top: "50%", 
      transform: "translate(-50%, -50%) translateX(320px)", 
      opacity: opacityCircle1, 
      width: "120px", 
      height: "120px", 
      borderRadius: "50%", 
      backgroundColor: "#FB8C00", 
      transform: "translateY(" + bounceCircle1 + "px)"
    }} />
  </AbsoluteFill>
);
};
