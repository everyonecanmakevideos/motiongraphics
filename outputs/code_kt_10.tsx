import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;
const startFadeIn = 0 * 30;
const endFadeIn = 0.5 * 30;
const startScale = 0.5 * 30;
const endScale = 4.5 * 30;
const startFadeOut = 5.5 * 30;
const endFadeOut = 6 * 30;
const opacityIn = interpolate(frame, [startFadeIn, endFadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacityOut = interpolate(frame, [startFadeOut, endFadeOut], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const opacity = Math.min(opacityIn, opacityOut);
const scaleVal = interpolate(frame, [startScale, endScale], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const posX = interpolate(frame, [startScale, endScale], [0, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const posY = interpolate(frame, [startScale, endScale], [-640, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const objFontSize = 0;
const fontSizeVal = objFontSize > 0 ? objFontSize : 80;
const transform = "translate(-50%, -50%) translateX(" + posX + "px) translateY(" + posY + "px) scale(" + scaleVal + ")";
return (
<AbsoluteFill style={{ backgroundColor: "#654321", overflow: "hidden" }}>
<div style={{ position: "absolute", left: "50%", top: "50%", transform: transform, color: "#FDD835", fontSize: fontSizeVal + "px", fontWeight: 700, fontFamily: "Manrope", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: 0 + "px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: opacity, zIndex: 1 }}>
Next Level
</div>
</AbsoluteFill>
);
};
