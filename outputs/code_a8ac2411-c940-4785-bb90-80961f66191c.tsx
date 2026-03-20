import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const circleDiameter = 120;
const posX = 0;
const posY = 0;
const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeOut = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity = fadeIn * fadeOut;
return (
<AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
  <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: circleDiameter + "px",
    height: circleDiameter + "px",
    backgroundColor: "#E53935",
    borderRadius: "50%",
    transform: "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px)",
    opacity: opacity
  }} />
</AbsoluteFill>
);
};
