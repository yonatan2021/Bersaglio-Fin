// U+0590-05FF: Hebrew block. U+FB1D-FB4F: Hebrew Presentation Forms.
const HEBREW_RE = /[֐-׿יִ-ﭏ]/;

function isHebrew(ch: string): boolean {
  return HEBREW_RE.test(ch);
}

// Split text into directional runs. Whitespace gets its own neutral run.
function getRuns(text: string): Array<{ text: string; hebrew: boolean }> {
  const runs: Array<{ text: string; hebrew: boolean }> = [];
  const chars = [...text];
  let i = 0;

  while (i < chars.length) {
    if (/\s/.test(chars[i])) {
      let j = i;
      while (j < chars.length && /\s/.test(chars[j])) j++;
      runs.push({ text: chars.slice(i, j).join(''), hebrew: false });
      i = j;
    } else {
      const hebrew = isHebrew(chars[i]);
      let j = i + 1;
      while (j < chars.length && !/\s/.test(chars[j]) && isHebrew(chars[j]) === hebrew) j++;
      runs.push({ text: chars.slice(i, j).join(''), hebrew });
      i = j;
    }
  }

  return runs;
}

// Convert Hebrew string from logical order to visual order for non-BiDi terminals.
// Strategy: reverse run sequence (RTL paragraph), reverse chars within Hebrew runs.
// LTR prefix (emoji etc.) is preserved as-is.
export function visualHebrew(str: string): string {
  if (!str || !HEBREW_RE.test(str)) return str;

  const chars = [...str];
  const firstHeb = chars.findIndex(isHebrew);
  if (firstHeb === -1) return str;

  let lastHeb = chars.length - 1;
  while (lastHeb > firstHeb && !isHebrew(chars[lastHeb])) lastHeb--;

  const prefix = chars.slice(0, firstHeb).join('');
  const middle = chars.slice(firstHeb, lastHeb + 1).join('');
  const suffix = chars.slice(lastHeb + 1).join('');

  const visual = getRuns(middle)
    .reverse()
    .map(r => (r.hebrew ? [...r.text].reverse().join('') : r.text))
    .join('');

  return prefix + visual + suffix;
}
