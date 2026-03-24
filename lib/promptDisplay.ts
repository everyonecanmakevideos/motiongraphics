export function getDisplayPrompt(prompt: string): string {
  const marker = "\n\nConstraints:\n- Aspect ratio:";
  const markerIndex = prompt.indexOf(marker);
  if (markerIndex === -1) return prompt.trim();
  return prompt.slice(0, markerIndex).trim();
}
