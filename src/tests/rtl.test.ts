import { describe, it, expect } from 'vitest';
import { visualHebrew } from '../utils/rtl.js';

const LRO = '‭';
const PDF = '‬';

describe('visualHebrew', () => {
  it('wraps Hebrew string with LRO/PDF override markers', () => {
    const result = visualHebrew('שלום');
    expect(result).toBe(`${LRO}שלום${PDF}`);
  });

  it('preserves Hebrew text unchanged between markers', () => {
    const result = visualHebrew('הפעל שירות');
    expect(result).toBe(`${LRO}הפעל שירות${PDF}`);
  });

  it('returns empty string unchanged', () => {
    expect(visualHebrew('')).toBe('');
  });

  it('wraps ASCII text with LRO/PDF markers', () => {
    const result = visualHebrew('hello');
    expect(result).toBe(`${LRO}hello${PDF}`);
  });

  it('preserves emoji and Hebrew in mixed content', () => {
    const result = visualHebrew('🚀 הפעל שירות');
    expect(result).toBe(`${LRO}🚀 הפעל שירות${PDF}`);
  });
});
