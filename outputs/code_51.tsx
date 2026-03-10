
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();

let scale;
if (frame < 45) {
  scale = interpolate(frame, [0, 45], [1.0, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
} else if (frame < 90) {
  scale = interpolate(frame, [45, 90], [1.08, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
} else if (frame < 135) {
  scale = interpolate(frame, [90, 135], [1.0, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
} else if (frame < 180) {
  scale = interpolate(frame, [135, 180], [1.08, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
} else {
  scale = 1.0;
}

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        backgroundColor: "#42A5F5",
        transform: "translate(-50%, -50%) scale(" + scale + ")"
      }}
    />
  </AbsoluteFill>
);
};
