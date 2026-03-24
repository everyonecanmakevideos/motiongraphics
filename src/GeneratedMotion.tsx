import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const fadeInStart = 0;
const fadeInEnd = 15;
const glitchStart = 15;
const glitchEnd = 90;
const fadeIn = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// X offsets for colored splits
const xR = interpolate(frame, [glitchStart, glitchEnd], [0, 5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const xG = interpolate(frame, [glitchStart, glitchEnd], [0, -5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const xB = interpolate(frame, [glitchStart, glitchEnd], [0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Opacity modulations from timeline entries
const modR = interpolate(frame, [glitchStart, glitchEnd], [1, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const modG = interpolate(frame, [glitchStart, glitchEnd], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const modB = interpolate(frame, [glitchStart, glitchEnd], [1, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityR = fadeIn * modR;
const opacityG = fadeIn * modG;
const opacityB = fadeIn * modB;
const opacityMain = fadeIn * 1;
// Color animations (white -> target) parsed to RGB
// Red target #E53935 => (229,57,53)
const rR = interpolate(frame, [glitchStart, glitchEnd], [255, 229], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gR = interpolate(frame, [glitchStart, glitchEnd], [255, 57], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bR = interpolate(frame, [glitchStart, glitchEnd], [255, 53], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const colorR = "rgb(" + Math.round(rR) + "," + Math.round(gR) + "," + Math.round(bR) + ")";
// Green target #4CAF50 => (76,175,80)
const rG = interpolate(frame, [glitchStart, glitchEnd], [255, 76], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gG = interpolate(frame, [glitchStart, glitchEnd], [255, 175], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bG = interpolate(frame, [glitchStart, glitchEnd], [255, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const colorG = "rgb(" + Math.round(rG) + "," + Math.round(gG) + "," + Math.round(bG) + ")";
// Blue target #2196F3 => (33,150,243)
const rB = interpolate(frame, [glitchStart, glitchEnd], [255, 33], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const gB = interpolate(frame, [glitchStart, glitchEnd], [255, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const bB = interpolate(frame, [glitchStart, glitchEnd], [255, 243], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const colorB = "rgb(" + Math.round(rB) + "," + Math.round(gB) + "," + Math.round(bB) + ")";
// Text layout values
const posX = 0;
const posY = 0;
const fontSize = 200;
const fontWeight = "bold";
const fontFamily = "Arial";
const textAlign = "center";
const lineHeight = "1";
const letterSpacing = 0;
const textTransform = "none";
return (
  <AbsoluteFill style={{ backgroundColor: "#0F0F23", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + (posX + xB) + "px) translateY(" + posY + "px)", color: colorB, fontSize: fontSize + "px", fontWeight: fontWeight, fontFamily: fontFamily, whiteSpace: "nowrap", lineHeight: lineHeight, letterSpacing: letterSpacing + "px", textAlign: textAlign, textTransform: textTransform, userSelect: "none", pointerEvents: "none", opacity: opacityB, zIndex: 1 }}>
      ERROR
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + (posX + xG) + "px) translateY(" + posY + "px)", color: colorG, fontSize: fontSize + "px", fontWeight: fontWeight, fontFamily: fontFamily, whiteSpace: "nowrap", lineHeight: lineHeight, letterSpacing: letterSpacing + "px", textAlign: textAlign, textTransform: textTransform, userSelect: "none", pointerEvents: "none", opacity: opacityG, zIndex: 2 }}>
      ERROR
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + (posX + xR) + "px) translateY(" + posY + "px)", color: colorR, fontSize: fontSize + "px", fontWeight: fontWeight, fontFamily: fontFamily, whiteSpace: "nowrap", lineHeight: lineHeight, letterSpacing: letterSpacing + "px", textAlign: textAlign, textTransform: textTransform, userSelect: "none", pointerEvents: "none", opacity: opacityR, zIndex: 3 }}>
      ERROR
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px)", color: "#FFFFFF", fontSize: fontSize + "px", fontWeight: fontWeight, fontFamily: fontFamily, whiteSpace: "nowrap", lineHeight: lineHeight, letterSpacing: letterSpacing + "px", textAlign: textAlign, textTransform: textTransform, userSelect: "none", pointerEvents: "none", opacity: opacityMain, zIndex: 4 }}>
      ERROR
    </div>
  </AbsoluteFill>
);
};
