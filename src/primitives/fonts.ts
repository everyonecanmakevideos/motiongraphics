/**
 * Remotion renders should stay offline-safe. The typography system already
 * declares fallback stacks, so we intentionally avoid remote Google Fonts
 * requests during render startup.
 */
export function ensureFontsLoaded(): void {
  // Intentionally left blank. Add local @font-face assets here if you want
  // pixel-perfect branded fonts without relying on network access.
}
