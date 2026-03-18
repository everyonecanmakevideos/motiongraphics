import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadPlusJakartaSans } from "@remotion/google-fonts/PlusJakartaSans";

let loaded = false;

/** Load all fonts used by the typography system. Safe to call multiple times. */
export function ensureFontsLoaded(): void {
  if (loaded) return;
  loadInter();
  loadSpaceGrotesk();
  loadPlusJakartaSans();
  loaded = true;
}
