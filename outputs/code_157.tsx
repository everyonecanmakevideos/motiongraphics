import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const trainStartFadeStart = 0;
const trainStartFadeEnd = 45;
const trainFadeOpacity = interpolate(frame, [trainStartFadeStart, trainStartFadeEnd], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const moveStart = 45;
const moveEnd = 180;
const trainX = interpolate(frame, [moveStart, moveEnd], [-960, 960], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const trainY = 0;
const trainW = 500;
const trainH = 120;
const parentTransform = "translate(-50%, -50%) translateX(" + trainX + "px) translateY(" + trainY + "px)";
const wheelDiameter = 90;
const wheelLeftOffsetX = -205;
const wheelLeftOffsetY = 60;
const wheelRightOffsetX = 205;
const wheelRightOffsetY = 60;
const wheelFadeOpacity = interpolate(frame, [trainStartFadeStart, trainStartFadeEnd], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const wheelRotStart = 45;
const wheelRotEnd = 180;
const wheelLeftRot = interpolate(frame, [wheelRotStart, wheelRotEnd], [0, 1440], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const wheelRightRot = interpolate(frame, [wheelRotStart, wheelRotEnd], [0, 1440], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
const wheelLeftTransform = "translate(-50%, -50%) translateX(" + wheelLeftOffsetX + "px) translateY(" + wheelLeftOffsetY + "px) rotate(" + wheelLeftRot + "deg)";
const wheelRightTransform = "translate(-50%, -50%) translateX(" + wheelRightOffsetX + "px) translateY(" + wheelRightOffsetY + "px) rotate(" + wheelRightRot + "deg)";
return (
  <AbsoluteFill style={{ backgroundColor: "#F5F5F5", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: trainW + "px", height: trainH + "px", transform: parentTransform }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: trainW + "px", height: trainH + "px", backgroundColor: "#E53935", transform: "translate(-50%, -50%)", opacity: trainFadeOpacity }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: wheelDiameter + "px", height: wheelDiameter + "px", backgroundColor: "#212121", borderRadius: "50%", transform: wheelLeftTransform, opacity: wheelFadeOpacity }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: wheelDiameter + "px", height: wheelDiameter + "px", backgroundColor: "#212121", borderRadius: "50%", transform: wheelRightTransform, opacity: wheelFadeOpacity }} />
    </div>
  </AbsoluteFill>
);
};
