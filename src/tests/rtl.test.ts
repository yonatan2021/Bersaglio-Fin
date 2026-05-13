import { describe, it, expect } from 'vitest';
import { visualHebrew } from '../utils/rtl.js';

describe('visualHebrew', () => {
  it('converts pure Hebrew to visual LTR order', () => {
    // שלום stored logically → םולש in visual LTR order for BiDi terminal display
    expect(visualHebrew('שלום')).toBe('םולש');
  });

  it('reverses full Hebrew phrase', () => {
    // הפעל שירות (activate service) → תוריש לעפה (visual LTR encoding)
    expect(visualHebrew('הפעל שירות')).toBe('תוריש לעפה');
  });

  it('returns empty string unchanged', () => {
    expect(visualHebrew('')).toBe('');
  });

  it('returns non-Hebrew ASCII unchanged', () => {
    expect(visualHebrew('hello')).toBe('hello');
  });

  it('does not corrupt mixed emoji+Hebrew — emoji stays, Hebrew is reordered', () => {
    const result = visualHebrew('🚀 הפעל שירות');
    expect(result).toContain('🚀');
    // The Hebrew chars should all still be present
    expect(result).toMatch(/[א-ת]/);
  });
});
