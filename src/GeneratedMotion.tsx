import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const bgFrom = "#2196F3";
const bgTo = "#7B1FA2";
const bgStyle = "linear-gradient(to bottom, " + bgFrom + ", " + bgTo + ")";
const posX = 0;
const posY = 0;
const fadeInStart = 0;
const fadeInEnd = 30;
const fadeOutStart = 150;
const fadeOutEnd = 180;
const opacityIn = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let titleOpacity = opacityIn;
if (frame > fadeInEnd && frame < fadeOutStart) {
  titleOpacity = 1;
}
if (frame >= fadeOutStart) {
  titleOpacity = opacityOut;
}
const fontSize = 96;
const fontWeight = "bold";
const fontFamily = "Arial";
const textColor = "#FFFFFF";
const textAlign = "center";
const lineHeight = "1";
const letterSpacing = 0;
const textTransform = "none";
return (
  <AbsoluteFill style={{ background: bgStyle, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px)", color: textColor, fontSize: fontSize + "px", fontWeight: fontWeight, fontFamily: fontFamily, whiteSpace: "nowrap", lineHeight: lineHeight, letterSpacing: letterSpacing + "px", textAlign: textAlign, textTransform: textTransform, userSelect: "none", pointerEvents: "none", opacity: titleOpacity, zIndex: 1 }}>
      Welcome to the Future
    </div>
  </AbsoluteFill>
);
};
