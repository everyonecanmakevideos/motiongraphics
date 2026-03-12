import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const rectH_baseY = 0;
const rectV_baseX = 0;
const xStartH = 0;
const xEndH = 60;
const yStartV = 60;
const yEndV = 120;
const rotStart = 120;
const rotEnd = 165;
const scalePhase1Start = Math.round(5.5 * 30);
const scalePhase1End = Math.round(6.25 * 30);
const scalePhase2Start = scalePhase1End;
const scalePhase2End = Math.round(7 * 30);
const rectH_x = interpolate(frame, [xStartH, xEndH], [-960, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectV_y = interpolate(frame, [yStartV, yEndV], [-540, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectH_rot = interpolate(frame, [rotStart, rotEnd], [0, 45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectV_rot = interpolate(frame, [rotStart, rotEnd], [0, 45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectH_scaleA = interpolate(frame, [scalePhase1Start, scalePhase1End], [1, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectH_scaleB = interpolate(frame, [scalePhase2Start, scalePhase2End], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectV_scaleA = interpolate(frame, [scalePhase1Start, scalePhase1End], [1, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectV_scaleB = interpolate(frame, [scalePhase2Start, scalePhase2End], [1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rectH_scale = frame < scalePhase2Start ? rectH_scaleA : rectH_scaleB;
const rectV_scale = frame < scalePhase2Start ? rectV_scaleA : rectV_scaleB;
return (
<AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 300 + "px", height: 80 + "px", backgroundColor: "#1976D2", transform: "translate(-50%, -50%) translateX(" + rectH_x + "px) translateY(" + rectH_baseY + "px) rotate(" + rectH_rot + "deg) scale(" + rectH_scale + ")", transformOrigin: "50% 50%" }} />
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 80 + "px", height: 300 + "px", backgroundColor: "#E53935", transform: "translate(-50%, -50%) translateX(" + rectV_baseX + "px) translateY(" + rectV_y + "px) rotate(" + rectV_rot + "deg) scale(" + rectV_scale + ")", transformOrigin: "50% 50%" }} />
</AbsoluteFill>
);
};
