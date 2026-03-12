import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const opacity_red = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const y_out_red = interpolate(frame, [45, 90], [0, -200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angle_red = interpolate(frame, [90, 180], [-90, 270], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians_red = angle_red * Math.PI / 180;
const orbX_red = 0 + 200 * Math.cos(radians_red);
const orbY_red = 0 + 200 * Math.sin(radians_red);
const rot_red = interpolate(frame, [180, 210], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const y_return_red = interpolate(frame, [210, 240], [-200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const inOrbit_red = frame >= 90 && frame <= 180;
const afterReturn_red = frame >= 210;
const posX_red = inOrbit_red ? orbX_red : 0;
const posY_red = inOrbit_red ? orbY_red : (afterReturn_red ? y_return_red : y_out_red);

const opacity_blue = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const y_out_blue = interpolate(frame, [45, 90], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angle_blue = interpolate(frame, [90, 180], [90, 450], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians_blue = angle_blue * Math.PI / 180;
const orbX_blue = 0 + 200 * Math.cos(radians_blue);
const orbY_blue = 0 + 200 * Math.sin(radians_blue);
const rot_blue = interpolate(frame, [180, 210], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const y_return_blue = interpolate(frame, [210, 240], [200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const inOrbit_blue = frame >= 90 && frame <= 180;
const afterReturn_blue = frame >= 210;
const posX_blue = inOrbit_blue ? orbX_blue : 0;
const posY_blue = inOrbit_blue ? orbY_blue : (afterReturn_blue ? y_return_blue : y_out_blue);

const opacity_green = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const x_out_green = interpolate(frame, [45, 90], [0, -200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angle_green = interpolate(frame, [90, 180], [180, 540], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians_green = angle_green * Math.PI / 180;
const orbX_green = 0 + 200 * Math.cos(radians_green);
const orbY_green = 0 + 200 * Math.sin(radians_green);
const rot_green = interpolate(frame, [180, 210], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const x_return_green = interpolate(frame, [210, 240], [-200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const inOrbit_green = frame >= 90 && frame <= 180;
const afterReturn_green = frame >= 210;
const posX_green = inOrbit_green ? orbX_green : (afterReturn_green ? x_return_green : x_out_green);
const posY_green = inOrbit_green ? orbY_green : 0;

const opacity_yellow = interpolate(frame, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const x_out_yellow = interpolate(frame, [45, 90], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const angle_yellow = interpolate(frame, [90, 180], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const radians_yellow = angle_yellow * Math.PI / 180;
const orbX_yellow = 0 + 200 * Math.cos(radians_yellow);
const orbY_yellow = 0 + 200 * Math.sin(radians_yellow);
const rot_yellow = interpolate(frame, [180, 210], [0, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const x_return_yellow = interpolate(frame, [210, 240], [200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const inOrbit_yellow = frame >= 90 && frame <= 180;
const afterReturn_yellow = frame >= 210;
const posX_yellow = inOrbit_yellow ? orbX_yellow : (afterReturn_yellow ? x_return_yellow : x_out_yellow);
const posY_yellow = inOrbit_yellow ? orbY_yellow : 0;

return (
<AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 90, height: 90, backgroundColor: "#E53935", opacity: opacity_red, transform: "translate(-50%, -50%) translateX(" + posX_red + "px) translateY(" + posY_red + "px) rotate(" + rot_red + "deg)" }} />
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 90, height: 90, backgroundColor: "#1E88E5", opacity: opacity_blue, transform: "translate(-50%, -50%) translateX(" + posX_blue + "px) translateY(" + posY_blue + "px) rotate(" + rot_blue + "deg)" }} />
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 90, height: 90, backgroundColor: "#43A047", opacity: opacity_green, transform: "translate(-50%, -50%) translateX(" + posX_green + "px) translateY(" + posY_green + "px) rotate(" + rot_green + "deg)" }} />
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 90, height: 90, backgroundColor: "#FDD835", opacity: opacity_yellow, transform: "translate(-50%, -50%) translateX(" + posX_yellow + "px) translateY(" + posY_yellow + "px) rotate(" + rot_yellow + "deg)" }} />
</AbsoluteFill>
);
};
