import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const square1Opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square2Opacity = interpolate(frame, [6, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square3Opacity = interpolate(frame, [12, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square4Opacity = interpolate(frame, [18, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square5Opacity = interpolate(frame, [24, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square6Opacity = interpolate(frame, [30, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square7Opacity = interpolate(frame, [36, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square8Opacity = interpolate(frame, [42, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square9Opacity = interpolate(frame, [48, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(-100px) translateY(-100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square1Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(0px) translateY(-100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square2Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(100px) translateY(-100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square3Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(-100px) translateY(0px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square4Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(0px) translateY(0px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square5Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(100px) translateY(0px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square6Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(-100px) translateY(100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square7Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(0px) translateY(100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square8Opacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(100px) translateY(100px)", width: "80px", height: "80px", backgroundColor: "#9C27B0", opacity: square9Opacity }} />
  </AbsoluteFill>
);
};
