import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacityBefore = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityAfter = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarBefore1 = interpolate(frame, [60, 90], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarBefore2 = interpolate(frame, [90, 120], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarBefore3 = interpolate(frame, [120, 150], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarAfter1 = interpolate(frame, [150, 180], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarAfter2 = interpolate(frame, [180, 210], [0, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const heightBarAfter3 = interpolate(frame, [210, 240], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(-360px)",
      opacity: opacityBefore,
      fontSize: "24px",
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      textAlign: "center",
      userSelect: "none",
      pointerEvents: "none"
    }}>
      BEFORE
    </div>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) translateX(360px)",
      opacity: opacityAfter,
      fontSize: "24px",
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      textAlign: "center",
      userSelect: "none",
      pointerEvents: "none"
    }}>
      AFTER
    </div>
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarBefore1 / 120) + ")",
      width: "60px",
      height: heightBarBefore1 + "px",
      backgroundColor: "#9E9E9E"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarBefore2 / 160) + ")",
      width: "60px",
      height: heightBarBefore2 + "px",
      backgroundColor: "#9E9E9E",
      transform: "translateX(-360px)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarBefore3 / 100) + ")",
      width: "60px",
      height: heightBarBefore3 + "px",
      backgroundColor: "#9E9E9E",
      transform: "translateX(-240px)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarAfter1 / 200) + ")",
      width: "60px",
      height: heightBarAfter1 + "px",
      backgroundColor: "#4CAF50",
      transform: "translateX(240px)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarAfter2 / 280) + ")",
      width: "60px",
      height: heightBarAfter2 + "px",
      backgroundColor: "#4CAF50",
      transform: "translateX(360px)"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      bottom: "20%",
      transformOrigin: "bottom center",
      transform: "translateX(-50%) scaleY(" + (heightBarAfter3 / 180) + ")",
      width: "60px",
      height: heightBarAfter3 + "px",
      backgroundColor: "#4CAF50",
      transform: "translateX(480px)"
    }} />
  </AbsoluteFill>
);
};
