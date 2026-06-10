/**
 * useActiveSeed
 * Global shared state for the currently rendered gem seed.
 * Used by both the page UI and the favicon plugin.
 */
export function useActiveSeed() {
  return useState<string>('activeSeed', () => 'seedstone')
}
