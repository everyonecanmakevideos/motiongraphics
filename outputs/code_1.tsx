
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();

const fadeStartFrame = 0;
const fadeEndFrame = 1.2 * 30;
const holdStartFrame = 1.2 * 30;
const holdEndFrame = 4.0 * 30;

let opacity;
if (frame < fadeEndFrame) {
  opacity = interpolate(
    frame,
    [fadeStartFrame, fadeEndFrame],
    [0.0, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    }
  );
} else {
  opacity = 1.0;
}

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        backgroundColor: "#E53935",
        opacity: opacity
      }}
    />
  </AbsoluteFill>
);
};
