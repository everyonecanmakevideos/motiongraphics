import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const starterPosX = -320;
const starterPosY = 0;
const brandPosX = 0;
const brandPosY = 0;
const premiumPosX = 320;
const premiumPosY = 0;
const rectW = 200;
const rectH = 300;
const starterOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const brandOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const premiumOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starterTextOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const brandTextOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const premiumTextOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const brandScalePhase1 = interpolate(frame, [30, 90], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const brandScalePhase2 = interpolate(frame, [90, 150], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let brandScale = brandScalePhase1;
if (frame > 90) {
  brandScale = brandScalePhase2;
}
const bgColor = "#F5F5F5";

return (
  <AbsoluteFill style={{ backgroundColor: bgColor, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        height: rectH + "px",
        backgroundColor: "#9E9E9E",
        transform: "translate(-50%, -50%) translateX(" + starterPosX + "px) translateY(" + starterPosY + "px) scale(1)",
        opacity: starterOpacity,
        zIndex: 1,
        boxSizing: "border-box"
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        height: rectH + "px",
        backgroundColor: "#2196F3",
        border: "5px solid " + "#FFD700",
        transform: "translate(-50%, -50%) translateX(" + brandPosX + "px) translateY(" + brandPosY + "px) scale(" + brandScale + ")",
        opacity: brandOpacity,
        zIndex: 1,
        boxSizing: "border-box"
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        height: rectH + "px",
        backgroundColor: "#333333",
        transform: "translate(-50%, -50%) translateX(" + premiumPosX + "px) translateY(" + premiumPosY + "px) scale(1)",
        opacity: premiumOpacity,
        zIndex: 1,
        boxSizing: "border-box"
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        color: "#FFFFFF",
        fontSize: 48 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        transform: "translate(-50%, -50%) translateX(" + starterPosX + "px) translateY(" + starterPosY + "px) scale(1)",
        opacity: starterTextOpacity,
        zIndex: 2
      }}
    >
      Starter
    </div>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        color: "#FFFFFF",
        fontSize: 48 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        transform: "translate(-50%, -50%) translateX(" + brandPosX + "px) translateY(" + brandPosY + "px) scale(" + brandScale + ")",
        opacity: brandTextOpacity,
        zIndex: 2
      }}
    >
      Brand
    </div>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: rectW + "px",
        color: "#FFFFFF",
        fontSize: 48 + "px",
        fontWeight: "bold",
        fontFamily: "Arial",
        whiteSpace: "nowrap",
        lineHeight: "1",
        letterSpacing: 0 + "px",
        textAlign: "center",
        textTransform: "none",
        userSelect: "none",
        pointerEvents: "none",
        transform: "translate(-50%, -50%) translateX(" + premiumPosX + "px) translateY(" + premiumPosY + "px) scale(1)",
        opacity: premiumTextOpacity,
        zIndex: 2
      }}
    >
      Premium
    </div>
  </AbsoluteFill>
);
};
