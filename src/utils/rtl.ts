// LRO (U+202D) forces the terminal's BiDi engine to display all following
// characters left-to-right, overriding Hebrew's natural RTL property.
// PDF (U+202C) closes the override scope.
// This prevents macOS Terminal from reversing Hebrew text in LTR UI contexts.
const LRO = '‭';
const PDF = '‬';

// Wrap Hebrew string so terminal BiDi does not reverse it.
// Call on plain strings BEFORE chalk/ANSI decoration.
export function visualHebrew(str: string): string {
  if (!str) return str;
  return `${LRO}${str}${PDF}`;
}
