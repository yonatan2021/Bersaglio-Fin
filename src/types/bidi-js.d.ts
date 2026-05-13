declare module 'bidi-js' {
  interface EmbeddingLevels {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }

  interface BidiInstance {
    getEmbeddingLevels(str: string, baseDirection?: 'ltr' | 'rtl' | 'auto'): EmbeddingLevels;
    getReorderSegments(str: string, embeddingLevels: EmbeddingLevels): Array<[number, number]>;
  }

  function bidiFactory(): BidiInstance;
  export default bidiFactory;
}
