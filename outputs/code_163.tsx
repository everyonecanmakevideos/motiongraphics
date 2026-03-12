import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();

const rectStartX = -960;
const rectX = interpolate(frame, [0, 30], [rectStartX, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const rectY = interpolate(frame, [150, 210], [0, -150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const rotA = interpolate(frame, [90, 120], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotB = interpolate(frame, [120, 150], [0, -20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rotC = interpolate(frame, [150, 180], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectRotation = rotA + rotB + rotC;

const rectOpacity = interpolate(frame, [210, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const textOpIn = interpolate(frame, [6, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textOpOut = interpolate(frame, [210, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textOpacity = textOpIn * textOpOut;

const textScaleUp = interpolate(frame, [30, 60], [0, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textScaleDown = interpolate(frame, [60, 90], [0, -0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const textScale = 1 + textScaleUp + textScaleDown;

const childOffsetX = 0;
const childOffsetY = 0;
const childYAnim = interpolate(frame, [150, 210], [0, -150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const childY = childOffsetY + childYAnim;

return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform:
          "translate(-50%, -50%) translateX(" +
          rectX +
          "px) translateY(" +
          rectY +
          "px) rotate(" +
          rectRotation +
          "deg)",
        width: "340px",
        height: "120px",
        backgroundColor: "#8E24AA",
        borderRadius: "30px",
        opacity: rectOpacity,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform:
            "translate(-50%, -50%) translateX(" +
            childOffsetX +
            "px) translateY(" +
            childY +
            "px) scale(" +
            textScale +
            ")",
          color: "#FFFFFF",
          fontSize: "64px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
          lineHeight: "64px",
          letterSpacing: "0px",
          textAlign: "center",
          textTransform: "none",
          userSelect: "none",
          pointerEvents: "none",
          opacity: textOpacity,
        }}
      >
        SALE
      </div>
    </div>
  </AbsoluteFill>
);
};
