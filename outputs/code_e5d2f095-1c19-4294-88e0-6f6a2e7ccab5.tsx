import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const rotation = interpolate(frame, [0, 60], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rFill = interpolate(frame, [120, 240], [0, 253], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gFill = interpolate(frame, [120, 240], [0, 216], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bFill = interpolate(frame, [120, 240], [0, 53], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const strokeWidth = interpolate(frame, [240, 360], [4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const animColor = "rgb(" + Math.round(rFill) + "," + Math.round(gFill) + "," + Math.round(bFill) + ")";

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) rotate(" + rotation + "deg)",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: animColor,
      width: 195 + "px",
      height: 195 + "px"
    }}>
    </div>
    <div style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translateX(-" + (195 / 2) + "px) translateY(-50%)",
      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
      backgroundColor: "transparent",
      border: strokeWidth + "px solid #FFFFFF",
      boxSizing: "border-box",
      width: 195 + "px",
      height: 195 + "px"
    }}>
    </div>
  </AbsoluteFill>
);
};
