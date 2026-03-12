import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const startFramePlanet = 0;
const endFramePlanet = 30;
const opacityPlanet = interpolate(frame, [startFramePlanet, endFramePlanet], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const startFrameMoonFadeIn = 0;
const endFrameMoonFadeIn = 30;
const opacityMoon = interpolate(frame, [startFrameMoonFadeIn, endFrameMoonFadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const startFrameMoonOrbit = 30;
const endFrameMoonOrbit = 210; 
const angleMoonOrbit = interpolate(frame, [startFrameMoonOrbit, endFrameMoonOrbit], [0, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radiansMoon = angleMoonOrbit * Math.PI / 180;
const orbXMoon = 160 * Math.cos(radiansMoon);
const orbYMoon = 160 * Math.sin(radiansMoon);

const startFrameMoonFadeOut = 210;
const endFrameMoonFadeOut = 240;
const opacityMoonFadeOut = interpolate(frame, [startFrameMoonFadeOut, endFrameMoonFadeOut], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

return (
  <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 200 + "px",
        height: 200 + "px",
        backgroundColor: "#1E88E5",
        borderRadius: "50%",
        opacity: opacityPlanet
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) translateX(" + orbXMoon + "px) translateY(" + orbYMoon + "px)",
        width: 40 + "px",
        height: 40 + "px",
        backgroundColor: "#FFFFFF",
        borderRadius: "50%",
        opacity: opacityMoon * opacityMoonFadeOut
      }}
    />
  </AbsoluteFill>
);
};
