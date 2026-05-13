import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

// Convert logical-order Hebrew string to visual order for LTR terminal display.
// MUST be called on plain strings BEFORE chalk/ANSI decoration — bidi-js cannot
// process ANSI escape codes and will corrupt colored output if called after chalk.
export function visualHebrew(str: string): string {
  if (!str) return str;
  const embeddingLevels = bidi.getEmbeddingLevels(str, 'rtl');
  const segments = bidi.getReorderSegments(str, embeddingLevels);
  const chars = [...str]; // spread handles surrogate pairs and emoji correctly
  for (const [start, end] of segments) {
    const reversed = chars.slice(start, end + 1).reverse();
    chars.splice(start, end - start + 1, ...reversed);
  }
  return chars.join('');
}
