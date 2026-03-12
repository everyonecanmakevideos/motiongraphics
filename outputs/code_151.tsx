import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const f45 = 45;
const f150 = 150;
const f195 = 195;
const f240 = 240;
const linePosX = 0;
const linePosY = 0;
const square1OffsetX = -200;
const square1OffsetY = 0;
const square2OffsetX = 200;
const square2OffsetY = 0;
const lineOpacity = interpolate(frame, [0, f45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square1Opacity = interpolate(frame, [0, f45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const square2Opacity = interpolate(frame, [0, f45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rot1 = interpolate(frame, [f45, f150], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rot2 = interpolate(frame, [f150, f195], [0, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rot3 = interpolate(frame, [f195, f240], [0, -300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineRot = rot1 + rot2 + rot3;
return (
  <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "400px",
        height: "10px",
        backgroundColor: "#616161",
        transform:
          "translate(-50%, -50%) translateX(" +
          linePosX +
          "px) translateY(" +
          linePosY +
          "px) rotate(" +
          lineRot +
          "deg)",
        opacity: lineOpacity
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "90px",
          height: "90px",
          backgroundColor: "#E53935",
          transform:
            "translate(-50%, -50%) translateX(" +
            square1OffsetX +
            "px) translateY(" +
            square1OffsetY +
            "px)",
          opacity: square1Opacity
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "90px",
          height: "90px",
          backgroundColor: "#1E88E5",
          transform:
            "translate(-50%, -50%) translateX(" +
            square2OffsetX +
            "px) translateY(" +
            square2OffsetY +
            "px)",
          opacity: square2Opacity
        }}
      />
    </div>
  </AbsoluteFill>
);
};
