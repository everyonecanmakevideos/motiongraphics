import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const coreStart = 0;
const coreEnd = 45;
const coreOpacity = interpolate(frame, [coreStart, coreEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineFadeStart = 0;
const lineFadeEnd = 45;
const lineOpacity = interpolate(frame, [lineFadeStart, lineFadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pendFadeStart = 0;
const pendFadeEnd = 45;
const pendulumOpacity = interpolate(frame, [pendFadeStart, pendFadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lineRotStart = 45;
const lineRotEnd = 180;
const line1Rot = interpolate(frame, [lineRotStart, lineRotEnd], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pendAStart = 90;
const pendAEnd = 210;
const pendRotA = interpolate(frame, [pendAStart, pendAEnd], [-25, 25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pendBStart = 180;
const pendBEnd = 240;
const pendRotB = interpolate(frame, [pendBStart, pendBEnd], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let pendRotation = pendRotA;
if (frame >= pendBStart) {
  pendRotation = pendRotB;
}
return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 140, height: 140, borderRadius: "50%", backgroundColor: "#FDD835", opacity: coreOpacity }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 70 + "px) translateY(" + 0 + "px) rotate(" + line1Rot + "deg)" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 300, height: 8, backgroundColor: "#FFFFFF", opacity: lineOpacity }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) translateX(" + 150 + "px) translateY(" + 0 + "px) rotate(" + pendRotation + "deg)", opacity: pendulumOpacity }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 70, height: 70, borderRadius: "50%", backgroundColor: "#1E88E5" }} />
        </div>
      </div>
    </div>
  </AbsoluteFill>
);
};
