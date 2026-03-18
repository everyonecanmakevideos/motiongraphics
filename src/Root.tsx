import { Composition } from "remotion";
import { GeneratedMotion } from "./GeneratedMotion";
import { TemplateRouter } from "./TemplateRouter";
import { SceneSequencer } from "./SceneSequencer";
import { ensureFontsLoaded } from "./primitives/fonts";

ensureFontsLoaded();

// Read duration from environment variable, fallback to 120 frames (4s)
const durationInFrames = parseInt(
  process.env.REMOTION_APP_DURATION_FRAMES || "120",
  10
);

const videoWidth = parseInt(
  process.env.REMOTION_APP_VIDEO_WIDTH || "1920",
  10
);

const videoHeight = parseInt(
  process.env.REMOTION_APP_VIDEO_HEIGHT || "1080",
  10
);

export const RemotionRoot = () => {
  console.log("Duration received:", durationInFrames);
  return (
    <>
      <Composition
        id="GeneratedMotion"
        component={GeneratedMotion}
        durationInFrames={durationInFrames}
        fps={30}
        width={videoWidth}
        height={videoHeight}
      />
      <Composition
        id="TemplateScene"
        component={TemplateRouter}
        durationInFrames={durationInFrames}
        fps={30}
        width={videoWidth}
        height={videoHeight}
        defaultProps={{
          templateId: "hero-text",
          params: {},
        }}
      />
      <Composition
        id="SceneSequence"
        component={SceneSequencer as React.FC<Record<string, unknown>>}
        durationInFrames={durationInFrames}
        fps={30}
        width={videoWidth}
        height={videoHeight}
        defaultProps={{
          scenes: [],
        }}
      />
    </>
  );
};
