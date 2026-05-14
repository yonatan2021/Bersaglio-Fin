const LRO = '‭';
const PDF = '‬';

// Wrap text with LRO/PDF Unicode BiDi override markers for correct terminal display.
export function visualHebrew(str: string): string {
  if (!str) return str;
  return `${LRO}${str}${PDF}`;
}
