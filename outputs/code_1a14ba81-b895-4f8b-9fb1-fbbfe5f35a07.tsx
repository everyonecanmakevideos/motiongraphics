import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const cornerRadius = interpolate(frame, [45, 105], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const cornerRadiusRetract = interpolate(frame, [105, 150], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "0px",
        height: "0px",
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        backgroundColor: "#9C27B0",
        opacity: opacity,
        borderRadius: cornerRadiusRetract > 0 ? cornerRadiusRetract + "px" : cornerRadius + "px"
      }}
    />
  </AbsoluteFill>
);
};
