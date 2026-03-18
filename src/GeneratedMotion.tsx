import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const hackStart = 0;
const hackEnd = 30;
const hackOpacity = interpolate(frame, [hackStart, hackEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const hackGlowBlur = interpolate(frame, [hackStart, hackEnd], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const hackGlowSpread = interpolate(frame, [hackStart, hackEnd], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const hackGlowColor = "#2196F3";
const hackPosX = 0;
const hackPosY = 0;
const binStart = 30;
const binEnd = 210;
const binaryY = interpolate(frame, [binStart, binEnd], [-540, 540], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const binaryPosX = 0;
const binaryColor = "#2196F3";
return (
  <AbsoluteFill style={{ backgroundColor: "#0F0F23", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + hackPosX + "px) translateY(" + hackPosY + "px)",
        color: "#2196F3",
        fontSize: 90 + "px",
        fontWeight: "700",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: hackOpacity,
        boxShadow: "0px 0px " + hackGlowBlur + "px " + hackGlowSpread + "px " + hackGlowColor,
        zIndex: 2
      }}
    >
      HACK
    </div>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + binaryPosX + "px) translateY(" + binaryY + "px)",
        color: binaryColor,
        fontSize: 20 + "px",
        fontWeight: "400",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        opacity: 1,
        zIndex: 2
      }}
    >
      0101010101010101
    </div>
  </AbsoluteFill>
);
};
