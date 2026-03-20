let loaded = false;

/** Load all fonts used by the typography system. Safe to call multiple times. */
export function ensureFontsLoaded(): void {
  if (loaded) return;
  // Avoid bundler/runtime interop issues by loading these packages dynamically.
  // Also keeps initial client bundle smaller.
  void (async () => {
    const [
      { loadFont: loadInter },
      { loadFont: loadSpaceGrotesk },
      { loadFont: loadPlusJakartaSans },
      { loadFont: loadPlayfairDisplay },
    ] =
      await Promise.all([
        import("@remotion/google-fonts/Inter"),
        import("@remotion/google-fonts/SpaceGrotesk"),
        import("@remotion/google-fonts/PlusJakartaSans"),
        import("@remotion/google-fonts/PlayfairDisplay"),
      ]);
    loadInter();
    loadSpaceGrotesk();
    loadPlusJakartaSans();
    loadPlayfairDisplay();
    loaded = true;
  })();
}
