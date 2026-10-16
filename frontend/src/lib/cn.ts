/**
 * Minimal class-name joiner. Avoids pulling in a dependency for a few lines.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
