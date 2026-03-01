/**
 * Lightweight haptic feedback  progressive enhancement.
 * Android Chrome honours navigator.vibrate(); iOS silently ignores it.
 */
export function vibrate(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
