import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const boxOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const boxScale = interpolate(frame, [0, 30], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const boxX = interpolate(frame, [30, 120], [-20, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const boxX2 = interpolate(frame, [120, 150], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const boxScale2 = interpolate(frame, [150, 165], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const boxScaleBack = interpolate(frame, [165, 180], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const boxXFinal = frame <= 120 ? boxX : frame <= 150 ? boxX2 : frame <= 165 ? 0 : boxScaleBack === 1.1 ? 0 : 0;

return (
  <AbsoluteFill style={{ backgroundColor: "#D3D3D3", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 320 + "px",
      height: 120 + "px",
      backgroundColor: "#1E88E5",
      borderRadius: 24,
      opacity: boxOpacity,
      transform: "translate(-50%, -50%) translateX(" + boxXFinal + "px) scale(" + (frame >= 150 ? boxScaleBack : boxScale) + ")"
    }} />
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      color: "#FFFFFF",
      fontSize: 48 + "px",
      fontWeight: "bold",
      fontFamily: "Arial",
      textAlign: "center",
      opacity: textOpacity,
      transform: "translate(-50%, -50%)"
    }}>
      WARNING
    </div>
  </AbsoluteFill>
);
};
