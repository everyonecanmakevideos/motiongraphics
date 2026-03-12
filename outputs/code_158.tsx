import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const sunPosX = 0;
const sunPosY = 0;
const sunStartFrame = 0;
const sunEndFrame = 60;
const sunOpacity = interpolate(frame, [sunStartFrame, sunEndFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const planetStartFadeStart = 0;
const planetStartFadeEnd = 60;
const planetOpacity = interpolate(frame, [planetStartFadeStart, planetStartFadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const moonStartFadeStart = 0;
const moonStartFadeEnd = 60;
const moonOpacity = interpolate(frame, [moonStartFadeStart, moonStartFadeEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Planet orbit segments
const pSeg1Start = 60;
const pSeg1End = 240;
const pSeg2Start = 240;
const pSeg2End = 300;
const angleP1 = interpolate(frame, [pSeg1Start, pSeg1End], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angleP2 = interpolate(frame, [pSeg2Start, pSeg2End], [360, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let anglePlanet = angleP1;
if (frame >= pSeg2Start) {
  anglePlanet = angleP2;
}

// Moon orbit segments (relative to planet center)
const mSeg1Start = 60;
const mSeg1End = 240;
const mSeg2Start = 240;
const mSeg2End = 300;
const angleM1 = interpolate(frame, [mSeg1Start, mSeg1End], [0, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angleM2 = interpolate(frame, [mSeg2Start, mSeg2End], [720, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
let angleMoon = angleM1;
if (frame >= mSeg2Start) {
  angleMoon = angleM2;
}

// Orbit math (centers are relative to canvas center)
const planetOrbitCenterX = 0;
const planetOrbitCenterY = 0;
const planetOrbitRadius = 250;
const planetRadians = anglePlanet * Math.PI / 180;
const orbXPlanet = planetOrbitCenterX + planetOrbitRadius * Math.cos(planetRadians);
const orbYPlanet = planetOrbitCenterY + planetOrbitRadius * Math.sin(planetRadians);

const moonOrbitCenterX = 0;
const moonOrbitCenterY = 0;
const moonOrbitRadius = 70;
const moonRadians = angleMoon * Math.PI / 180;
const orbXMoon = moonOrbitCenterX + moonOrbitRadius * Math.cos(moonRadians);
const orbYMoon = moonOrbitCenterY + moonOrbitRadius * Math.sin(moonRadians);

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: "160px", height: "160px", borderRadius: "50%", backgroundColor: "#FDD835", transform: "translate(-50%,-50%) translateX(" + sunPosX + "px) translateY(" + sunPosY + "px)", opacity: sunOpacity }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) translateX(" + orbXPlanet + "px) translateY(" + orbYPlanet + "px)" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#1E88E5", transform: "translate(-50%,-50%)", opacity: planetOpacity }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#BDBDBD", transform: "translate(-50%,-50%) translateX(" + orbXMoon + "px) translateY(" + orbYMoon + "px)", opacity: moonOpacity }} />
    </div>
  </AbsoluteFill>
);
};
