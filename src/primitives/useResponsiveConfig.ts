import { useVideoConfig } from "remotion";

/**
 * Provides responsive layout helpers derived from the current Remotion composition dimensions.
 * Use this in every template to replace hardcoded pixel values.
 */
export function useResponsiveConfig() {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const isSquare = width === height;
  const isLandscape = width > height;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  // Scale factor relative to 1080 (the "base" short side for 1920x1080)
  const scale = shortSide / 1080;

  return {
    width,
    height,
    isPortrait,
    isSquare,
    isLandscape,
    shortSide,
    longSide,
    scale,
  };
}
