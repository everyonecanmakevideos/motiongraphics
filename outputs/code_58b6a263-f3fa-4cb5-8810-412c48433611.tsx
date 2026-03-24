import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const GeneratedMotion = () => {
const frame = useCurrentFrame();
const canvasW = 1920;
const canvasH = 1080;
const halfW = canvasW / 2;
const halfH = canvasH / 2;

// Starter card timings
const starter_in_start = 0;
const starter_in_end = 15;
const starter_out_start = 150;
const starter_out_end = 180;
const starter_in = interpolate(frame, [starter_in_start, starter_in_end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_out = interpolate(frame, [starter_out_start, starter_out_end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_opacity = starter_in * starter_out;

// Starter base values
const starter_w = 200;
const starter_h = 300;
const starter_x = -480;
const starter_y = 0;

// Starter text
const starter_text_in = interpolate(frame, [starter_in_start, starter_in_end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_text_out = interpolate(frame, [starter_out_start, starter_out_end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_text_opacity = starter_text_in * starter_text_out;
const starter_text_x = -480;
const starter_text_y = -140;
const starter_text_fontSize = 48;
const starter_text_fontWeight = "bold";

// Starter features text
const starter_features_in = interpolate(frame, [starter_in_start, starter_in_end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_features_out = interpolate(frame, [starter_out_start, starter_out_end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_features_opacity = starter_features_in * starter_features_out;
const starter_features_x = -480;
const starter_features_y = 0;
const starter_features_fontSize = 24;

// Starter button
const starter_button_in = interpolate(frame, [starter_in_start, starter_in_end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_button_out = interpolate(frame, [starter_out_start, starter_out_end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_button_opacity = starter_button_in * starter_button_out;
const starter_button_w = 150;
const starter_button_h = 50;
const starter_button_x = -480;
const starter_button_y = 140;
const starter_button_corner = 10;

// Starter button text
const starter_button_text_in = interpolate(frame, [starter_in_start, starter_in_end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_button_text_out = interpolate(frame, [starter_out_start, starter_out_end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const starter_button_text_opacity = starter_button_text_in * starter_button_text_out;
const starter_button_text_x = -480;
const starter_button_text_y = 140;
const starter_button_text_fontSize = 24;

// Pro card timings & animations
const pro_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_opacity = pro_in * pro_out;
const pro_scale = interpolate(frame, [15, 60], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_w = 200;
const pro_h = 300;
const pro_x = 0;
const pro_y = 0;

// Pro text
const pro_text_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_text_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_text_opacity = pro_text_in * pro_text_out;
const pro_text_x = 0;
const pro_text_y = -140;
const pro_text_fontSize = 48;
const pro_text_fontWeight = "bold";

// Pro features
const pro_features_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_features_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_features_opacity = pro_features_in * pro_features_out;
const pro_features_x = 0;
const pro_features_y = 0;
const pro_features_fontSize = 24;

// Pro button
const pro_button_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_button_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_button_opacity = pro_button_in * pro_button_out;
const pro_button_w = 150;
const pro_button_h = 50;
const pro_button_x = 0;
const pro_button_y = 140;
const pro_button_corner = 10;

// Pro button text
const pro_button_text_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_button_text_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const pro_button_text_opacity = pro_button_text_in * pro_button_text_out;
const pro_button_text_x = 0;
const pro_button_text_y = 140;
const pro_button_text_fontSize = 24;

// Best value badge
const best_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const best_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const best_opacity = best_in * best_out;
const best_scale = interpolate(frame, [60, 150], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const best_x = 100;
const best_y = -240;
const best_fontSize = 24;
const best_fontWeight = "bold";

// Business card
const business_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_opacity = business_in * business_out;
const business_w = 200;
const business_h = 300;
const business_x = 480;
const business_y = 0;

// Business text
const business_text_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_text_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_text_opacity = business_text_in * business_text_out;
const business_text_x = 480;
const business_text_y = -140;
const business_text_fontSize = 48;
const business_text_fontWeight = "bold";

// Business features
const business_features_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_features_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_features_opacity = business_features_in * business_features_out;
const business_features_x = 480;
const business_features_y = 0;
const business_features_fontSize = 24;

// Business button
const business_button_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_button_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_button_opacity = business_button_in * business_button_out;
const business_button_w = 150;
const business_button_h = 50;
const business_button_x = 480;
const business_button_y = 140;
const business_button_corner = 10;

// Business button text
const business_button_text_in = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_button_text_out = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const business_button_text_opacity = business_button_text_in * business_button_text_out;
const business_button_text_x = 480;
const business_button_text_y = 140;
const business_button_text_fontSize = 24;

const absStyle = { backgroundColor: "#F5F5F5", overflow: "hidden" };

// Transforms
const starter_transform = "translate(-50%, -50%) translateX(" + starter_x + "px) translateY(" + starter_y + "px)";
const starter_text_transform = "translate(-50%, -50%) translateX(" + starter_text_x + "px) translateY(" + starter_text_y + "px)";
const starter_features_transform = "translate(-50%, -50%) translateX(" + starter_features_x + "px) translateY(" + starter_features_y + "px)";
const starter_button_transform = "translate(-50%, -50%) translateX(" + starter_button_x + "px) translateY(" + starter_button_y + "px)";
const starter_button_text_transform = "translate(-50%, -50%) translateX(" + starter_button_text_x + "px) translateY(" + starter_button_text_y + "px)";

const pro_transform = "translate(-50%, -50%) translateX(" + pro_x + "px) translateY(" + pro_y + "px) scale(" + pro_scale + ")";
const pro_text_transform = "translate(-50%, -50%) translateX(" + pro_text_x + "px) translateY(" + pro_text_y + "px) scale(" + pro_scale + ")";
const pro_features_transform = "translate(-50%, -50%) translateX(" + pro_features_x + "px) translateY(" + pro_features_y + "px) scale(" + pro_scale + ")";
const pro_button_transform = "translate(-50%, -50%) translateX(" + pro_button_x + "px) translateY(" + pro_button_y + "px) scale(" + pro_scale + ")";
const pro_button_text_transform = "translate(-50%, -50%) translateX(" + pro_button_text_x + "px) translateY(" + pro_button_text_y + "px) scale(" + pro_scale + ")";

const best_transform = "translate(-50%, -50%) translateX(" + best_x + "px) translateY(" + best_y + "px) scale(" + best_scale + ")";

const business_transform = "translate(-50%, -50%) translateX(" + business_x + "px) translateY(" + business_y + "px)";
const business_text_transform = "translate(-50%, -50%) translateX(" + business_text_x + "px) translateY(" + business_text_y + "px)";
const business_features_transform = "translate(-50%, -50%) translateX(" + business_features_x + "px) translateY(" + business_features_y + "px)";
const business_button_transform = "translate(-50%, -50%) translateX(" + business_button_x + "px) translateY(" + business_button_y + "px)";
const business_button_text_transform = "translate(-50%, -50%) translateX(" + business_button_text_x + "px) translateY(" + business_button_text_y + "px)";

return (
  <AbsoluteFill style={absStyle}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: starter_transform, width: starter_w + "px", height: starter_h + "px", backgroundColor: "#E0E0E0", borderRadius: "0px", opacity: starter_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: starter_text_transform, color: "#000000", fontSize: starter_text_fontSize + "px", fontWeight: starter_text_fontWeight, fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: starter_text_opacity, zIndex: 2 }}>
      $19/mo
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: starter_features_transform, color: "#333333", fontSize: starter_features_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: starter_features_opacity, zIndex: 2 }}>
      Features
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: starter_button_transform, width: starter_button_w + "px", height: starter_button_h + "px", backgroundColor: "#4CAF50", borderRadius: starter_button_corner + "px", opacity: starter_button_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: starter_button_text_transform, color: "#FFFFFF", fontSize: starter_button_text_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: starter_button_text_opacity, zIndex: 3 }}>
      Choose Starter
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: pro_transform, width: pro_w + "px", height: pro_h + "px", backgroundColor: "#2196F3", borderRadius: "0px", opacity: pro_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: pro_text_transform, color: "#FFFFFF", fontSize: pro_text_fontSize + "px", fontWeight: pro_text_fontWeight, fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: pro_text_opacity, zIndex: 2 }}>
      $49/mo
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: pro_features_transform, color: "#333333", fontSize: pro_features_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: pro_features_opacity, zIndex: 2 }}>
      Features
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: pro_button_transform, width: pro_button_w + "px", height: pro_button_h + "px", backgroundColor: "#4CAF50", borderRadius: pro_button_corner + "px", opacity: pro_button_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: pro_button_text_transform, color: "#FFFFFF", fontSize: pro_button_text_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: pro_button_text_opacity, zIndex: 3 }}>
      Choose Pro
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: best_transform, color: "#FDD835", fontSize: best_fontSize + "px", fontWeight: best_fontWeight, fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: best_opacity, zIndex: 4 }}>
      Best Value
    </div>

    <div style={{ position: "absolute", left: "50%", top: "50%", transform: business_transform, width: business_w + "px", height: business_h + "px", backgroundColor: "#E0E0E0", borderRadius: "0px", opacity: business_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: business_text_transform, color: "#000000", fontSize: business_text_fontSize + "px", fontWeight: business_text_fontWeight, fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: business_text_opacity, zIndex: 2 }}>
      $99/mo
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: business_features_transform, color: "#333333", fontSize: business_features_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: business_features_opacity, zIndex: 2 }}>
      Features
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: business_button_transform, width: business_button_w + "px", height: business_button_h + "px", backgroundColor: "#4CAF50", borderRadius: business_button_corner + "px", opacity: business_button_opacity, zIndex: 1 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: business_button_text_transform, color: "#FFFFFF", fontSize: business_button_text_fontSize + "px", fontWeight: "normal", fontFamily: "Arial", whiteSpace: "nowrap", lineHeight: "1", letterSpacing: "0px", textAlign: "center", textTransform: "none", userSelect: "none", pointerEvents: "none", opacity: business_button_text_opacity, zIndex: 3 }}>
      Choose Business
    </div>
  </AbsoluteFill>
);
};
