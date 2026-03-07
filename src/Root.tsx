
import { Composition } from "remotion";
import { GeneratedMotion } from "./GeneratedMotion";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GeneratedMotion"
        component={GeneratedMotion}
        durationInFrames={360}
        fps={30}
        width={720}
        height={720}
      />
    </>
  );
};
