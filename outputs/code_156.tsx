import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const baseStart = 0;
const baseEnd = 45;
const baseOpacity = interpolate(frame, [baseStart, baseEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const basePosX = 0;
const basePosY = 200;
const baseWidth = 200;
const baseHeight = 120;

const armOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const armOffsetX = 0;
const armOffsetY = -60;
const armWidth = 300;
const armHeight = 40;
const armRotA = interpolate(frame, [45, 120], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const armRotB = interpolate(frame, [180, 240], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let armRotation = armRotA;
if (frame >= 180) {
  armRotation = armRotB;
}

const gripOpacity = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gripOffsetX = 150;
const gripOffsetY = 0;
const gripDiameter = 60;
const gripRotation = interpolate(frame, [120, 180], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const baseStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: baseWidth + "px",
  height: baseHeight + "px",
  backgroundColor: "#1E88E5",
  opacity: baseOpacity,
  transform: "translate(-50%, -50%) translateX(" + basePosX + "px) translateY(" + basePosY + "px)"
};

const armStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: armWidth + "px",
  height: armHeight + "px",
  backgroundColor: "#9E9E9E",
  opacity: armOpacity,
  transformOrigin: "50% 100%",
  transform: "translate(-50%, -50%) translateX(" + armOffsetX + "px) translateY(" + armOffsetY + "px) rotate(" + armRotation + "deg)"
};

const gripStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: gripDiameter + "px",
  height: gripDiameter + "px",
  backgroundColor: "#E53935",
  borderRadius: "50%",
  opacity: gripOpacity,
  transform: "translate(-50%, -50%) translateX(" + gripOffsetX + "px) translateY(" + gripOffsetY + "px) rotate(" + gripRotation + "deg)"
};

return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div style={baseStyle as any}>
      <div style={armStyle as any}>
        <div style={gripStyle as any} />
      </div>
    </div>
  </AbsoluteFill>
);
};
